# Auth System Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden login/registration across 4 dimensions: security (httpOnly cookie, password strength, login lockout, token refresh), UX (password visibility, remember me, tab switch), feature consistency (AuthContext refactor), and observability (security logging).

**Architecture:** Backend switches JWT delivery from response body to httpOnly cookie with Authorization header fallback. New /refresh and /logout endpoints. User model gains lockout fields. Frontend switches from localStorage token to cookie-based auth with in-memory token for expiry checks, refactors AccountSettings into AuthContext, and adds UX polish.

**Tech Stack:** FastAPI (Python 3.12), SQLAlchemy 2.0, PyJWT, bcrypt, React 19, TypeScript, Axios, Vite

---

### Task 1: User model — add lockout fields

**Files:**
- Modify: `backend/src/models/user.py`

- [ ] **Step 1: Add failed_login_attempts and locked_until columns to User model**

```python
"""
用户模型.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship

from .todo import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    is_admin = Column(Boolean, default=False)
    preferences = Column(JSON, default=lambda: {"theme": "system", "language": "zh", "default_status_filter": "active"})
    created_at = Column(DateTime, default=datetime.utcnow)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True, default=None)

    folders = relationship("Folder", back_populates="user", cascade="all, delete-orphan")
    todos = relationship("Todo", back_populates="user", cascade="all, delete-orphan")
    themes = relationship("UserTheme", back_populates="user", cascade="all, delete-orphan")
```

- [ ] **Step 2: Add migration in database.py**

In `_migrate_schema()`, after the existing `folders` column checks, add:

```python
    # Task 1: auth hardening — failed_login_attempts and locked_until columns
    user_columns = {c["name"] for c in inspector.get_columns("users")}
    if "failed_login_attempts" not in user_columns:
        logger.info("Migrating schema: adding failed_login_attempts column to users")
        with engine.connect() as conn:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0")
            )
            conn.commit()

    if "locked_until" not in user_columns:
        logger.info("Migrating schema: adding locked_until column to users")
        with engine.connect() as conn:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN locked_until DATETIME")
            )
            conn.commit()
```

Insert this block after the `if "user_id" not in columns:` block (before the closing of `_migrate_schema`).

- [ ] **Step 3: Verify migration works**

```bash
cd backend && .venv/Scripts/python.exe -c "from src.database import init_db; init_db(); print('Migration OK')"
```

Expected: "Migration OK" with no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/models/user.py backend/src/database.py
git commit -m "feat: add failed_login_attempts and locked_until fields to User model"
```

---

### Task 2: Security event logging

**Files:**
- Modify: `backend/src/middleware/logging.py`

- [ ] **Step 1: Add get_security_logger function**

Add to `logging.py` after the existing `_get_logger` function and before `log_requests`:

```python
_security_logger: logging.Logger | None = None


