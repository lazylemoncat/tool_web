# Auth 模块一次性重构计划

## 1. 背景与目标

当前项目仍处于开发阶段, 不需要兼容已发布版本, 也不优先考虑历史认证数据保留. 本次重构目标是将现有 auth 从项目内路由逻辑升级为高可靠, 可测试, 可扩展, 可复用的认证基础模块, 供当前项目和后续新项目使用.

本次重构允许:

- 破坏旧 token 和旧 cookie.
- 重建认证相关数据表.
- 统一调整其他业务模块的用户依赖.
- 重构完成后运行迁移脚本初始化新 auth schema.

本次重构不允许:

- 在 `main`, `release_*` 等长期或发布分支直接开发.
- 顺手修复与 auth 重构无关的问题.
- 保留旧 auth 行为导致新架构妥协.

## 2. 总体架构

后端按 core, ports, adapters, fastapi_adapter 分层:

```text
backend/src/auth/
  __init__.py

  core/
    __init__.py
    settings.py
    time.py
    errors.py
    models.py
    password.py
    password_policy.py
    tokens.py
    sessions.py
    refresh_tokens.py
    csrf.py
    audit.py
    mfa.py
    service.py

  ports/
    __init__.py
    users.py
    preferences.py
    sessions.py
    refresh_tokens.py
    audit.py
    rate_limit.py
    mfa.py

  adapters/
    __init__.py
    sqlalchemy_models.py
    sqlalchemy_user_store.py
    sqlalchemy_preference_store.py
    sqlalchemy_session_store.py
    sqlalchemy_refresh_token_store.py
    sqlalchemy_audit_store.py
    sqlalchemy_mfa_store.py
    in_memory_rate_limiter.py

  fastapi_adapter/
    __init__.py
    router.py
    dependencies.py
    schemas.py
    cookies.py
    exceptions.py
    csrf.py
    mfa_router.py
    mfa_schemas.py
```

核心原则:

- `auth/core` 不依赖 FastAPI.
- `auth/core` 不依赖 SQLAlchemy.
- `auth/core` 不依赖 React 或当前项目 UI.
- FastAPI, SQLAlchemy, 前端 React 都只作为适配层存在.

## 3. 后端数据模型

本次重构直接建立新的认证数据模型. 业务模块继续使用 `user_id` 做数据隔离, 但用户身份来源改为新 `auth_users` 表.

### 3.1 auth_users

用途: 认证用户主表.

```text
auth_users
  id: integer primary key
  username: string unique not null
  password_hash: string not null
  is_admin: boolean default false
  is_active: boolean default true
  failed_login_attempts: integer default 0
  locked_until: datetime nullable
  password_changed_at: datetime nullable
  created_at: datetime not null
  updated_at: datetime not null
```

要求:

- 只保存认证必要字段.
- 不保存项目业务偏好.
- 不直接挂载 Todo, Finance, Theme 等业务 relationship.
- `username` 第一版继续作为唯一登录标识.

### 3.2 user_preferences

用途: 当前项目用户偏好, 从 auth 用户模型中拆出.

```text
user_preferences
  user_id: integer primary key references auth_users(id)
  preferences_json: json not null
  created_at: datetime not null
  updated_at: datetime not null
```

要求:

- 默认偏好由当前项目适配层提供.
- auth-core 不理解 `theme`, `language`, `default_status_filter` 等项目字段.

### 3.3 auth_sessions

用途: 服务端登录会话表.

```text
auth_sessions
  id: string primary key
  user_id: integer not null references auth_users(id)
  user_agent: string nullable
  ip_address: string nullable
  created_at: datetime not null
  last_seen_at: datetime not null
  expires_at: datetime not null
  revoked_at: datetime nullable
  revoke_reason: string nullable
```

要求:

- access token 必须携带 `sid`.
- `logout`, `change_password`, `delete_account` 必须能撤销 session.
- 支持用户查看和撤销自己的 session.

### 3.4 auth_refresh_tokens

