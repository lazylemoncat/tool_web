# Auth System Hardening Design

## Context

Current login/registration system (feature_login branch) needs hardening across 4 dimensions:
security, UX, feature consistency, and code quality. Ten specific improvements identified from
code review.

## Design

### 1. httpOnly Cookie for Token Storage

**Problem**: JWT stored in localStorage, vulnerable to XSS exfiltration.

**Design**:
- Backend sets `Set-Cookie: token=<jwt>; HttpOnly; SameSite=Strict; Path=/api; Max-Age=86400`
  on login/register success
- `get_current_user` reads token from cookie first, falls back to `Authorization` header
- Axios config: `withCredentials: true`
- New `POST /api/v1/auth/logout` clears cookie server-side (`Set-Cookie: token=; Max-Age=0`)
- CORS already has `allow_credentials=True`, compatible

**Files**: `routers/auth.py`, `middleware/auth.py`, `api/client.ts`, `context/AuthContext.tsx`

### 2. Token Refresh

**Problem**: 24h fixed expiry, expired → 401 → page reload, loss of work state.

**Design**:
- New `POST /api/v1/auth/refresh` - accepts current cookie token (valid or within 7-day grace),
  validates signature, issues new token with fresh cookie
- Grace period: token expired ≤ 7 days → reissue; > 7 days → re-login required
- Frontend: Axios response interceptor on 401 → call `/refresh` → retry original request;
  if refresh fails → clear state, redirect to login
- Token expiry: 24h default, 7 days with "remember me"

**Files**: `routers/auth.py`, `utils/security.py`, `api/client.ts`

### 3. Remember Me

**Problem**: No persistent login option.

**Design**:
- Frontend: checkbox on login form, i18n key `auth.rememberMe`
- `LoginRequest` schema: add `remember_me: bool = False`
- Backend: if true, `JWT_EXPIRE_HOURS = 168` (7d), cookie Max-Age matches
- Refresh grace period extended to 30 days for remember-me tokens

**Files**: `schemas/auth.py`, `routers/auth.py`, `utils/security.py`, `AuthPage.tsx`, locales

### 4. Password Strength

**Problem**: min 4 chars, no complexity requirement.

**Design**:
- `RegisterRequest.password` / `ChangePasswordRequest.new_password`: min_length=8
- Pydantic `@field_validator`: must contain ≥1 letter and ≥1 digit
- Error: `"Password must be at least 8 characters with at least 1 letter and 1 digit"`
- Frontend: simple 3-tier indicator (red/yellow/green) next to password input
  - Weak: < 8 chars or only one character type
  - Medium: ≥ 8 chars + letters and digits
  - Strong: ≥ 8 chars + letters + digits + special char

**Files**: `schemas/auth.py`, `AuthPage.tsx`, `AccountSettings.tsx`, locales, `index.css`

### 5. Per-Account Login Lockout

**Problem**: Only IP rate limiting, no brute-force protection per account.

**Design**:
- `User` model: add `failed_login_attempts: int = 0`, `locked_until: datetime | None`
- Login: on failure, `failed_login_attempts += 1`; if ≥ 5, set `locked_until = now + 15min`
- Login: on success, reset both fields to 0 / None
- Locked accounts: return 423 with `"Account locked due to too many failed attempts, please try again in {n} minutes"`
- Rate limit middleware: add 423 to known error mapping

**Files**: `models/user.py`, `routers/auth.py`, `database.py` (migration), `errorMapping.ts`, locales

### 6. Password Visibility Toggle

**Problem**: No way to see typed password, causes typos on mobile.

**Design**:
- Eye/eye-off icon button inside password input (right-aligned)
- Toggle `type="password"` ↔ `type="text"`
- Apply to: AuthPage (login + register), AccountSettings (old/new/confirm)
- Pure frontend, no backend change

**Files**: `AuthPage.tsx`, `AccountSettings.tsx`, `index.css`

### 7. AuthPage Tab Switch Behavior

**Problem**: Switching login↔register clears error but keeps form data. Inconsistent.

**Design**:
- Tab switch clears: error + username + password
- `onClick={() => { setTab('login'); setError(''); setUsername(''); setPassword('') }}`

**Files**: `AuthPage.tsx`

### 8. AuthContext Architecture

**Problem**: AccountSettings imports api directly, bypassing AuthContext. Inconsistent.

**Design**:
- AuthContext: add `changePassword(oldPassword, newPassword)` and `deleteAccount(password)`
- These manage loading states and call api internally, same pattern as login/register
- AccountSettings: use `const { changePassword, deleteAccount } = useAuth()`
- Remove direct api import from AccountSettings

**Files**: `context/AuthContext.tsx`, `components/auth/AccountSettings.tsx`

### 9. Security Event Logging

**Problem**: No audit trail for security-sensitive operations.

**Design**:
- Logger: `logging.getLogger("tool_web.security")`, same file handler (`backend/logs/app.log`)
- Log events at INFO level: login success/failure (username, client IP), register success,
  password change success/failure, account deletion, token refresh, account lockout
- Format: `timestamp | SECURITY | event=<name> username=<user> ip=<ip> [detail=<extra>]`
- No database table - file logging sufficient for personal tool

**Files**: `routers/auth.py`, `middleware/logging.py`

### 10. Client-Side Token Expiry Check

**Problem**: All requests wait for 401 before knowing token is expired.

**Design**:
- New `frontend/src/utils/token.ts`:
  - `decodeTokenPayload(token)` - base64 decode JWT body
  - `isTokenExpired(token)` - check exp vs now
  - `getTokenRemainingMs(token)` - ms until expiry
- Axios request interceptor: if token expires within 5 min, call `/refresh` first,
  then proceed with original request
- Avoids mid-request 401 disruption

**Files**: `utils/token.ts` (new), `api/client.ts`

## Implementation Order

| Phase | Steps | Depends On |
|-------|-------|-----------|
| Phase 1: Backend foundation | User model migration, password strength schema, security logging setup, login lockout | Nothing |
| Phase 2: Cookie + refresh | httpOnly cookie set/clear, /refresh endpoint, /logout endpoint, token utils | Phase 1 |
| Phase 3: Frontend infrastructure | token.ts, AuthContext refactor, error mapping update, locales | Phase 2 |
| Phase 4: Frontend UI | Remember me checkbox, password visibility toggle, tab switch fix, strength indicator | Phase 3 |
| Phase 5: Docs | Update auth.md | Phase 4 |

## Verification

1. Login → verify httpOnly cookie set in browser DevTools (no token in localStorage)
2. Refresh page → still logged in (cookie persists)
3. Wait token expiry → next API call auto-refreshes without disruption
4. 5 wrong passwords → account locked 15 min → correct password rejected with 423
5. Password visibility toggle works on all password fields
6. Remember me → token lasts 7 days
7. Password strength indicator shows on register + change password
8. Tab switch clears all form state
9. Security events appear in backend/logs/app.log
10. `docs/auth.md` reflects all changes
