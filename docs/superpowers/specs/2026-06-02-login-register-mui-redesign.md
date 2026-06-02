# 登录 & 注册页面视觉还原设计文档

**日期:** 2026-06-02
**分支:** `feature_auth_refactor`
**目标:** 将根目录 `login.html` 和 `register.html` 原型的高度还原到 Next.js + MUI 前端

---

## 1. 背景与目标

项目根目录下的 `login.html` 和 `register.html` 是独立原型（纯 HTML/CSS/JS），使用 Material Design 3 token 系统 + oklch 色彩，视觉设计精美。当前 Next.js 已有 `/login` 页面（功能完整，含 MFA），但视觉风格不匹配原型；`/register` 页面已被删除。

**目标:** 保留现有功能逻辑（AuthContext、MFA、API 集成），用 MUI 组件重写样式以匹配原型视觉效果；新建注册页。

---

## 2. 设计决策

| 决策项 | 选择 | 说明 |
|--------|------|------|
| 范围 | A - 仅视觉效果 | 保留 MFA 流程、AuthContext、API 集成，重写样式 |
| 色彩 | B - 保留现有主题 | 不动 MUI `#6C5CE7` primary，只匹配结构层视觉 |
| 布局 | A - 完全复刻 | 保留装饰背景圆圈、flexbox 居中、完整阴影层级 |
| 动画 | A - 完全复刻 | CSS keyframes 卡片入场 + 交错淡入 + 自定义 snackbar |

---

## 3. 组件架构

### 3.1 新建文件

| 文件路径 | 职责 |
|----------|------|
| `frontend/src/components/auth/AuthLayout.tsx` | 装饰背景圆圈（`::before`/`::after` 等效）+ flexbox 居中容器 |
| `frontend/src/components/auth/AuthCard.tsx` | MUI Paper 卡片，elevation-3 阴影，16px 圆角，card-enter 动画，内含 Brand + Title |
| `frontend/src/components/auth/PasswordInput.tsx` | 密码输入 + 显隐切换（MUI OutlinedInput + IconButton endAdornment），1.5px 边框 + 3px focus ring |
| `frontend/src/components/auth/PasswordStrengthBar.tsx` | 4 段进度条，实时评分（红→黄→绿），仅注册页使用 |
| `frontend/src/app/register/page.tsx` | 注册页：用户名 + 密码 + 确认密码 + 强度条，接入后端注册 API |

### 3.2 修改文件

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `frontend/src/app/login/page.tsx` | 重写 | 用新组件包裹，保留 MFA 流程 + AuthContext 集成 |
| `frontend/src/theme.ts` | 微调 | 输入框边框宽度 1.5px、focus ring box-shadow、阴影层级、圆角 |

### 3.3 不动的文件

- `frontend/src/context/AuthContext.tsx` — 复用 login()、verifyMfa()、logout()
- `frontend/src/components/auth/AuthGuard.tsx` — 路由守卫逻辑不变
- `frontend/src/components/theme/ThemeRegistry.tsx` — 主题机制不变
- `frontend/src/lib/api.ts` — 如需注册 API，仅新增 `register()` 函数

---

## 4. 视觉规格

### 4.1 间距（MUI spacing `sx`）

| 元素 | 桌面端 | 移动端 (<520px) |
|------|--------|-----------------|
| 页面 padding | `24px` (3) | `12px` (1.5) |
| 卡片 padding | `48px 40px 40px` | `32px 24px 28px` |
| 字段间距 | `20px` (2.5) | 同 |
| 输入框 padding | `14px 16px` | 同 |
| 按钮 padding | `14px 24px` | 同 |
| Brand 底部 | `32px` (4) | `24px` (3) |

### 4.2 字体

| 元素 | MUI Variant | 覆盖 |
|------|-------------|------|
| Brand "ToolWeb" | `h5` | fontWeight: 700, letterSpacing: -0.02em |
| Title "欢迎回来"/"创建账号" | `h4` | fontWeight: 700, letterSpacing: -0.02em |
| Field Label | `caption` | fontWeight: 600 |
| Button | `button` | fontWeight: 600 |
| Error text | `caption` | error color |

现有 MUI theme 已配置 Plus Jakarta Sans 字体，无需额外引入。

### 4.3 输入框

- 边框：`1.5px solid` theme.palette.divider（hover → onSurfaceVariant）
- Focus ring：`boxShadow: 0 0 0 3px` primaryContainer 色
- Error state：边框 error 色，focus ring 变 errorContainer 色
- 圆角：8px（shape-corner-s）
- 实现：覆盖 MUI `OutlinedInput` 的 `.MuiOutlinedInput-notchedOutline` 样式

### 4.4 卡片

- 容器：MUI `Paper` elevation={8} 或自定义 boxShadow
- 阴影：`0 10px 24px -4px rgba(0,0,0,0.12), 0 4px 8px -4px rgba(0,0,0,0.08)`
- 圆角：16px（shape-corner-l）
- 最大宽度：440px

### 4.5 按钮

- 全宽，主色背景，白色文字
- 圆角：16px
- Hover：elevation + brightness(1.08)
- Active：scale(0.98)
- Loading：CircularProgress size={20} + disabled + 文字淡化

### 4.6 装饰背景圆圈