用途: refresh token 存储和 rotation.

```text
auth_refresh_tokens
  id: string primary key
  session_id: string not null references auth_sessions(id)
  token_hash: string unique not null
  token_family: string not null
  created_at: datetime not null
  expires_at: datetime not null
  used_at: datetime nullable
  revoked_at: datetime nullable
  replaced_by_id: string nullable references auth_refresh_tokens(id)
```

要求:

- 数据库只存 refresh token hash, 不存明文.
- 每次 refresh 成功都创建新 refresh token.
- 旧 refresh token 标记 `used_at` 并记录 `replaced_by_id`.
- 检测到已使用 refresh token 被再次使用时, 撤销整个 session 或 token family.
- refresh token 只通过 httpOnly cookie 传输, 不进入 JS 可访问存储.

### 3.5 auth_audit_logs

用途: 认证安全审计.

```text
auth_audit_logs
  id: integer primary key
  user_id: integer nullable references auth_users(id)
  session_id: string nullable references auth_sessions(id)
  event_type: string not null
  ip_address: string nullable
  user_agent: string nullable
  metadata_json: json nullable
  created_at: datetime not null
```

事件类型:

```text
register_success
login_success
login_failure
account_locked
token_refresh_success
refresh_token_reuse_detected
logout
session_revoked
password_changed
account_deleted
mfa_totp_setup_started
mfa_totp_enabled
mfa_totp_disabled
mfa_challenge_created
mfa_verify_success
mfa_verify_failure
mfa_recovery_code_used
mfa_recovery_codes_regenerated
```

禁止写入日志:

- 明文密码.
- access token.
- refresh token.
- TOTP secret.
- TOTP code.
- recovery code 明文.
- CSRF token.

## 4. TOTP/MFA 表设计

本次设计直接纳入 TOTP/MFA 数据表, 但实现可按阶段启用. 表结构先随 auth schema 建立, 便于后续功能开发不再破坏核心数据模型.

### 4.1 auth_mfa_methods

用途: 用户已绑定的 MFA 方法. 第一版只实现 `totp`, 但字段预留未来扩展.

```text
auth_mfa_methods
  id: string primary key
  user_id: integer not null references auth_users(id)
  method_type: string not null
  label: string nullable
  secret_ciphertext: string nullable
  secret_version: integer default 1
  is_enabled: boolean default false
  confirmed_at: datetime nullable
  last_used_at: datetime nullable
  created_at: datetime not null
  updated_at: datetime not null
```

字段说明:

- `method_type`: 第一版固定为 `totp`.
- `secret_ciphertext`: 加密后的 TOTP secret, 不能明文存储.
- `secret_version`: 预留密钥加密算法或 key rotation 版本.
- `is_enabled`: setup 创建后为 false, confirm 成功后为 true.
- `confirmed_at`: 用户首次输入正确 TOTP code 后写入.

索引建议:

```text
idx_auth_mfa_methods_user_id
idx_auth_mfa_methods_user_type
```

约束建议:

- 同一用户第一版只允许一个 enabled TOTP 方法.
- 未确认的 TOTP setup 可以被覆盖或定期清理.

### 4.2 auth_mfa_challenges

用途: 登录密码校验通过后, MFA 二次验证前的临时 challenge.

```text
auth_mfa_challenges
  id: string primary key
  user_id: integer not null references auth_users(id)
  session_intent_id: string nullable
  challenge_type: string not null
  available_methods_json: json not null
  ip_address: string nullable
  user_agent: string nullable
  attempts: integer default 0
  max_attempts: integer not null
  created_at: datetime not null
  expires_at: datetime not null
  verified_at: datetime nullable
  revoked_at: datetime nullable
```

字段说明:

- `challenge_type`: 第一版为 `login`.
- `available_methods_json`: 如 `["totp", "recovery_code"]`.
- `session_intent_id`: 可选字段, 用于把登录第一步和最终 session 创建关联起来.
- `attempts`: MFA 验证失败次数.
- `verified_at`: 验证成功后写入, 防止重复使用.
- `revoked_at`: 用户重试登录, 超过次数, 或管理员操作时撤销.

