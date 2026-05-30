# Theme File Schema (v1)

Tool Web 允许用户上传 JSON 主题文件以扩展 UI 与逻辑. 本文档定义文件结构, 可用 token, slot 位置与 API.

---

## 文件结构

```jsonc
{
  "name": "Theme name",
  "version": "1.0",
  "tokens": {
    "light": { "--color-bg": "#...", ... },
    "dark":  { "--color-bg": "#...", ... }
  },
  "pages": {
    "finance": {
      "light": { "--color-bg": "#..." },
      "dark":  {}
    }
  },
  "buttons": [
    {
      "id": "unique-id",
      "label": { "zh": "中文", "en": "English" },
      "icon": "🎨",
      "position": "toolbar",
      "action": "runScript",
      "scriptName": "doSomething"
    }
  ],
  "scripts": "toolweb.scripts.doSomething = () => { ... }"
}
```

---

## tokens (语义 token 覆盖)

`tokens.light` 在 `:root` 注入; `tokens.dark` 在 `[data-theme="dark"]` 注入. 任何未列出的 token 沿用默认.

### 颜色

| Token | 含义 |
|-------|------|
| `--color-bg` | 页面基础背景 |
| `--color-bg-elevated` | 卡片 / 悬浮容器 |
| `--color-bg-sunken` | 凹陷区 (toolbar 等) |
| `--color-bg-hover` | hover 浮起色 |
| `--color-bg-active` | 按下 / active 状态 |
| `--color-bg-overlay` | Modal 遮罩 |
| `--color-fg` | 主文字 |
| `--color-fg-muted` | 副文字 |
| `--color-fg-subtle` | 弱化文字 |
| `--color-fg-on-accent` | accent 上的文字 |
| `--color-border` | 默认边框 |
| `--color-border-strong` | 强调边框 |
| `--color-border-focus` | 聚焦轮廓色 |
| `--color-accent` | 主交互色 |
| `--color-accent-hover` | accent hover |
| `--color-accent-active` | accent active |
| `--color-accent-subtle` | accent 弱底 |
| `--color-accent-muted` | accent 中底 |
| `--color-success` / `-hover` / `-fg` | 成功 |
| `--color-danger` / `-hover` / `-fg` | 危险 |
| `--color-warning` / `-hover` / `-fg` | 警告 |
| `--color-info` / `-hover` / `-fg` | 信息 |
| `--color-income` | Finance 收入色 |
| `--color-expense` | Finance 支出色 |
| `--color-priority-high` / `-bg` | Todo 高优先级 |
| `--color-priority-medium` / `-bg` | Todo 中优先级 |
| `--color-priority-low` / `-bg` | Todo 低优先级 |

### 布局与排版

| Token | 含义 |
|-------|------|
| `--sidebar-width` | 侧边栏宽度 (默认 260px) |
| `--header-height` | 顶栏高度 |
| `--font-display` | 标题字体族 |
| `--font-body` | 正文字体族 |
| `--font-mono` | 等宽字体族 |
| `--font-size-xs` ... `--font-size-4xl` | 字号阶 |
| `--font-weight-regular/medium/semibold/bold` | 字重 |
| `--line-height-tight/snug/normal/loose` | 行高 |

### 形状 / 阴影 / 动效

| Token | 含义 |
|-------|------|
| `--radius-sm/md/lg/xl/full` | 圆角 |
| `--shadow-1` ... `--shadow-5` | 阴影分级 |
| `--duration-fast/base/slow` | 过渡时长 |
| `--ease-out` / `--ease-in-out` | 缓动函数 |
| `--transition-base` | 默认过渡 |

### 原子 token (可读不可建议覆盖)

`--color-gray-1` ... `--color-gray-12`, `--color-accent-1` ... `--color-accent-12`, `--space-0` ... `--space-12`. 这些供语义 token 引用, 直接改可能破坏比例.

---

## pages (页面级覆盖)

`pages.<pageName>` 在对应页面激活时叠加在全局 token 之上. 当前支持的 page name:

| pageName | 何时激活 |
|----------|---------|
| `todo` | 进入 Todo 主页 |
| `finance` | 进入 Finance 主页 |
| `settings` | 进入设置页 |
| `help` | 进入帮助页 |
| `landing` | 在首页 |

---

## buttons (自定义按钮)

每个按钮通过 `position` 选 slot, 通过 `action` 选行为.

### position slot

| position | 出现位置 |
|----------|---------|
| `toolbar` | Todo 工具栏右侧 |
| `sidebar` | 侧边栏底部 |
| `todoItem` | 每个 Todo 项右侧 |
| `financeToolbar` | Finance 顶部工具栏 |
| `txRowAction` | 每行交易尾部动作区 |
| `modalFooter` | 通用 Modal 底部 (与确认按钮并列) |
| `dashboardCard` | Finance Dashboard 卡片角落 |
| `settingsSection` | 设置页区块尾部 |

