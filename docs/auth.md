# Tool Web 登录注册功能文档

## 功能概述

Tool Web 提供基于 **JWT (JSON Web Token)** 的用户认证系统, 支持以下功能:

- **用户注册**: 创建新账号, 自动登录并返回 JWT
- **用户登录**: 验证用户名和密码, 返回 JWT; 支持 "记住我" 延长登录有效期
- **登录锁定**: 同一账户 5 次失败尝试后锁定 15 分钟, 防止暴力破解
- **Cookie 认证**: JWT 通过 httpOnly secure cookie 传递, 兼顾安全与便利
- **Token 自动刷新**: 前端在 token 即将过期时自动调用 `/refresh` 续期, 用户无感知
- **修改密码**: 已登录用户修改账号密码, 要求密码至少 8 个字符且包含字母和数字
- **注销账号**: 已登录用户永久删除账号及所有关联数据
- **身份验证**: 通过 httpOnly cookie 或 Authorization header 验证请求身份
- **偏好设置**: 已登录用户可更新个人偏好 (主题 / 语言 / 默认筛选)
- **语言切换**: 登录/注册页面支持中文/English 实时切换
- **密码显示切换**: 密码输入框支持显示/隐藏切换
- **速率限制**: 所有认证接口有 IP 级别的请求频率限制
- **安全日志**: 记录所有认证事件 (登录成功/失败/锁定/密码修改/账号注销)
- **管理员种子**: 系统启动时自动创建 `admin` 管理员账号

密码使用 **bcrypt** 哈希存储, 密码强度要求至少 8 个字符且包含至少 1 个字母和 1 个数字. JWT 使用 **HS256** 算法签名, 默认有效期 1 小时; 启用 "记住我" 后有效期延长至 30 天.
所有 API 错误消息为英文, 前端根据当前语言环境显示对应翻译.

---

## 使用方法

当前 Next.js 前端登录页调用 `POST /api/v1/auth/login`, 注册页调用 `POST /api/v1/auth/register`, 全局登录态通过 `GET /api/v1/auth/me` 校验. 请求使用 cookie 认证并携带 `credentials: "include"`.

### 1. 注册新账号

**前端操作**:
1. 打开应用, 默认显示登录/注册页面
2. 点击 "注册" 标签切换到注册模式
3. 输入用户名 (2-50 个字符) 和密码 (8-100 个字符, 需包含字母和数字)
4. 点击提交按钮, 成功后自动登录进入主界面

**API 调用**:
```bash
curl -X POST http://localhost:8001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "myuser", "password": "mypassword"}'
```

成功响应 (201):
```json
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "username": "myuser",
    "preferences": {
      "theme": "system",
      "language": "zh",
      "default_status_filter": "active"
    }
  },
  "message": "ok"
}
```

用户名已存在时返回 409:
```json
{
  "code": 409,
  "message": "Username already exists",
  "data": null
}
```

用户名或密码不符合校验规则时返回 422 (Pydantic 校验):
```json
{
  "code": 422,
  "message": "body -> username: String should have at least 2 characters; body -> password: String should have at least 8 characters",
  "data": null
}
```

前端会将 API 英文错误映射为用户当前语言的友好提示.

---

### 2. 登录

**前端操作**:
1. 在登录/注册页面默认的 "登录" 标签下
2. 输入用户名和密码
3. 点击提交按钮, 成功后进入主界面

**API 调用**:
```bash
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "myuser", "password": "mypassword"}'
```

成功响应 (200):
```json
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "username": "myuser",
    "preferences": {
      "theme": "system",
      "language": "zh",
      "default_status_filter": "active"
    }
  },
  "message": "ok"
}
```

用户名或密码错误时返回 401:
```json
{
  "code": 401,
  "message": "Invalid username or password",
  "data": null
}
```

---

### 3. 获取当前用户信息

需要携带有效的 Bearer Token:
```bash
curl -X GET http://localhost:8001/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```

Token 无效或用户不存在时返回 401.

---

### 4. 更新用户偏好设置