索引建议:

```text
idx_auth_mfa_challenges_user_id
idx_auth_mfa_challenges_expires_at
```

安全要求:

- challenge 必须有短 TTL, 建议 5 分钟.
- challenge 只能被创建它的用户完成.
- 超过 `max_attempts` 后撤销.
- challenge id 不应包含可推断信息.

### 4.3 auth_recovery_codes

用途: TOTP 不可用时的恢复码. 只存 hash, 明文只在生成时显示一次.

```text
auth_recovery_codes
  id: string primary key
  user_id: integer not null references auth_users(id)
  code_hash: string unique not null
  code_hint: string nullable
  created_at: datetime not null
  used_at: datetime nullable
  used_ip_address: string nullable
  used_user_agent: string nullable
  revoked_at: datetime nullable
```

字段说明:

- `code_hash`: recovery code 的安全 hash.
- `code_hint`: 可选, 例如最后 4 位, 用于用户界面展示剩余恢复码时定位, 不能泄露完整 code.
- `used_at`: 使用后立即写入, 同一 code 不可二次使用.
- `revoked_at`: 用户重新生成 recovery codes 后旧 code 全部撤销.

索引建议:

```text
idx_auth_recovery_codes_user_id
idx_auth_recovery_codes_used_at
```

安全要求:

- recovery code 使用高强度随机数生成.
- 默认生成 10 个.
- 明文只显示一次.
- 数据库只存 hash.
- 使用 recovery code 也要写 audit log.
- 使用 recovery code 后建议提醒用户重新生成一组恢复码.

### 4.4 auth_mfa_used_totp_steps

用途: 防止同一 TOTP 时间步重复使用.

```text
auth_mfa_used_totp_steps
  id: integer primary key
  user_id: integer not null references auth_users(id)
  method_id: string not null references auth_mfa_methods(id)
  time_step: integer not null
  used_at: datetime not null
  challenge_id: string nullable references auth_mfa_challenges(id)
```

约束建议:

```text
unique(user_id, method_id, time_step)
idx_auth_mfa_used_totp_steps_used_at
```

要求:

- TOTP code 验证成功后记录当前 time step.
- 同一用户同一方法同一 time step 不能重复通过.
- 定期清理过旧 time step 记录.

## 5. 配置设计

新增 `AuthSettings`, 所有 auth 策略统一从配置读取.

```text
environment
jwt_secret
jwt_algorithm
jwt_issuer
jwt_audience
access_token_ttl_seconds
session_ttl_seconds
remember_session_ttl_seconds
refresh_token_ttl_seconds
remember_refresh_token_ttl_seconds
access_cookie_name
refresh_cookie_name
csrf_cookie_name
csrf_header_name
cookie_path
refresh_cookie_path
cookie_secure
cookie_samesite
cookie_domain
max_login_failures
account_lock_seconds
rate_limit_window_seconds
rate_limit_max_requests
password_min_length
password_require_letter
password_require_digit
mfa_totp_enabled
mfa_totp_issuer
mfa_totp_digits
mfa_totp_interval_seconds
mfa_totp_algorithm
mfa_totp_valid_window
mfa_challenge_ttl_seconds
mfa_max_attempts_per_challenge
mfa_secret_encryption_key
mfa_recovery_code_count
mfa_recovery_code_length
```

生产环境要求:

- `cookie_secure=True`.
- `jwt_secret` 长度不少于 32.
- `mfa_secret_encryption_key` 必须存在.
- refresh token 只允许 httpOnly cookie.

## 6. 核心服务职责

### 6.1 PasswordHasher

职责:

- `hash(password)`.
- `verify(password, password_hash)`.
- `needs_rehash(password_hash)`.

第一版继续使用 bcrypt. 后续如迁移 Argon2id, 通过 `needs_rehash` 在登录成功后渐进升级.