- 最大圆：600x600px，primaryContainer 色，定位 `top: -200px; right: -150px`，opacity: 0.3
- 小圆：400x400px，secondaryContainer 色，定位 `bottom: -100px; left: -100px`，opacity: 0.2
- 移动端 (<520px)：两个圆隐藏
- 实现：MUI Box + borderRadius: 50% + absolute 定位 + pointerEvents: none

---

## 5. 动画规格

### 5.1 卡片入场

```
@keyframes card-enter {
  0%   { opacity: 0; transform: translateY(20px) scale(0.97); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
// 0.5s ease-out, animation-fill-mode: both
```

### 5.2 表单元素交错淡入

```
@keyframes fade-slide-up {
  0%   { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}
// 0.4s ease-out, animation-fill-mode: both
// 延迟: stagger-1 (0.02s) → stagger-6 (0.12s)，每级 +0.02s
```

### 5.3 Button Loading

- MUI `CircularProgress size={20}` 替换按钮文字
- 按钮 disabled，文字 opacity: 0.7
- 旋转动画：0.7s linear infinite

### 5.4 Snackbar

- MUI `Snackbar` + `Slide` transition (direction: 'up')
- 自定义：左侧 4px 彩色 accent bar（error 色为红色）
- 缓动：`cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoot)

---

## 6. 数据流

### 6.1 Login 登录

```
表单提交 → 清错误 → 前端校验(非空) → AuthContext.login(username, pw)
  → API: POST /api/v1/auth/login
  → 成功: router.push('/todo')
  → MFA 响应: 切换到 MFA 视图 → AuthContext.verifyMfa(challenge_id, code)
    → 成功: router.push('/todo')
    → 失败: MFA 字段错误
  → 失败: ErrorBanner 显示错误消息
```

### 6.2 Register 注册

```
表单提交 → 清错误 → 前端校验(用户名≥3, 密码≥8, 匹配)
  → API: POST /api/v1/auth/register { username, password }
  → 成功: Snackbar "注册成功" + setTimeout → router.push('/login')
  → 409: ErrorBanner + 用户名字段错误 "用户名已存在"
  → 422: 对应字段显示后端校验消息
  → 其他错误: ErrorBanner
```

---

## 7. 错误处理

### 7.1 前端校验

| 页面 | 字段 | 规则 |
|------|------|------|
| Login | 用户名 | 非空 (trimmed) |
| Login | 密码 | 非空 |
| Register | 用户名 | 非空 + ≥3 字符 |
| Register | 密码 | 非空 + ≥8 字符 |
| Register | 确认密码 | 非空 + 与密码一致 |
| Register | 密码强度 | 仅 UI 提示，不强制拦截 |

### 7.2 API 错误映射

| HTTP 状态 | Login | Register |
|-----------|-------|----------|
| 401 | ErrorBanner: "用户名或密码错误" | N/A |
| 409 | N/A | ErrorBanner + 用户名字段: "用户名已存在" |
| 422 | 对应字段显示后端消息 | 对应字段显示后端消息 |
| 429 | ErrorBanner: "请求过于频繁" | 同 |
| 网络错误 | ErrorBanner: "网络连接失败" | 同 |
| 500 | ErrorBanner: "服务器错误" | 同 |

---

## 8. 状态覆盖

每个页面需覆盖以下状态：

1. **初始加载** — 卡片入场动画 + 第一个输入框自动聚焦 (400ms 延迟)
2. **输入中** — 实时清除对应字段错误
3. **校验失败** — 字段边框变红 + 错误文字显示
4. **提交中** — 按钮 spinner + disabled
5. **提交成功** — Login→跳转 /todo；Register→snackbar→跳转 /login
6. **API 错误** — ErrorBanner / 字段错误 + 解除 loading
7. **MFA 流程** (仅 Login) — 切换到 MFA 输入视图 (TOTP / recovery code)
8. **Dark mode** — 响应 ThemeRegistry 主题变更
9. **Mobile <520px** — 装饰圆隐藏 + 卡片靠上 + 间距压缩
10. **已登录访问** — 自动重定向到 /todo

---

## 9. 响应式

单 breakpoint：`max-width: 520px`

- 页面 padding: 24px → 12px
- 对齐: center → flex-start + padding-top: 60px（避开 theme toggle）
- 装饰圆: 可见 → 隐藏
- 卡片 padding: 48px 40px 40px → 32px 24px 28px
- 卡片圆角: 16px → 12px
- 卡片阴影: elevation-3 → elevation-2
- Title 字体: 28px → 24px

---

## 10. 验证计划

1. **视觉对比** — 浏览器并排打开 HTML 原型 vs Next.js 页面，截图逐项对比
2. **完整流程** — 走通 login→MFA→todo 和 register→login→todo
3. **边界测试** — 空表单、无效凭证、用户名冲突、网络中断、password toggle、dark/light 切换
4. **响应式** — <520px 视口验证所有缩略变化
5. **动画** — 确认入场动画播放、loading spinner、snackbar 滑入

---

## 11. 依赖与风险

- **后端注册 API**: ✅ 已确认 `POST /api/v1/auth/register` 存在（返回 AuthResponse，201）。需在 `api.ts` 中新增 `register()` 函数（当前缺失）
- **MFA 兼容**: 登录页重写时需保留现有 MFA 流程的两个视图切换逻辑
- **主题兼容**: theme.ts 微调不能影响 /todo 和 /finance 页面的现有样式