```bash
curl -X PUT http://localhost:8001/api/v1/auth/preferences \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"preferences": {"theme": "dark", "language": "en"}}'
```

成功返回 204 (无内容). 偏好设置会同时同步到服务器端和本地 localStorage.

---

### 5. 退出登录

**前端操作**: 点击侧边栏的 "退出账号" 按钮, 确认后调用 `/logout` 清除服务端 httpOnly cookie 及本地 token, 并返回登录页.

**API 调用**:
```bash
curl -X POST http://localhost:8001/api/v1/auth/logout \
  -H "Authorization: Bearer <token>"
```

成功返回 204 (无内容). 服务端通过设置过期 cookie 清除 httpOnly cookie, 客户端同时清除 localStorage 中的 token.

---

### 6. 修改密码

**前端操作**:
1. 登录后进入 "设置" 页面
2. 在 "修改密码" 区域输入旧密码、新密码、确认新密码
3. 客户端校验: 新密码至少 8 个字符且包含字母和数字, 两次输入一致
4. 点击提交, 成功后显示 "密码已修改" 提示

**API 调用**:
```bash
curl -X PUT http://localhost:8001/api/v1/auth/password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"old_password": "oldpass", "new_password": "newpass123"}'
```

成功返回 204 (无内容).

旧密码错误时返回 400:
```json
{
  "code": 400,
  "message": "Current password is incorrect",
  "data": null
}
```

---

### 7. 注销账号

**前端操作**:
1. 登录后进入 "设置" 页面
2. 在红色危险区域点击 "注销我的账号"
3. 输入当前密码确认
4. 点击确认按钮, 成功后自动退出登录并返回登录页
5. 账号及所有关联数据 (文件夹、任务、主题、标签) 被永久删除

**API 调用**:
```bash
curl -X DELETE http://localhost:8001/api/v1/auth/account \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"password": "mypassword"}'
```

成功返回 204 (无内容). 用户及所有关联数据被级联删除.

密码错误时返回 400:
```json
{
  "code": 400,
  "message": "Password is incorrect",
  "data": null
}
```

---

### 8. Token 自动刷新

当前端检测到 token 即将过期 (默认有效期 1 小时, 剩余时间不足 5 分钟时), 自动调用 `/refresh` 端点获取新 token, 用户无需重新登录.

**API 调用**:
```bash
curl -X POST http://localhost:8001/api/v1/auth/refresh \
  -H "Authorization: Bearer <token>"
```

成功响应 (200):
```json
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "ok"
}
```

Token 已过期时返回 401, 前端自动清除登录状态并跳转到登录页.

**注意**: `/refresh` 仅在旧 token 过期前 5 分钟内 (grace period) 允许续期; "记住我" 模式下的 token (30 天有效期) 同样支持续期.

---

### 9. 记住我

登录表单提供 "记住我" 复选框, 勾选后 JWT 有效期从默认 1 小时延长至 30 天.

**后端行为**:
- 未勾选: `JWT_EXPIRE_HOURS` (默认 1 小时)
- 勾选: `JWT_EXPIRE_HOURS_REMEMBER` (默认 720 小时 = 30 天)
- 该参数通过请求体 `remember_me` 字段 (boolean, 默认 false) 传递

**前端行为**:
- Cookie 在未勾选时为短时效 (max-age 匹配 token 有效期)
- 勾选后 Cookie 设置为持久化 (max-age 匹配 30 天有效期)
- 页面加载时前端自动调用 `POST /auth/refresh` 检查 httpOnly cookie 是否有效, 有效则恢复登录态, 无需重新输入密码

---

### 10. 密码显示切换

所有密码输入框右侧提供眼睛图标按钮, 点击可切换密码的显示/隐藏状态.

**适用页面**:
- 登录表单 (密码输入框)
- 注册表单 (密码输入框)
- 修改密码表单 (旧密码、新密码、确认新密码输入框)
- 注销账号确认 (密码输入框)

切换仅改变前端 input 的 `type` 属性 (password ↔ text), 不影响实际提交数据.