### 6.2 TokenService

职责:

- 创建 access token.
- 解码并验证 access token.

Access token claims:

```text
sub: user_id
sid: session_id
typ: access
username
iss
aud
iat
nbf
exp
jti
```

解码必须校验:

- signature.
- exp.
- nbf.
- iss.
- aud.
- typ.

### 6.3 RefreshTokenService

职责:

- 生成 refresh token 明文.
- hash refresh token.
- 校验 refresh token.
- 执行 rotation.
- 检测 reuse.
- 撤销 token family.

要求:

- refresh token 明文只返回给 cookie 设置逻辑.
- 数据库存储 hash.
- reuse detected 后必须写 audit log.

### 6.4 CsrfService

职责:

- 生成 CSRF token.
- 校验 CSRF header 和 CSRF cookie 是否匹配.
- 对状态变更请求启用 CSRF 校验.

要求:

- `GET`, `HEAD`, `OPTIONS` 可跳过.
- `POST`, `PUT`, `PATCH`, `DELETE` 必须校验.
- 登录和 refresh 的处理需要单独评估, 第一版可对登录放行, 对 refresh 启用 SameSite + refresh cookie path 限制.

### 6.5 MfaService

职责:

- 创建 TOTP setup.
- 确认 TOTP setup.
- 创建 MFA challenge.
- 验证 TOTP code.
- 验证 recovery code.
- 禁用 TOTP.
- 重新生成 recovery codes.

要求:

- TOTP secret 加密存储.
- Recovery code 只存 hash.
- TOTP code 和 recovery code 不进日志.
- MFA 管理操作需要密码或 step-up 验证.

### 6.6 AuthService

统一认证业务入口:

```text
register
login
verify_mfa
refresh
logout
get_current_user
change_password
delete_account
list_sessions
revoke_session
get_password_policy
get_mfa_status
start_totp_setup
confirm_totp_setup
disable_totp
regenerate_recovery_codes
```

## 7. FastAPI API 设计

保留 `/api/v1/auth` 前缀.

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/mfa/verify
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
PUT    /api/v1/auth/password
DELETE /api/v1/auth/account
GET    /api/v1/auth/password-policy
GET    /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/{session_id}
GET    /api/v1/auth/csrf
GET    /api/v1/auth/mfa
POST   /api/v1/auth/mfa/totp/setup
POST   /api/v1/auth/mfa/totp/confirm
DELETE /api/v1/auth/mfa/totp/{method_id}
POST   /api/v1/auth/mfa/recovery-codes/regenerate
```

登录返回类型:

```text
authenticated:
  access_token
  user
  preferences

mfa_required:
  challenge_id
  available_methods
  expires_in
```

## 8. 其他模块对齐

需要对齐的后端模块:

- Todo.
- Folder.
- Tag.
- Theme.
- Finance.

对齐方式:

- 删除业务路由对旧 `middleware.auth.get_current_user` 的依赖.
- 使用新 `auth.fastapi_adapter.dependencies.require_user`.
- `current_user` 返回轻量 `CurrentUser`, 只使用 `id`, `username`, `is_admin`.
- 所有业务查询继续按 `current_user.id` 过滤.
- 业务模型外键统一指向 `auth_users.id`.

## 9. 前端重构计划

目标目录:

```text
frontend/src/auth/
  client/
    types.ts
    AuthClient.ts
    axiosAuthClient.ts
    token.ts
  react/
    AuthProvider.tsx
    useAuth.ts
    ProtectedRoute.tsx
  ui/
    AuthPage.tsx
    AccountSecurityPage.tsx
    MfaChallenge.tsx
    TotpSetup.tsx
    RecoveryCodes.tsx