### action

| action | 必填字段 | 行为 |
|--------|---------|------|
| `runScript` | `scriptName` | 调用 `window.toolweb.scripts[scriptName]()` |
| `callApi` | `apiUrl`, `method` (默认 GET); 可选 `body`, `onSuccess` | 调 axios; 成功后调用 `scripts[onSuccess](data)` |
| `navigate` | `navigateTo` | 跳转 URL (支持 `http://`/`#hash`/`/path`) |
| `toggleFilter` | `filterKey`, `filterValue` | 派发 `filter:toggle` 事件 |
| `openConfirmDialog` | `confirmTitle`/`confirmDescription`; 可选 `confirmDanger`, `scriptName` (确认后执行) | 弹出确认框 |
| `showToast` | `toastMessage`; 可选 `toastVariant: info\|success\|warning\|error` | 弹 Toast |
| `openModal` | `modalId` | 派发 `toolweb:openModal` 事件, payload `{ id }` |

### label / icon

- `label` 为 `{ zh: ..., en: ... }`, 按当前语言取
- `icon` 为字符 / emoji / 简单 SVG 字符串

---

## scripts (注入脚本)

`scripts` 字段是一段 JavaScript 字符串. 加载主题时被执行一次. 入参 `toolweb` 即 `window.toolweb`.

应通过 `toolweb.scripts.<name> = fn` 命名空间注册函数, 避免污染 `window` 顶层. 注册后的函数可被 `runScript`, `openConfirmDialog`, `callApi.onSuccess` 通过 `scriptName` 调用.

示例:

```js
// scripts 字段
toolweb.scripts.refreshDashboard = () => {
  toolweb.events.emit('dashboard:refresh')
  toolweb.ui.toast({ message: 'Refreshed', variant: 'success' })
}

toolweb.scripts.confirmReset = () => {
  toolweb.ui
    .confirm({
      title: 'Reset?',
      description: 'This cannot be undone.',
      danger: true,
    })
    .then((ok) => {
      if (ok) toolweb.api.post('/finance/reset', {})
    })
}
```

---

## window.toolweb API

主题脚本可使用的稳定运行时入口.

### `toolweb.ui`

| Method | 签名 |
|--------|------|
| `confirm` | `({ title?, description?, confirmLabel?, cancelLabel?, danger? }) => Promise<boolean>` |
| `toast` | `({ message, variant?, duration? }) => void` |
| `openModal` | `(id: string, payload?: unknown) => void` |
| `openDrawer` | `(id: string, payload?: unknown) => void` |

### `toolweb.i18n`

| Field | 类型 |
|-------|------|
| `locale` | `'zh' \| 'en'` |
| `t` | `(key, vars?) => string` |

### `toolweb.api`

axios instance. `get(url)` / `post(url, body)` / `put(url, body)` / `delete(url)` / `patch(url, body)`. baseURL 已设为 `/api/v1`, 携带认证 cookie.

### `toolweb.events`

事件总线 (独立于 `window` 全局事件).

| Method | 签名 |
|--------|------|
| `on` | `(name, handler) => void` |
| `off` | `(name, handler) => void` |
| `emit` | `(name, detail?) => void` |

### `toolweb.theme`

| Method | 签名 |
|--------|------|
| `getActiveConfig` | `() => ThemeConfig \| null` |
| `getCurrentPage` | `() => string \| null` |
| `switchPage` | `(page: string \| null) => void` |

### `toolweb.scripts`

用户注册的命名函数仓库. 主题文件应只 `toolweb.scripts.foo = fn`, 不要赋值给 `window.foo`.

---

## 主题加载流程

1. 用户在 Settings 上传 / 创建主题, 后端存到 `user_themes` 表 (`config_json` 字段)
2. 登录后, `AppContent` 读 `preferences.custom_theme_id`, 调 `/themes/:id` 取 `config_json`
3. `JSON.parse` 后调用 `applyThemeConfig(config, currentPage)`
4. CSS 变量被注入到 `<style id="theme-custom">`, 优先级高于默认 token
5. `scripts` 字段被执行一次, `toolweb.scripts.*` 注册的函数可被按钮触发

---

## 注意

- 主题文件被信任执行 (类似浏览器扩展). 仅上传你自己写或来源可信的主题
- 不要在 `scripts` 内做 `fetch` 到第三方域 (CORS / 安全考虑)
- token 值必须是合法 CSS 值字符串, 否则该行被浏览器忽略
- 同名 `--color-*` 在 `tokens.light` 与 `tokens.dark` 都应给值, 否则切换主题模式时回退到默认