---

### 11. 语言切换

**登录/注册页面**:
- 卡片右上角显示 "中文" / "English" 切换按钮
- 点击即可实时切换界面语言, 无需登录
- 切换后所有表单标签、按钮、错误提示同步更新

**设置页面**:
- 登录后可在 "设置 > 语言" 下拉菜单中选择
- 选择后需点击 "保存设置" 持久化到服务器

---

## 数据库字段

### users 表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `Integer` | PRIMARY KEY, AUTOINCREMENT | 用户唯一 ID |
| `username` | `String(50)` | UNIQUE, NOT NULL, INDEXED | 用户名 |
| `password_hash` | `String(128)` | NOT NULL | bcrypt 哈希后的密码 |
| `is_admin` | `Boolean` | DEFAULT `False` | 是否为管理员 |
| `preferences` | `JSON` | NOT NULL | 用户偏好设置 (主题/语言/筛选) |
| `created_at` | `DateTime` | DEFAULT `datetime.utcnow` | 创建时间 |

**preferences 默认值**:
```json
{
  "theme": "system",
  "language": "zh",
  "default_status_filter": "active"
}
```

**关联关系**:
- `folders` — 一对多, `Folder` 模型, 级联删除
- `todos` — 一对多, `Todo` 模型, 级联删除
- `themes` — 一对多, `UserTheme` 模型, 级联删除

**管理员种子用户**:
- 系统启动时自动创建 `username="admin"` 的用户
- 密码从 `ADMIN_PASSWORD` 环境变量读取, 未设置则随机生成并打印到日志
- 如果管理员已存在且 `ADMIN_PASSWORD` 已更改, 重启时会自动同步密码

---

## 后端文件地址