```

前端状态机:

```text
loading
anonymous
authenticated
mfa_required
```

要求:

- access token 只保存在内存.
- refresh token 只通过 httpOnly cookie.
- CSRF token 由 `auth-client` 统一管理.
- 多个 401 同时发生时, 只能触发一次 refresh.
- 密码规则从 `/password-policy` 获取.
- TOTP secret 和 recovery codes 不进入持久化存储.

## 10. 迁移脚本

新增:

```text
backend/scripts/reset_auth_schema.py
```

开发期策略:

- 允许清理旧 auth schema.
- 允许重建 SQLite 开发数据库.
- 重建所有 auth 相关表.
- seed 默认 admin.
- seed admin 默认 preferences.

如果后续需要保留业务数据, 再新增独立迁移脚本, 不阻塞本次一次性重构.

## 11. 实施顺序

1. 新建 `backend/src/auth/` 目录结构.
2. 实现 `AuthSettings`, `utcnow`, core errors.
3. 实现 SQLAlchemy auth models.
4. 修改业务模型外键指向 `auth_users.id`.
5. 实现 stores 和 ports.
6. 实现 `PasswordHasher`, `PasswordPolicy`.
7. 实现 `TokenService`.
8. 实现 `SessionService` 和 `RefreshTokenService`.
9. 实现 `CsrfService`.
10. 实现 `AuditService`.
11. 实现 `MfaService` 和 TOTP/recovery code 基础能力.
12. 实现 `AuthService`.
13. 实现 FastAPI schemas, cookies, exceptions, dependencies.
14. 实现 auth router 和 mfa router.
15. 替换 `main.py` auth router 注册.
16. 对齐 Todo, Folder, Tag, Theme, Finance 路由认证依赖.
17. 新增迁移脚本并重建开发数据库.
18. 重构前端 `auth-client`.
19. 重构前端 `auth-react`.
20. 改造登录, MFA challenge, 账号安全 UI.
21. 运行后端测试.
22. 运行前端 typecheck/build.
23. 执行 `codegraph sync`.
24. 更新 `docs/auth.md` 和相关架构文档.

## 12. 后端测试矩阵

认证基础:

- register success.
- duplicate username.
- invalid password.
- login success.
- login wrong password.
- unknown user generic error.
- account lockout.
- lockout expiry.
- `/me` with cookie.
- `/me` with bearer.
- expired token rejected.
- invalid signature rejected.

Session 和 refresh:

- login creates session.
- login creates refresh token cookie.
- refresh rotates refresh token.
- refresh token reuse revokes session.
- logout revokes session.
- change password revokes sessions.
- delete account revokes sessions.
- session list.
- session revoke.

CSRF:

- missing CSRF rejected.
- invalid CSRF rejected.
- valid CSRF accepted.
- safe methods skipped.

MFA:

- start TOTP setup requires auth.
- confirm TOTP setup enables method.
- recovery codes returned once.
- login with MFA returns `mfa_required`.
- TOTP verify succeeds.
- wrong TOTP rejected.
- reused TOTP time step rejected.
- recovery code login succeeds.
- recovery code cannot be reused.
- disable TOTP requires password or step-up verification.
- regenerate recovery codes revokes old codes.

Audit:

- login success logged.
- login failure logged.
- refresh reuse logged.
- MFA events logged.
- secrets never logged.

## 13. 验收标准

- 旧 `backend/src/routers/auth.py` 不再承载核心认证逻辑.
- 所有认证业务通过 `AuthService`.
- 所有业务路由使用新 `require_user`.
- access token 短期有效, refresh token 可 rotation 和 revoke.
- logout, 改密, 注销账号会撤销 session.
- cookie 配置集中在 `AuthSettings`.
- refresh token 不进入 JS 存储.
- TOTP/MFA 表已创建, MFA 基础流程可运行.
- recovery code 只显示一次, 数据库只保存 hash.
- 状态变更接口具备 CSRF 防护.
- 后端认证测试覆盖关键路径.
- 前端登录, 刷新, 登出, MFA challenge, 改密, 注销账号主流程可用.
- `codegraph status` 显示索引最新.
- `git diff` 只包含 auth 重构, 业务认证对齐, 迁移脚本和文档相关改动.
