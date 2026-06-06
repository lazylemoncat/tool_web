# Tool Web 登录注册功能文档

## 功能概述

Tool Web 提供基于 **JWT (JSON Web Token)** 的用户认证系统, 支持以下功能:

- **用户注册**: 创建新账号, 自动登录并返回 JWT
- **用户登录**: 验证用户名和密码, 返回 JWT; 支持 "记住我" 延长登录有效期
- **忘记密码**: 登录页可通过已启用的 TOTP 或恢复码重置密码
- **登录锁定**: 同一账户 5 次失败尝试后锁定 15 分钟, 防止暴力破解
- **Cookie 认证**: JWT 通过 httpOnly secure cookie 传递, 兼顾安全与便利
- **Token 自动刷新**: 前端在 token 即将过期时自动调用 `/refresh` 续期, 用户无感知
- **修改密码**: 已登录用户修改账号密码, 要求密码至少 8 个字符且包含字母和数字
- **注销账号**: 已登录用户永久删除账号及所有关联数据
- **身份验证**: 通过 httpOnly cookie 或 Authorization header 验证请求身份
- **偏好设置**: 已登录用户可更新个人偏好 (主题 / 语言 / 默认筛选)
- **语言切换**: 登录页支持中文/English 实时切换, 注册页跟随当前语言
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
3. 输入用户名 (3-50 个字符), 前端会调用 `/api/v1/auth/username-availability` 实时提示是否已被使用
4. 输入密码 (8-100 个字符, 需包含字母和数字), 可将鼠标悬停在密码强度旁的问号图标查看规则
5. 输入确认密码, 前端会实时提示两次密码是否一致
6. 点击提交按钮, 成功后自动登录并直接进入首页

**API 调用**:
```bash
curl -X POST http://localhost:8004/api/v1/auth/register \
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

**检查用户名可用性**:
```bash
curl "http://localhost:8004/api/v1/auth/username-availability?username=myuser"
```

响应:
```json
{
  "username": "myuser",
  "available": true
}
```

---

### 2. 登录

**前端操作**:
1. 在登录/注册页面默认的 "登录" 标签下
2. 输入用户名和密码
3. 点击提交按钮, 成功后进入主界面

**API 调用**:
```bash
curl -X POST http://localhost:8004/api/v1/auth/login \
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
curl -X GET http://localhost:8004/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```

Token 无效或用户不存在时返回 401.

---

### 4. 更新用户偏好设置

```bash
curl -X PUT http://localhost:8004/api/v1/auth/preferences \
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
curl -X POST http://localhost:8004/api/v1/auth/logout \
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
curl -X PUT http://localhost:8004/api/v1/auth/password \
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

### 7. 忘记密码 / 重置密码

**前端操作**:
1. 在登录页点击 "忘记密码?"
2. 输入用户名
3. 选择动态验证码或恢复码
4. 输入验证码或恢复码, 新密码和确认新密码
5. 点击 "重置密码", 成功后使用新密码登录

**API 调用**:
```bash
curl -X POST http://localhost:8004/api/v1/auth/password/reset \
  -H "Content-Type: application/json" \
  -d '{"username": "myuser", "method": "totp", "code": "123456", "new_password": "newpass123"}'
```

成功返回 204 (无内容). 用户必须已启用 MFA. 当前项目未建模邮箱字段, 也没有邮件发送服务, 因此本流程先支持 2FA 重置.

验证失败时返回 401:
```json
{
  "code": 401,
  "message": "MFA code is invalid",
  "data": null
}
```

---

### 8. 注销账号

**前端操作**:
1. 登录后进入 "设置" 页面
2. 在红色危险区域点击 "注销我的账号"
3. 输入当前密码确认
4. 点击确认按钮, 成功后自动退出登录并返回登录页
5. 账号及所有关联数据 (文件夹、任务、主题、标签) 被永久删除

**API 调用**:
```bash
curl -X DELETE http://localhost:8004/api/v1/auth/account \
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

### 9. Token 自动刷新

当前端检测到 token 即将过期 (默认有效期 1 小时, 剩余时间不足 5 分钟时), 自动调用 `/refresh` 端点获取新 token, 用户无需重新登录.