| 文件 | 作用 |
|------|------|
| `backend/src/routers/auth.py` | 认证 API 路由: `/register`, `/login`, `/me`, `/preferences`, `/password`, `/refresh`, `/logout`, `/account` |
| `backend/src/models/user.py` | SQLAlchemy ORM 模型: `User` 表定义, 含 `failed_login_attempts`, `locked_until` 锁定字段 |
| `backend/src/schemas/auth.py` | Pydantic 模型: `RegisterRequest`, `LoginRequest`, `AuthResponse`, `UpdatePreferencesRequest`, `ChangePasswordRequest`, `DeleteAccountRequest`, `RefreshRequest` |
| `backend/src/utils/security.py` | 安全工具: `hash_password`, `verify_password`, `create_token`, `decode_token`, `JWT_EXPIRE_HOURS_REMEMBER`, `decode_token_with_grace()` |
| `backend/src/middleware/auth.py` | 认证中间件: `get_current_user` FastAPI 依赖注入, 从 httpOnly cookie 或 Authorization header 解析 token |
| `backend/src/middleware/logging.py` | 请求日志中间件: `log_requests()`, `get_security_logger()` 安全事件日志 |
| `backend/src/utils/rate_limit.py` | 速率限制中间件: 针对所有认证端点的 IP 级别限流 |
| `backend/src/utils/errors.py` | 统一异常类: `AppError`, `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `RateLimitError`, `AccountLockedError` |
| `backend/src/main.py` | FastAPI 入口: CORS 配置, 中间件注册, 统一异常处理器 (RequestValidationError / HTTPException / AppError) |
| `backend/src/database.py` | 数据库连接: 引擎创建, 表迁移, Admin 种子用户初始化 |
| `backend/requirements.txt` | Python 依赖: `fastapi`, `bcrypt`, `pyjwt`, `sqlalchemy`, `pydantic` |

### 认证相关 API 端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `POST` | `/api/v1/auth/register` | 无 | 注册新用户, 返回 token |
| `POST` | `/api/v1/auth/login` | 无 | 登录, 返回 token; 支持 `remember_me` 字段 |
| `GET` | `/api/v1/auth/me` | Cookie / Bearer Token | 获取当前用户信息 |
| `PUT` | `/api/v1/auth/preferences` | Cookie / Bearer Token | 更新用户偏好设置 |
| `PUT` | `/api/v1/auth/password` | Cookie / Bearer Token | 修改密码 (需旧密码验证) |
| `POST` | `/api/v1/auth/refresh` | Cookie / Bearer Token | 刷新即将过期的 token (grace period 内) |
| `POST` | `/api/v1/auth/logout` | Cookie / Bearer Token | 清除服务端 httpOnly cookie |
| `DELETE` | `/api/v1/auth/account` | Cookie / Bearer Token | 注销账号 (需密码确认, 级联删除所有数据) |

---

## 前端文件地址

| 文件 | 作用 |
|------|------|
| `frontend/src/components/auth/AuthPage.tsx` | 登录/注册 UI 组件: 标签切换, 语言切换, 记住我, 密码显示切换, 密码强度指示, 表单输入, 客户端验证, 错误显示 |
| `frontend/src/components/settings/AccountSettings.tsx` | 账户管理 UI 组件: 修改密码表单 (含密码强度指示和显示切换), 注销账号确认流程; 使用 AuthContext 方法而非直接调用 API |
| `frontend/src/context/AuthContext.tsx` | 认证状态管理: `useAuth()` hook, login/register/logout/changePassword/deleteAccount 函数, token/localStorage 同步, 偏好设置同步, token 自动刷新 |
| `frontend/src/api/client.ts` | Axios 实例: cookie-based JWT, 自动 refresh, 请求拦截器, 响应拦截器 (统一解包, 401 处理: 认证端点直接传递错误, 其他端点自动刷新/重载) |
| `frontend/src/utils/token.ts` | JWT 工具: 解码 token payload, 检查 token 是否过期或即将过期, 判断是否需要触发 refresh |
| `frontend/src/hooks/useErrorDisplay.ts` | 错误显示 hook: 将 API 英文错误消息映射为当前语言的用户友好文案 |
| `frontend/src/utils/errorMapping.ts` | 错误消息映射表: 英文 API 消息 → i18n key, 含 Pydantic 校验错误模式匹配 |
| `frontend/src/app.tsx` | Umi 运行时入口: 全局 Provider, ErrorBoundary, Toast/Tooltip, themeBridge 初始化 |
| `frontend/src/layouts/index.tsx` | 应用布局: 会话检查加载态 (sessionChecked), 基于 token 有无的路由守卫 (无 token 显示 AuthPage, 有 token 显示主应用) |
| `frontend/.umirc.ts` | Umi 路由配置: settings/auth 相关页面注册 |
| `frontend/src/i18n.tsx` | 国际化系统: 懒加载 JSON 词典, `useLocale()` hook |
| `frontend/src/locales/zh.json` | 中文翻译: `auth.*` 键 (登录/注册/改密/销户/语言切换), `errors.*` 键 (错误提示) |
| `frontend/src/locales/en.json` | 英文翻译: `auth.*` 键, `errors.*` 键 |
| `frontend/src/styles/index.css` | 样式文件: `.auth-*`, `.danger-zone`, `.success-message`, `.account-settings` 等 CSS 类 |

### 前端数据流

**首次加载 (会话恢复)**:
```
页面加载
    → AuthProvider mount
    → axios POST /api/v1/auth/refresh (携带 httpOnly cookie)
    → 后端验证 cookie, 返回 { token, username, preferences }
    → 恢复内存 token + localStorage username + preferences
    → sessionChecked = true
    → layouts/index.tsx: token 非 null → 显示主应用路由
    (若 cookie 无效或不存在)
    → sessionChecked = true, token = null
    → layouts/index.tsx: 显示 AuthPage 登录页
```

**登录/注册**:
```
用户输入 (AuthPage)
    → AuthContext.login() / AuthContext.register()
    → axios POST /api/v1/auth/login 或 /register
    → 后端返回 { token, username, preferences }
    → 存入内存 token + localStorage username + preferences
    → React state 更新 (token !== null)
    → layouts/index.tsx 条件渲染: 显示主应用路由