def get_security_logger() -> logging.Logger:
    """Returns a logger for security events (login, password change, account deletion)."""
    global _security_logger
    if _security_logger is not None:
        return _security_logger

    _security_logger = logging.getLogger("tool_web.security")
    _security_logger.setLevel(logging.INFO)

    if not _security_logger.handlers:
        fmt = logging.Formatter(
            "%(asctime)s | SECURITY | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        console = logging.StreamHandler()
        console.setFormatter(fmt)
        _security_logger.addHandler(console)

        os.makedirs(LOG_DIR, exist_ok=True)
        file_handler = RotatingFileHandler(
            os.path.join(LOG_DIR, "app.log"),
            maxBytes=5 * 1024 * 1024,
            backupCount=5,
            encoding="utf-8",
        )
        file_handler.setFormatter(fmt)
        _security_logger.addHandler(file_handler)

    return _security_logger
```

- [ ] **Step 2: Verify import**

```bash
cd backend && .venv/Scripts/python.exe -c "from src.middleware.logging import get_security_logger; logger = get_security_logger(); logger.info('test=ok'); print('Security logger OK')"
```

Expected: "Security logger OK"

- [ ] **Step 3: Commit**

```bash
git add backend/src/middleware/logging.py
git commit -m "feat: add security event logger"
```

---

### Task 3: Password strength validation

**Files:**
- Modify: `backend/src/schemas/auth.py`
- Modify: `frontend/src/utils/errorMapping.ts`
- Modify: `frontend/src/locales/zh.json`
- Modify: `frontend/src/locales/en.json`

- [ ] **Step 1: Add password validator to schemas/auth.py**

Change `RegisterRequest` and `ChangePasswordRequest`:

```python
"""
认证相关 Pydantic 模型.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Any
import re


class RegisterRequest(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    password: str = Field(min_length=8, max_length=100)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[a-zA-Z]", v) or not re.search(r"\d", v):
            raise ValueError(
                "Password must be at least 8 characters with at least 1 letter and 1 digit"
            )
        return v


class LoginRequest(BaseModel):
    username: str
    password: str
    remember_me: bool = False


class AuthResponse(BaseModel):
    token: str
    username: str
    preferences: dict[str, Any] = {}


class UpdatePreferencesRequest(BaseModel):
    preferences: dict[str, Any]


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=100)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[a-zA-Z]", v) or not re.search(r"\d", v):
            raise ValueError(
                "Password must be at least 8 characters with at least 1 letter and 1 digit"
            )
        return v


class DeleteAccountRequest(BaseModel):
    password: str = Field(min_length=1)
```

- [ ] **Step 2: Add new error mapping entries in errorMapping.ts**

In `VALIDATION_FRAGMENT_TO_I18N` array, add after the existing entries:

```typescript
  [/password.*at least 8 characters/i, "errors.passwordTooShort"],
  [/password.*at least 1 letter and 1 digit/i, "errors.passwordWeak"],
```

Also add to `API_ERROR_TO_I18N`:

```typescript
  "Account locked due to too many failed attempts, please try again in {n} minutes": "errors.accountLocked",
```

And add a new pattern for the dynamic lockout message:

```typescript
const LOCKOUT_PATTERN = /^Account locked due to too many failed attempts, please try again in (\d+) minutes$/
```

Handle in `mapErrorMessage` before the NOT_FOUND pattern:

```typescript
  // "Account locked ... in {n} minutes" pattern
  const lockoutMatch = raw.match(LOCKOUT_PATTERN)
  if (lockoutMatch) {
    return { i18nKey: "errors.accountLocked", vars: { n: lockoutMatch[1] } }
  }
```

- [ ] **Step 3: Add new i18n keys**

In `zh.json` errors section, add:
```json
"passwordWeak": "密码需包含至少1个字母和1个数字",
"accountLocked": "账户因多次登录失败已被锁定, 请{n}分钟后再试"
```

In `en.json` errors section, add:
```json
"passwordWeak": "Password must contain at least 1 letter and 1 digit",
"accountLocked": "Account locked due to too many failed attempts, please try again in {n} minutes"
```

In `zh.json` auth section, add:
```json
"rememberMe": "记住我",
"showPassword": "显示密码",
"hidePassword": "隐藏密码",
"passwordStrength": "密码强度",
"strengthWeak": "弱",
"strengthMedium": "中",
"strengthStrong": "强"
```

In `en.json` auth section, add:
```json
"rememberMe": "Remember me",
"showPassword": "Show password",
"hidePassword": "Hide password",
"passwordStrength": "Password strength",
"strengthWeak": "Weak",
"strengthMedium": "Medium",
"strengthStrong": "Strong"
```

- [ ] **Step 4: Verify backend validation**

```bash
cd backend && .venv/Scripts/python.exe -c "
from src.schemas.auth import RegisterRequest
try:
    RegisterRequest(username='test', password='short')
except Exception as e:
    print(f'Validation error: {e}')
" 2>&1
```

Expected: Validation error mentioning "at least 8 characters"

- [ ] **Step 5: Commit**

```bash
git add backend/src/schemas/auth.py frontend/src/utils/errorMapping.ts frontend/src/locales/zh.json frontend/src/locales/en.json
git commit -m "feat: enforce password strength (min 8 chars, 1 letter + 1 digit)"
```

---

### Task 4: Login lockout logic

**Files:**
- Modify: `backend/src/routers/auth.py`
- Modify: `backend/src/utils/errors.py`

- [ ] **Step 1: Update errors.py — change UnauthorizedError default message and add account locked check**

The `login` endpoint needs to:
1. Find user by username
2. Check if account is locked (locked_until > now)
3. If locked, raise error with remaining minutes
4. Verify password
5. On failure: increment attempts, set locked_until if >= 5
6. On success: reset attempts and locked_until

```python
"""
认证路由: /api/v1/auth/register, /api/v1/auth/login, /me, /preferences, /password, /account.
"""

import math
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..middleware.auth import get_current_user
from ..middleware.logging import get_security_logger
from ..models.user import User
from ..schemas.auth import (
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    UpdatePreferencesRequest,
    ChangePasswordRequest,
    DeleteAccountRequest,
)
from ..utils.errors import BadRequestError, ConflictError, UnauthorizedError
from ..utils.security import (
    hash_password,
    verify_password,
    create_token,
    decode_token,
    JWT_EXPIRE_HOURS,
    JWT_EXPIRE_HOURS_REMEMBER,
)
from ..utils.rate_limit import RATE_LIMIT_WINDOW

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
sec_log = get_security_logger()

MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def _auth_response(user: User, remember_me: bool = False) -> AuthResponse:
    token = create_token(user.id, user.username, remember_me=remember_me)
    return AuthResponse(
        token=token,
        username=user.username,
        preferences=user.preferences or {},
    )


def _set_token_cookie(response: Response, token: str, remember_me: bool = False):
    max_age = (JWT_EXPIRE_HOURS_REMEMBER if remember_me else JWT_EXPIRE_HOURS) * 3600
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        samesite="strict",
        path="/api",
        max_age=max_age,
        secure=False,  # set True in production with HTTPS
    )


def _clear_token_cookie(response: Response):
    response.set_cookie(
        key="token",
        value="",
        httponly=True,
        samesite="strict",
        path="/api",
        max_age=0,
    )


def _get_client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(body: RegisterRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise ConflictError("Username already exists")

    user = User(
        username=body.username,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    sec_log.info(
        "event=register_success username=%s ip=%s",
        user.username,
        _get_client_ip(request),
    )
    auth_resp = _auth_response(user)
    _set_token_cookie(response, auth_resp.token)
    return auth_resp


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()

    # Check account lockout
    if user and user.locked_until:
        now_utc = datetime.now(timezone.utc)
        if user.locked_until > now_utc:
            remaining = math.ceil((user.locked_until - now_utc).total_seconds() / 60)
            raise BadRequestError(
                f"Account locked due to too many failed attempts, please try again in {remaining} minutes"
            )
        else:
            # Lockout period expired, reset
            user.locked_until = None
            user.failed_login_attempts = 0

    if not user or not verify_password(body.password, user.password_hash):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
                sec_log.warning(
                    "event=account_locked username=%s ip=%s attempts=%d",
                    user.username,
                    _get_client_ip(request),
                    user.failed_login_attempts,
                )
            db.commit()
            sec_log.warning(
                "event=login_failure username=%s ip=%s",
                body.username,
                _get_client_ip(request),
            )
        raise UnauthorizedError("Invalid username or password")

    # Login success — reset lockout counters
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    sec_log.info(
        "event=login_success username=%s ip=%s",
        user.username,
        _get_client_ip(request),
    )
    auth_resp = _auth_response(user, remember_me=body.remember_me)
    _set_token_cookie(response, auth_resp.token, remember_me=body.remember_me)
    return auth_resp


@router.get("/me", response_model=AuthResponse)
def me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _auth_response(current_user)


@router.put("/preferences", status_code=204)
def update_preferences(
    body: UpdatePreferencesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.preferences = body.preferences
    db.commit()


@router.put("/password", status_code=204)
def change_password(
    body: ChangePasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.old_password, current_user.password_hash):
        sec_log.warning(
            "event=password_change_failure username=%s ip=%s reason=wrong_old_password",
            current_user.username,
            _get_client_ip(request),
        )
        raise BadRequestError("Current password is incorrect")

    current_user.password_hash = hash_password(body.new_password)
    db.commit()
    sec_log.info(
        "event=password_change_success username=%s ip=%s",
        current_user.username,
        _get_client_ip(request),
    )


@router.delete("/account", status_code=204)
def delete_account(
    body: DeleteAccountRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.password, current_user.password_hash):
        raise BadRequestError("Password is incorrect")

    username = current_user.username
    db.delete(current_user)
    db.commit()
    sec_log.info(
        "event=account_deleted username=%s ip=%s",
        username,
        _get_client_ip(request),
    )
```

- [ ] **Step 2: Verify login lockout in Python**

```bash
cd backend && .venv/Scripts/python.exe -c "
from src.database import init_db, SessionLocal
from src.models.user import User
from src.utils.security import hash_password

init_db()
db = SessionLocal()
# ensure testuser exists
u = db.query(User).filter(User.username == 'locktest').first()
if not u:
    u = User(username='locktest', password_hash=hash_password('correct123'))
    db.add(u)
    db.commit()
print(f'Before: attempts={u.failed_login_attempts}, locked_until={u.locked_until}')
db.close()
print('OK')
"
```

Expected: "Before: attempts=0, locked_until=None" then "OK"

- [ ] **Step 3: Run existing tests to check for regressions**

```bash
cd backend && .venv/Scripts/python.exe -m pytest tests/test_auth.py -v
```

All 6 auth tests should still pass.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routers/auth.py backend/src/utils/errors.py
git commit -m "feat: add per-account login lockout (5 failures → 15 min) and security event logging"
```

---

### Task 5: JWT — remember-me support and decode with grace period

**Files:**
- Modify: `backend/src/utils/security.py`

- [ ] **Step 1: Update security.py with remember_me support and grace-period decode**

```python
"""
密码哈希与 JWT token 工具.
"""

import os
import secrets
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

import bcrypt
import jwt

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable must be set")

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24
JWT_EXPIRE_HOURS_REMEMBER = 168  # 7 days
REFRESH_GRACE_DAYS = 7
REFRESH_GRACE_DAYS_REMEMBER = 30


def generate_secret_key() -> str:
    return secrets.token_urlsafe(64)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_token(user_id: int, username: str, remember_me: bool = False) -> str:
    expire_hours = JWT_EXPIRE_HOURS_REMEMBER if remember_me else JWT_EXPIRE_HOURS
    payload = {
        "sub": str(user_id),
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=expire_hours),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str, verify_exp: bool = True) -> dict:
    options = {} if verify_exp else {"verify_exp": False}
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], options=options)


def decode_token_with_grace(token: str, remember_me: bool = False) -> dict:
    """Decode token with grace period: allow expired tokens within grace window."""
    grace_days = REFRESH_GRACE_DAYS_REMEMBER if remember_me else REFRESH_GRACE_DAYS
    try:
        return decode_token(token, verify_exp=True)
    except jwt.ExpiredSignatureError:
        # Accept expired token within grace period
        payload = decode_token(token, verify_exp=False)
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        if now - exp <= timedelta(days=grace_days):
            return payload
        raise
```

- [ ] **Step 2: Verify import**

```bash
cd backend && .venv/Scripts/python.exe -c "from src.utils.security import JWT_EXPIRE_HOURS, JWT_EXPIRE_HOURS_REMEMBER, decode_token_with_grace; print('security.py OK')"
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/utils/security.py
git commit -m "feat: add remember-me token expiry and grace-period decode"
```

---

### Task 6: httpOnly cookie + /refresh + /logout

**Files:**
- Modify: `backend/src/middleware/auth.py` — read cookie first
- Modify: `backend/src/routers/auth.py` — add /refresh and /logout endpoints

- [ ] **Step 1: Update middleware/auth.py to read cookie**

```python
"""
JWT 认证中间件: 从 httpOnly cookie 或 Authorization header 解析 token 并注入当前用户.
"""

from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..utils.errors import UnauthorizedError
from ..utils.security import decode_token

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = request.cookies.get("token")
    if not token and credentials:
        token = credentials.credentials
    if not token:
        raise UnauthorizedError("Invalid or expired token")

    try:
        payload = decode_token(token)
        user_id = int(payload["sub"])
    except Exception:
        raise UnauthorizedError("Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UnauthorizedError("User not found")

    return user
```

- [ ] **Step 2: Add /refresh and /logout endpoints to routers/auth.py**

Add these endpoints after the `/password` endpoint and before `/account`:

```python
@router.post("/refresh", response_model=AuthResponse)
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get("token")
    if not token:
        raise UnauthorizedError("Invalid or expired token")

    from ..utils.security import decode_token_with_grace

    try:
        payload = decode_token_with_grace(token)
    except Exception:
        raise UnauthorizedError("Invalid or expired token")

    user_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UnauthorizedError("User not found")

    sec_log.info("event=token_refresh username=%s ip=%s", user.username, _get_client_ip(request))

    auth_resp = _auth_response(user)
    _set_token_cookie(response, auth_resp.token)
    return auth_resp


@router.post("/logout", status_code=204)
def logout(response: Response):
    _clear_token_cookie(response)
```

- [ ] **Step 3: Verify backend imports**

```bash
cd backend && .venv/Scripts/python.exe -c "from src.main import app; routes = [r.path for r in app.routes if hasattr(r, 'path')]; print([r for r in routes if 'auth' in r])"
```

Expected: `['/api/v1/auth/register', '/api/v1/auth/login', '/api/v1/auth/me', '/api/v1/auth/preferences', '/api/v1/auth/password', '/api/v1/auth/refresh', '/api/v1/auth/logout', '/api/v1/auth/account']`

- [ ] **Step 4: Run all backend tests**

```bash
cd backend && .venv/Scripts/python.exe -m pytest tests/ -v
```

Expected: 22 passed

- [ ] **Step 5: Commit**

```bash
git add backend/src/middleware/auth.py backend/src/routers/auth.py
git commit -m "feat: add httpOnly cookie auth, /refresh and /logout endpoints"
```

---

### Task 7: Frontend — token utility and API client update

**Files:**
- Create: `frontend/src/utils/token.ts`
- Modify: `frontend/src/api/client.ts`
- Modify: `frontend/src/context/AuthContext.tsx`

- [ ] **Step 1: Create token.ts**

```typescript
/**
 * JWT token utilities: decode, expiry check. Reads token from in-memory store,
 * not localStorage (httpOnly cookie handles actual auth).
 */

let _token: string | null = null

export function setToken(token: string | null): void {
  _token = token
}

export function getToken(): string | null {
  return _token
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/")
  while (str.length % 4) str += "="
  return atob(str)
}

export function decodeTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    return JSON.parse(base64UrlDecode(parts[1]))
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeTokenPayload(token)
  if (!payload || !payload.exp) return true
  return (payload.exp as number) * 1000 < Date.now()
}

export function getTokenRemainingMs(token: string): number {
  const payload = decodeTokenPayload(token)
  if (!payload || !payload.exp) return 0
  const remaining = (payload.exp as number) * 1000 - Date.now()
  return Math.max(0, remaining)
}

/** True if token expires within 5 minutes and should be refreshed pre-emptively. */
export function shouldRefreshToken(token: string): boolean {
  return getTokenRemainingMs(token) < 5 * 60 * 1000
}
```

- [ ] **Step 2: Update api/client.ts for cookie auth + refresh logic**

```typescript
/*
 API 请求封装: 统一响应解包, cookie-based JWT, 自动 refresh, 401 处理.
*/

import axios from 'axios'
import { getToken, shouldRefreshToken, setToken } from '../utils/token'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Track inflight refresh to avoid duplicate calls
let refreshPromise: Promise<void> | null = null

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) {
    await refreshPromise
    return !!getToken()
  }
  refreshPromise = (async () => {
    try {
      const res = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
      const body = res.data
      if (body.code === 0 && body.data?.token) {
        setToken(body.data.token)
      }
    } catch {
      setToken(null)
    } finally {
      refreshPromise = null
    }
  })()
  await refreshPromise
  return !!getToken()
}

api.interceptors.request.use(async (config) => {
  const token = getToken()
  if (token && shouldRefreshToken(token)) {
    await tryRefresh()
  }
  return config
})

api.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body.code !== undefined && body.code !== 0) {
      return Promise.reject(new Error(body.message || 'Request failed'))
    }
    return body.data !== undefined ? body.data : body
  },
  async (err) => {
    if (err.response?.status === 401) {
      const refreshed = await tryRefresh()
      if (refreshed && err.config && !err.config._retry) {
        err.config._retry = true
        return api(err.config)
      }
      // Refresh failed — clear state
      setToken(null)
      localStorage.removeItem('username')
      window.location.reload()
    }
    const msg = err.response?.data?.message || err.message || 'Network error'
    return Promise.reject(new Error(msg))
  },
)

export default api
```

- [ ] **Step 3: Verify TypeScript compilation**

```bash
cd frontend && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/utils/token.ts frontend/src/api/client.ts
git commit -m "feat: add token utility, cookie-based auth with auto-refresh"
```

---

### Task 8: AuthContext refactor

**Files:**
- Modify: `frontend/src/context/AuthContext.tsx`
- Modify: `frontend/src/components/auth/AccountSettings.tsx`

- [ ] **Step 1: Update AuthContext — remove localStorage token, add changePassword/deleteAccount**

```typescript
/*
 认证上下文: cookie-based token, login/register/logout, 偏好同步, changePassword/deleteAccount.
*/

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import api from '../api/client'
import { setToken, getToken } from '../utils/token'

interface Preferences {
  theme?: string
  language?: string
  default_status_filter?: string
  custom_theme_id?: number | null
}

interface AuthState {
  token: string | null
  username: string | null
  preferences: Preferences
  loading: boolean
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  deleteAccount: (password: string) => Promise<void>
  updatePreferences: (prefs: Preferences) => Promise<void>
}

const defaultPreferences: Preferences = {
  theme: 'system',
  language: 'zh',
  default_status_filter: 'active',
}

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem('preferences')
    return raw ? { ...defaultPreferences, ...JSON.parse(raw) } : defaultPreferences
  } catch {
    return defaultPreferences
  }
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Token lives in memory (httpOnly cookie handles actual auth), but we keep
  // a copy for expiry checks. On mount, we don't know if the cookie exists;
  // the first API call will confirm via 200 or 401.
  const [token, setTokenState] = useState<string | null>(() => null)
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('username'))
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences)
  const [loading, setLoading] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  const savePrefs = (prefs: Preferences) => {
    setPreferences(prefs)
    localStorage.setItem('preferences', JSON.stringify(prefs))
  }

  const handleAuthSuccess = (data: any) => {
    setToken(data.token)
    setTokenState(data.token)
    localStorage.setItem('username', data.username)
    setUsername(data.username)
    if (data.preferences) {
      savePrefs({ ...defaultPreferences, ...data.preferences })
    }
  }

  const login = useCallback(async (u: string, p: string, rememberMe: boolean = false) => {
    setLoading(true)
    try {
      const data = await api.post('/auth/login', { username: u, password: p, remember_me: rememberMe }) as any
      handleAuthSuccess(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (u: string, p: string) => {
    setLoading(true)
    try {
      const data = await api.post('/auth/register', { username: u, password: p }) as any
      handleAuthSuccess(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore errors — clear state regardless
    }
    setToken(null)
    setTokenState(null)
    localStorage.removeItem('username')
    setUsername(null)
  }, [])

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    setChangingPassword(true)
    try {
      await api.put('/auth/password', {
        old_password: oldPassword,
        new_password: newPassword,
      })
    } finally {
      setChangingPassword(false)
    }
  }, [])

  const deleteAccount = useCallback(async (password: string) => {
    setDeletingAccount(true)
    try {
      await api.delete('/auth/account', { data: { password } })
      setToken(null)
      setTokenState(null)
      localStorage.removeItem('username')
      setUsername(null)
    } finally {
      setDeletingAccount(false)
    }
  }, [])

  const updatePreferences = useCallback(async (prefs: Preferences) => {
    await api.put('/auth/preferences', { preferences: prefs })
    savePrefs(prefs)
  }, [])

  const value = useMemo(() => ({
    token, username, preferences, loading, login, register, logout,
    changePassword, deleteAccount, updatePreferences,
  }), [token, username, preferences, loading, login, register, logout,
       changePassword, deleteAccount, updatePreferences])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Update AccountSettings.tsx to use AuthContext**

Remove `import api from '../../api/client'`. Change:

```typescript
const AccountSettings: React.FC = () => {
  const { logout, changePassword, deleteAccount } = useAuth()
  // ... rest stays same except:

  // Change:
  //   await api.put('/auth/password', { old_password: oldPassword, new_password: newPassword })
  // To:
  //   await changePassword(oldPassword, newPassword)

  // Change:
  //   await api.delete('/auth/account', { data: { password: deletePassword } })
  //   logout()
  // To:
  //   await deleteAccount(deletePassword)
```

- [ ] **Step 3: Verify TypeScript compilation**

```bash
cd frontend && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 4: Verify Vite build**

```bash
cd frontend && npx vite build 2>&1 | tail -5
```

Expected: "✓ built in ...s"

- [ ] **Step 5: Commit**

```bash
git add frontend/src/context/AuthContext.tsx frontend/src/components/auth/AccountSettings.tsx
git commit -m "refactor: move changePassword/deleteAccount into AuthContext, switch to cookie-based token"
```

---

### Task 9: Remember me checkbox

**Files:**
- Modify: `frontend/src/components/auth/AuthPage.tsx`
- Modify: `frontend/src/locales/zh.json` (already added keys in Task 3)
- Modify: `frontend/src/locales/en.json` (already added keys in Task 3)

- [ ] **Step 1: Add remember me checkbox to AuthPage**

In the login form (tab === 'login'), add after the password input group and before the error display:

```tsx
const [rememberMe, setRememberMe] = useState(false)

// In handleSubmit, change login call to:
await login(username.trim(), password, rememberMe)

// Add JSX after password form-group, before error:
{tab === 'login' && (
  <div className="auth-remember">
    <input
      type="checkbox"
      id="rememberMe"
      checked={rememberMe}
      onChange={(e) => setRememberMe(e.target.checked)}
    />
    <label htmlFor="rememberMe">{t('auth.rememberMe')}</label>
  </div>
)}
```

- [ ] **Step 2: Verify TypeScript + Build**

```bash
cd frontend && npx tsc --noEmit 2>&1 && npx vite build 2>&1 | tail -3
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/auth/AuthPage.tsx
git commit -m "feat: add remember me checkbox to login form"
```

---

### Task 10: Password visibility toggle

**Files:**
- Modify: `frontend/src/components/auth/AuthPage.tsx`
- Modify: `frontend/src/components/auth/AccountSettings.tsx`
- Modify: `frontend/src/styles/index.css`

- [ ] **Step 1: Create PasswordInput component pattern**

Add a helper inside AuthPage (or create a small inline toggle). For each password input, add an eye button:

```tsx
const [showPassword, setShowPassword] = useState(false)

// Replace the password input with:
<div className="password-wrapper">
  <input
    type={showPassword ? 'text' : 'password'}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder={t('auth.enterPassword')}
  />
  <button
    type="button"
    className="password-toggle"
    onClick={() => setShowPassword(!showPassword)}
    tabIndex={-1}
    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
  >
    {showPassword ? '🙈' : '👁'}
  </button>
</div>
```

Apply same pattern to AccountSettings for old/new/confirm password fields (3 password inputs).

- [ ] **Step 2: Add CSS for password toggle**

```css
.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  width: 100%;
  padding-right: 36px;
}

.password-toggle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 2px 4px;
  line-height: 1;
  opacity: 0.6;
  transition: opacity var(--transition);
}

.password-toggle:hover {
  opacity: 1;
}
```

- [ ] **Step 3: Verify TypeScript + Build**

```bash
cd frontend && npx tsc --noEmit 2>&1 && npx vite build 2>&1 | tail -3
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/auth/AuthPage.tsx frontend/src/components/auth/AccountSettings.tsx frontend/src/styles/index.css
git commit -m "feat: add password visibility toggle (eye icon)"
```

---

### Task 11: Tab switch behavior fix

**Files:**
- Modify: `frontend/src/components/auth/AuthPage.tsx`

- [ ] **Step 1: Clear form state on tab switch**

Change both tab button onClick handlers:

```tsx
onClick={() => { setTab('login'); setError(''); setUsername(''); setPassword('') }}
onClick={() => { setTab('register'); setError(''); setUsername(''); setPassword('') }}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/auth/AuthPage.tsx
git commit -m "fix: clear form fields on auth tab switch"
```

---

### Task 12: Password strength indicator

**Files:**
- Modify: `frontend/src/components/auth/AuthPage.tsx`
- Modify: `frontend/src/components/auth/AccountSettings.tsx`
- Modify: `frontend/src/styles/index.css`

- [ ] **Step 1: Create strength computation function**

Add a helper function in each component (or extract to a shared util):

```typescript
function getPasswordStrength(pw: string): { level: 'weak' | 'medium' | 'strong'; label: string } {
  if (pw.length < 8) return { level: 'weak', label: t('auth.strengthWeak') }
  const hasLetter = /[a-zA-Z]/.test(pw)
  const hasDigit = /\d/.test(pw)
  const hasSpecial = /[^a-zA-Z\d]/.test(pw)
  if (hasLetter && hasDigit && hasSpecial) return { level: 'strong', label: t('auth.strengthStrong') }
  if (hasLetter && hasDigit) return { level: 'medium', label: t('auth.strengthMedium') }
  return { level: 'weak', label: t('auth.strengthWeak') }
}
```

- [ ] **Step 2: Render strength indicator below password input**

Below the new_password input in register form and AccountSettings change password form:

```tsx
{password && (
  <div className="password-strength">
    <div className={`strength-bar strength-${strength.level}`} />
    <span>{strength.label}</span>
  </div>
)}
```

- [ ] **Step 3: Add CSS for strength indicator**

```css
.password-strength {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.strength-bar {
  width: 60px;
  height: 4px;
  border-radius: 2px;
  transition: background var(--transition);
}

.strength-weak { background: var(--priority-high); }
.strength-medium { background: #e8a838; }
.strength-strong { background: #4caf50; }
```

- [ ] **Step 4: Verify TypeScript + Build**

```bash
cd frontend && npx tsc --noEmit 2>&1 && npx vite build 2>&1 | tail -3
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/auth/AuthPage.tsx frontend/src/components/auth/AccountSettings.tsx frontend/src/styles/index.css
git commit -m "feat: add password strength indicator"
```

---

### Task 13: CSS — remember me and account settings styles

**Files:**
- Modify: `frontend/src/styles/index.css`

- [ ] **Step 1: Add remember me checkbox style**

After the auth-error section in CSS:

```css
.auth-remember {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 0;
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.auth-remember input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
}

.auth-remember label {
  cursor: pointer;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/styles/index.css
git commit -m "style: add remember-me and password strength CSS"
```

---

### Task 14: Update docs/auth.md

**Files:**
- Modify: `docs/auth.md`

- [ ] **Step 1: Update auth.md with all new features**

Update the following sections:
1. Feature overview: add cookie-based auth, remember me, password strength, login lockout, token refresh, security logging
2. Usage: add sections for token refresh flow, remember me, password visibility
3. API endpoints table: add `/refresh`, `/logout`, update `/password` and `/account` descriptions
4. Backend files: update security.py description (grace decode), auth middleware (cookie reading), logging.py (security logger)
5. Frontend files: add `token.ts`, update descriptions for client.ts (cookie+refresh) and AuthContext.tsx
6. Error codes table: add 423 account locked, update validation error patterns
7. Rate limiting: update paths list (add `/refresh`, `/logout`)
8. Environment: add note about cookie secure flag for production

- [ ] **Step 2: Commit**

```bash
git add docs/auth.md
git commit -m "docs: update auth.md with hardening features"
```

---

### Task 15: Final verification

- [ ] **Step 1: Run full backend test suite**

```bash
cd backend && .venv/Scripts/python.exe -m pytest tests/ -v
```

Expected: all 22 tests pass.

- [ ] **Step 2: Run frontend type check + build**

```bash
cd frontend && npx tsc --noEmit 2>&1 && npx vite build 2>&1 | tail -5
```

Expected: no TS errors, build succeeds.

- [ ] **Step 3: Verify endpoint routes**

```bash
cd backend && .venv/Scripts/python.exe -c "from src.routers.auth import router; print(sorted([r.path for r in router.routes]))"
```

Expected: `['/api/v1/auth/account', '/api/v1/auth/login', '/api/v1/auth/logout', '/api/v1/auth/me', '/api/v1/auth/password', '/api/v1/auth/preferences', '/api/v1/auth/refresh', '/api/v1/auth/register']`

- [ ] **Step 4: Commit (if any final changes)**

```bash
git status
```