**API 调用**:
```bash
curl -X POST http://localhost:8004/api/v1/auth/refresh \
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

### 10. 记住我

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

### 11. 密码显示切换

所有密码输入框右侧提供眼睛图标按钮, 点击可切换密码的显示/隐藏状态.

**适用页面**:
- 登录表单 (密码输入框)
- 注册表单 (密码输入框)
- 修改密码表单 (旧密码、新密码、确认新密码输入框)
- 注销账号确认 (密码输入框)

切换仅改变前端 input 的 `type` 属性 (password ↔ text), 不影响实际提交数据.

---

### 12. 语言切换

**认证页面**:
- 登录页卡片右上角显示 "中文" / "English" 切换按钮
- 点击即可实时切换界面语言, 无需登录
- 注册页跟随当前选择的语言显示表单标签、按钮和错误提示

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
| `GET` | `/api/v1/auth/username-availability` | 无 | 检查注册用户名是否可用 |
| `POST` | `/api/v1/auth/register` | 无 | 注册新用户, 返回 token |
| `POST` | `/api/v1/auth/login` | 无 | 登录, 返回 token; 支持 `remember_me` 字段 |
| `POST` | `/api/v1/auth/password/reset` | 无 | 通过 TOTP 或恢复码重置密码 |
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
| `frontend/src/app/login/page.tsx` | Next.js 登录页: 调用登录和 MFA 验证接口, 处理登录错误显示 |
| `frontend/src/app/register/page.tsx` | Next.js 注册页: 调用注册接口, 校验用户名/密码/确认密码, 按 `register.html` 还原注册表单视觉 |
| `frontend/src/components/auth/AuthLayout.tsx` | 认证页外层布局: 提供居中舞台和注册页装饰背景 |
| `frontend/src/components/auth/AuthCard.tsx` | 认证卡片: 提供品牌, 标题, 卡片尺寸, 阴影和入场动画 |
| `frontend/src/components/auth/PasswordInput.tsx` | 密码输入控件: 外置标签, outlined 输入框和显示/隐藏密码按钮 |
| `frontend/src/components/auth/PasswordStrengthBar.tsx` | 注册页密码强度条: 四段式强度反馈 |
| `frontend/src/app/layout.tsx` | Next.js 根布局: 挂载 `AuthProvider`, `AuthGuard`, 主题注册和应用壳层 |
| `frontend/src/components/auth/AuthGuard.tsx` | 路由守卫: 未登录用户跳转登录页, 已登录用户进入受保护页面 |
| `frontend/src/context/AuthContext.tsx` | 认证状态管理: `useAuth()` hook, 登录态恢复, 当前用户状态维护, 退出登录 |
| `frontend/src/lib/api.ts` | Fetch API client: 统一调用 `/api/v1/*`, 携带 cookie, 处理 refresh 和 API 错误 |
| `frontend/src/lib/types.ts` | 前后端共享的认证响应类型 |
| `frontend/next.config.ts` | Next.js rewrites: 将 `/api` 和 `/uploads` 代理到 `API_PROXY_TARGET` |

### 前端数据流

**首次加载 (会话恢复)**:
```
页面加载
    → AuthProvider mount
    → apiFetch GET /api/v1/auth/me (携带 httpOnly cookie)
    → 后端验证 cookie, 返回 { user }
    → AuthContext 恢复 user
    → isLoading = false
    → AuthGuard: isAuthenticated = true → 显示受保护页面
    (若 cookie 无效或不存在)
    → user = null, isLoading = false
    → AuthGuard: 跳转到 /login
```

**登录/注册**:
```
用户输入 (frontend/src/app/login/page.tsx)
    → AuthContext.login()
    → apiFetch POST /api/v1/auth/login
    → 后端返回 { user } 或 MFA challenge
    → 无 MFA 时 AuthContext 写入 user
    → 有 MFA 时调用 POST /api/v1/auth/mfa/verify 后写入 user
    → 登录页跳转到 /todo
```

### Token 管理

- **存储**: JWT 通过 httpOnly cookie 自动传递, 前端只保存当前 `user` 状态
- **发送**: Cookie 由浏览器自动携带, `apiFetch` 对所有相对路径请求使用 `credentials: "include"`
- **会话恢复**: 页面加载时 `AuthProvider` 自动调用 `GET /api/v1/auth/me`. 若 httpOnly cookie 有效则恢复 `user`, 用户无需重新登录; 若无效则由 `AuthGuard` 跳转到 `/login`
- **刷新**: `apiFetch` 在非认证请求遇到 401 时调用 `POST /api/v1/auth/refresh`, 成功后重试一次原请求
- **过期处理**: refresh 失败时抛出 401 错误, 调用方或路由守卫进入未登录状态
- **退出**: `AuthContext.logout()` 调用 `/api/v1/auth/logout` 清除服务端 cookie, 同时清除前端 `user`, 回到登录页

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
  frontend:
    build:
      context: ./frontend
      args:
        API_PROXY_TARGET: ${DOCKER_API_PROXY_TARGET:-http://backend:8000}
    environment:
      - API_PROXY_TARGET=${DOCKER_API_PROXY_TARGET:-http://backend:8000}
  backend:
    build: ./backend
    environment:
      - DATABASE_URL=sqlite:///./data/tool_web.db
      - JWT_SECRET=${JWT_SECRET}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-}
      - ALLOWED_ORIGINS=http://localhost:8003,http://localhost:3000
```

### docker-compose.prod.yml (生产环境)
```yaml
services:
  frontend:
    image: ${DOCKER_USER:-user}/tool-web-frontend:latest
    environment:
      - API_PROXY_TARGET=${DOCKER_API_PROXY_TARGET:-http://backend:8000}
  backend:
    image: ${DOCKER_USER:-user}/tool-web-backend:latest
    environment:
      - DATABASE_URL=sqlite:///./data/tool_web.db
      - JWT_SECRET=${JWT_SECRET}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-http://localhost:8003,http://localhost:3000}
```

前端 Next.js 通过 `next.config.ts` 将 `/api` 和 `/uploads` 请求代理到 `API_PROXY_TARGET`. Docker Compose 使用 `DOCKER_API_PROXY_TARGET` 注入该值, 默认是 `http://backend:8000`, 认证请求在容器网络内部完成.

# Current Frontend Note

Authentication state is owned by `frontend/src/context/AuthContext.tsx`, while the route guard and authenticated shell are mounted from `frontend/src/app/layout.tsx`. Older references in historical sections to Umi, Vite, `frontend/src/App.tsx`, or `frontend/src/main.tsx` mean pre-Next migration entries.

The current Next.js login page is `frontend/src/app/login/page.tsx`. It calls `frontend/src/lib/api.ts` directly, does not auto-refresh on `/api/v1/auth/login` 401 responses, and supports the `mfa_required` response by collecting a TOTP code or recovery code before calling `/api/v1/auth/mfa/verify`.

## Backend Type Checking

Auth ORM models in `backend/src/auth/adapters/sqlalchemy_models.py` use SQLAlchemy 2 `Mapped` and `mapped_column` annotations. User preferences are stored through `UserPreference` and should be accessed through `AuthStore.get_preferences()` / `AuthStore.update_preferences()` instead of a `User.preferences` attribute.