```

### Token 管理

- **存储**: JWT 通过 httpOnly secure cookie 自动传递, 前端内存中保留 token 副本用于过期检查
- **发送**: Cookie 由浏览器自动携带 (同源请求); Axios 请求拦截器同时保留 `Authorization: Bearer <token>` 头作为后备方案
- **会话恢复**: 页面加载时 `AuthProvider` 自动调用 `POST /auth/refresh` (使用原始 axios, 绕过拦截器). 若 httpOnly cookie 有效则恢复 token、username 和 preferences, 用户无需重新登录; 若无效则显示登录页
- **刷新**: `frontend/src/utils/token.ts` 定期检查 token 过期时间, 在到期前 5 分钟自动调用 `/refresh` 获取新 token, 用户无感知
- **过期处理**: 非认证端点的 401 响应触发自动刷新; 刷新失败则清除状态并 `window.location.reload()` 回到登录页. `/auth/login` 和 `/auth/register` 端点的 401 响应直接传递给调用方显示错误, 不触发刷新或重载
- **退出**: `AuthContext.logout()` 调用 `/logout` 清除服务端 cookie, 同时清除前端内存 token 和 localStorage username, React state 置 null, 回到登录页

---

## 认证流程详解

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  前端     │         │  后端     │         │  SQLite  │
│ (React)  │         │ (FastAPI)│         │  数据库   │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │  注册/登录请求      │                    │
     │  POST /auth/register│                   │
     │  POST /auth/login  │                    │
     │───────────────────>│                    │
     │                    │                    │
     │                    │  查询/创建用户      │
     │                    │───────────────────>│
     │                    │                    │
     │                    │  返回用户数据       │
     │                    │<───────────────────│
     │                    │                    │
     │                    │  bcrypt 验证密码    │
     │                    │  检查锁定状态       │
     │                    │  生成 JWT (HS256)  │
     │                    │  1h / 30d (记住我)         │
     │                    │                    │
     │  返回 token +      │                    │
     │  username +        │                    │
     │  preferences       │                    │
     │  Set-Cookie (httpOnly)               │
     │<───────────────────│                    │
     │                    │                    │
     │  存入 localStorage │                    │
     │  (token, username) │                    │
     │                    │                    │
     │  后续请求           │                    │
     │  Authorization:    │                    │
     │  Bearer <token>    │                    │
     │───────────────────>│                    │
     │                    │                    │
     │                    │  解码并验证 JWT     │
     │                    │  提取 sub (user_id)│
     │                    │                    │
     │                    │  通过 user_id 查询  │
     │                    │───────────────────>│
     │                    │  返回 User 对象    │
     │                    │<───────────────────│
     │                    │                    │
     │  返回受保护资源     │                    │
     │<───────────────────│                    │
```

---

## 速率限制

登录和注册端点有 **IP 级别的请求频率限制**:

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 窗口大小 | 60 秒 | 滑动时间窗口 |
| 最大请求数 | 5 次/窗口 | 每个 IP 在窗口内的请求上限 |
| 限制范围 | `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/password`, `/api/v1/auth/account`, `/api/v1/auth/refresh`, `/api/v1/auth/logout` | 所有认证端点 |

超出限制时返回 429:
```json
{
  "code": 429,
  "message": "Too many requests, please try again later",
  "data": null
}
```

**注意**: 速率限制数据存储在进程内存中, 多实例部署时不共享, 进程重启后数据丢失.

---

## 错误码对照表

所有 API 错误使用统一格式 `{code: <HTTP 状态码>, message: "<英文错误信息>", data: null}`. 前端通过 `errorMapping.ts` 将英文消息映射为用户当前语言的友好提示.

| HTTP 状态码 | API 英文消息 | 中文提示 | 触发场景 |
|------------|-------------|---------|---------|
| 400 | `Current password is incorrect` | 当前密码错误 | 修改密码时旧密码不匹配 |
| 400 | `Password is incorrect` | 当前密码错误 | 注销账号时密码不匹配 |
| 400 | `Account locked due to too many failed attempts, please try again in {n} minutes` | 账户已锁定, 请在 {n} 分钟后重试 | 5 次登录失败后锁定 15 分钟 |
| 401 | `Invalid username or password` | 用户名或密码错误 | 登录凭据无效 |
| 401 | `Invalid or expired token` | 无效或过期的令牌 | JWT 解码失败或已过期 |
| 401 | `User not found` | 用户不存在 | Token 有效但用户已删除 |
| 403 | `Access denied` | 无权访问 | 非管理员访问管理员接口 |
| 404 | `{entity} not found` | {entity} 未找到 | 请求的资源不存在 |
| 409 | `Username already exists` | 用户名已存在 | 注册时用户名重复 |
| 422 | (Pydantic 校验错误, 含字段名, 如 `Password must be at least 8 characters with at least 1 letter and 1 digit`) | (映射为具体校验提示) | 请求参数不符合 schema 约束 (含密码强度要求) |
| 429 | `Too many requests, please try again later` | 请求过于频繁, 请稍后再试 | 超过速率限制 |

### 422 校验错误映射

Pydantic 校验错误消息包含字段路径和具体原因. 前端通过正则模式匹配映射为友好文案:

| Pydantic 错误模式 | 中文提示 | 英文提示 |
|------------------|---------|---------|
| `password.*at least 8 characters` | 密码至少需要 8 个字符, 且包含字母和数字 | Password must be at least 8 characters with at least 1 letter and 1 digit |
| `password.*at most 100 characters` | 密码不能超过 100 个字符 | Password must be at most 100 characters |
| `password.*letter.*digit` | 密码需包含至少 1 个字母和 1 个数字 | Password must contain at least 1 letter and 1 digit |
| `username.*at least 2 characters` | 用户名至少需要 2 个字符 | Username must be at least 2 characters |
| `username.*at most 50 characters` | 用户名不能超过 50 个字符 | Username must be at most 50 characters |
| `field required` | 请填写用户名和密码 | Please fill in username and password |

---

## 环境变量配置

| 变量 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `JWT_SECRET` | **是** | 无 | JWT HS256 签名密钥, 可使用 `python -c "import secrets; print(secrets.token_urlsafe(64))"` 生成 |
| `ADMIN_PASSWORD` | 否 | 随机生成 | Admin 种子用户的初始密码, 每次启动自动同步 |
| `DATABASE_URL` | 否 | `sqlite:///./data/tool_web.db` | SQLAlchemy 数据库连接字符串 |
| `ALLOWED_ORIGINS` | 否 | `http://localhost:8000,http://localhost:8003` | CORS 允许的来源 (逗号分隔) |
| `LOG_LEVEL` | 否 | `INFO` | 日志级别 |

配置方式: 在项目根目录创建 `.env` 文件 (参考 `.env.example`):
```env
JWT_SECRET=your-generated-secret-key-here
ADMIN_PASSWORD=your-admin-password
```

---

## Docker 部署中的认证相关配置

### docker-compose.yml (本地开发)
```yaml
services:
  backend:
    build: ./backend
    environment:
      - DATABASE_URL=sqlite:///./data/tool_web.db
      - JWT_SECRET=${JWT_SECRET}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-}
      - ALLOWED_ORIGINS=http://localhost:8003
```

### docker-compose.prod.yml (生产环境)
```yaml
services:
  backend:
    image: ${DOCKER_USER:-user}/tool-web-backend:latest
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
```

前端 Nginx 将 `/api` 请求代理到 `http://backend:8001`, 认证请求在容器网络内部完成.

# Current Frontend Note

Authentication state is still owned by `frontend/src/context/AuthContext.tsx`, but the route guard and authenticated shell now live in `frontend/src/layouts/index.tsx`. Global providers and `themeBridge` initialization live in `frontend/src/app.tsx`. Older references in historical sections to `frontend/src/App.tsx` or `frontend/src/main.tsx` mean the pre-Umi Vite entry.
