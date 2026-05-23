# Tool Web 前端 UX 全栈重构 + 通用组件库

## Context

`feature_finance` 分支 Finance MVP 11 项功能已完成, 但前端积累显著 UX 与维护性问题:

- 加载态只有 `Loading...` 文本, 无 skeleton/spinner
- 删除操作无二次确认, 误删风险高
- 表单校验失败静默 (`BudgetForm.handleSubmit` 直接 return)
- Finance 交易列表 9 列在 < 768px 移动端溢出
- 99% 元素无 ARIA
- `TransactionForm.tsx` 471 行, `FinancePage.tsx` 22 个 useState
- `index.css` 2167 行, 75 处内联样式, 76 处硬编码 hex
- 按钮风格混杂 (`.add-btn` / `.btn-submit` / `.finance-tx-del` / `.filter-btn` / `.custom-btn-*`)
- 缺统一 Button/Modal/Input/Skeleton/EmptyState 组件
- 缺 spacing / font-size token

**项目未发布**, 直接重构, 不考虑兼容老接口/老 token/老主题文件. 主题文件结构本次一并重新设计, 老 schema 直接淘汰.

目标: 重做 token 体系 + 基于 Radix headless 的通用组件库, 视觉换现代极简 (cool neutral + Indigo/Violet accent), Finance 与 Todo 全面接入新组件, 重新设计主题文件 schema, 收尾 a11y 与响应式.

---

## 设计决策汇总 (与 Rex 已确认)

| 项 | 决策 |
|----|------|
| 范围 | 全栈高优 + 通用组件库 |
| 组件底层 | Radix UI (headless), 项目 CSS 包样式 |
| 视觉重做 | 是 |
| 调性 | 现代极简 (cool neutral + 单 accent) |
| Accent | Indigo / Violet |
| 节奏 | 单 plan 内部分 6 阶段推进 |
| 样式工具 | 纯 CSS + CSS 变量 (拆分 `index.css`) |
| 执行路径 | 自底向上 |
| 发布状态 | 未发布, 不留兼容层 |

---

## 主题文件能力 (重新设计)

`themeEngine.ts` 现支持: CSS 变量注入 / 自定义按钮 (`toolbar`/`sidebar`/`todoItem` 三 slot) / 脚本注入 (`new Function`) / 四种 action (`runScript`/`callApi`/`navigate`/`toggleFilter`). 本次重构后能力扩展且统一, schema 重新设计:

### 新主题文件 schema (v1, 项目唯一版本)

```jsonc
{
  "name": "string",
  "version": "1.0",
  "tokens": {                          // 新统一 token 命名空间 (取代 global)
    "light": { "--color-bg": "#...", ... },
    "dark": { "--color-bg": "#...", ... }
  },
  "pages": {                           // 页面级覆盖, 同 light/dark 分层
    "finance": { "light": {}, "dark": {} }
  },
  "buttons": [                         // 自定义按钮
    {
      "id": "x",
      "label": { "zh": "...", "en": "..." },
      "icon": "string|emoji",
      "position": "toolbar|sidebar|todoItem|financeToolbar|txRowAction|modalFooter|dashboardCard|settingsSection",
      "action": "runScript|callApi|navigate|toggleFilter|openConfirmDialog|showToast|openModal",
      "...action-specific fields"
    }
  ],
  "scripts": "// JS string, executed once on load, may register window.toolweb.scripts.<name>"
}
```

### 主题脚本运行时 (新增 `window.toolweb`)

提供主题脚本可调用的稳定 API:

```ts
window.toolweb = {
  ui: { confirm, toast, openModal, openDrawer },   // 通用组件命令式入口
  i18n: { t, locale },                              // 翻译与当前语言
  api: { get, post, put, delete, upload },          // 已封装的 axios
  events: { on, off, emit },                        // 自定义事件总线
  theme: { getActiveConfig, switchPage }
}
```

主题脚本应注册函数到 `window.toolweb.scripts.<name>`, 而非裸 `window.<name>` (老做法), 命名空间收敛.

### 新 token 命名规范

全新一套 token, 不背老命名. 三层:

- **原子 token** (`tokens/atoms.css`): `--color-gray-1` 至 `--color-gray-12`, `--color-accent-1` 至 `--color-accent-12`, `--space-0` 至 `--space-12`, `--font-size-xs/sm/md/lg/xl/2xl/3xl`, `--radius-sm/md/lg/full`, `--shadow-1` 至 `--shadow-5`, `--duration-fast/base/slow`, `--ease-*`, `--z-*`
- **语义 token** (`tokens/semantic.css`): `--color-bg`, `--color-bg-elevated`, `--color-bg-sunken`, `--color-fg`, `--color-fg-muted`, `--color-border`, `--color-accent`, `--color-accent-hover`, `--color-success`, `--color-danger`, `--color-warning`, `--color-info`, `--color-income`, `--color-expense`
- **组件 token** (各组件 css 内): 引用语义 token

light / dark 切换只重定义语义 token, 原子 token 不变.

---

## 目标架构

### 1. Token 体系

新增 `frontend/src/styles/tokens/`:

- `atoms.css` - 原子 token
- `semantic.light.css` - light 主题语义 token
- `semantic.dark.css` - dark 主题语义 token (`[data-theme="dark"]` 内)
- `typography.css` - 字体族 / 字号 / 字重 / 行高
- `motion.css` - 过渡 / 缓动
- `breakpoints.css` - 仅 JS 用 (`--bp-*`), media query 仍字面值

### 2. 通用组件库

新增 `frontend/src/components/ui/`. 每组件一文件夹 (`index.tsx` + `styles.css`):

| 组件 | 实现底层 | 关键能力 |
|------|---------|--------|
| `Button` | 原生 `<button>` | variant: `primary`/`secondary`/`ghost`/`danger`/`link`; size: `sm`/`md`/`lg`; `loading` + `iconLeft/Right`; `aria-busy` |
| `IconButton` | Button 包装 | 必填 `aria-label` |
| `Input` / `Textarea` | 原生 + label 包装 | `error` / `hint` / `prefix` / `suffix`; 自动绑 `<label htmlFor>` |
| `NumberInput` | Input 扩展 | 金额千分位, `min/max/step` |
| `Select` | `@radix-ui/react-select` | 键盘导航免费 |
| `Combobox` | `@radix-ui/react-popover` + 自写过滤 | 分类 / 标签 / 待办搜索 |
| `Modal` / `Dialog` | `@radix-ui/react-dialog` | 焦点陷阱 + Esc + overlay 点击 |
| `Drawer` | dialog + 侧滑 | 移动端表单首选 |
| `ConfirmDialog` | Modal 封装 | 命令式 `confirm({ title, description, danger })` Promise API |
| `Toast` | `@radix-ui/react-toast` | 替换现有, 出入动画 + 队列 |
| `Tooltip` | `@radix-ui/react-tooltip` | focus 也触发 |
| `Popover` | `@radix-ui/react-popover` | 筛选面板 / 详情卡 |
| `Tabs` | `@radix-ui/react-tabs` | 替代自建 tab |
| `Skeleton` | 纯 CSS shimmer | block / circle / text |
| `EmptyState` | 纯 CSS | icon + title + description + action slot |
| `Spinner` | 纯 CSS | size / inline / overlay |
| `Card` | 纯 div | header / body / footer slot |
| `Badge` | 纯 span | semantic 配色 |
| `Avatar` | img / 初始字符 | size + fallback |
| `FormField` | 组合 | label + input + error + hint 统一布局 |

入口 `frontend/src/components/ui/index.ts` 统一导出. 通过 `frontend/src/runtime/themeBridge.ts` 把命令式 API (`confirm`/`toast`/`openModal`/`openDrawer`) 挂到 `window.toolweb.ui`.

### 3. 主题运行时 (重写)

完全重写 `frontend/src/themeEngine.ts` + 新建 `frontend/src/runtime/themeBridge.ts`:

- `themeEngine`: 解析新 schema, 注入 token, 注册按钮, 执行 scripts
- `themeBridge`: 启动时把 `window.toolweb` 挂上, 提供给主题脚本与自定义按钮 action
- 新 position slot 全部在 React 树对应位置插 `<CustomButtons position="..." />`
- 新 action 全部在 `executeButtonAction` 实现

### 4. 文件结构调整

- `frontend/src/styles/index.css` 拆分:
  - `tokens/*.css` (token 层)
  - `base.css` (reset / 排版 / 默认元素样式)
  - `layout.css` (sidebar / main 容器)
  - `index.css` 顶部统一 `@import`
  - 组件样式跟随各 `components/**/styles.css`, 不再集中
- `hooks/useFinance.ts` 拆: `useLedgers` / `useAccounts` / `useTransactions` / `useBudgets` / `useEvents` / `useCategories`
- `pages/FinancePage.tsx` 拆: `FinanceDashboardPage` / `TransactionsPage` / `BudgetsPage` / `EventsPage`, nested route
- `components/finance/TransactionForm.tsx` 拆: 容器 + `TxBasicFields` / `TxAmountInput` / `TxCategoryPicker` / `TxAttachments` / `TxSubItems` / `TxRelations`

---

## 阶段划分 (6 阶段)

### 阶段 1: Token 体系 + 主题运行时重写

1. 建 `frontend/src/styles/tokens/` 与各 token 文件 (atoms + semantic light/dark + typography + motion + breakpoints)
2. 重写 `frontend/src/themeEngine.ts` 用新 schema (`tokens.light` / `tokens.dark` / `pages.<name>.light` / `pages.<name>.dark` / `buttons` / `scripts`)
3. 新建 `frontend/src/runtime/themeBridge.ts`: 启动挂 `window.toolweb`, 暴露 ui/i18n/api/events/theme
4. `frontend/src/main.tsx` 调用 themeBridge 初始化
5. 重写 `frontend/public/theme-template.json` 为新 schema 完整示例
6. 新建 `frontend/public/help/theme-schema.md` 文档化全部 token / slot / action / `window.toolweb` API
7. 删除老的 `--bg-primary` / `--bg-sidebar` 等老变量名, 一次性切到新语义 token
8. 更新 `docs/` 下相关模块文档

**验证**: 默认主题视觉切到现代极简; 上传一份基于新 schema 的主题文件可覆盖 token 与新增按钮

### 阶段 2: 通用组件库

1. `npm install` Radix 依赖: `@radix-ui/react-dialog` / `react-select` / `react-tooltip` / `react-popover` / `react-tabs` / `react-toast` / `react-dropdown-menu`
2. `components/ui/` 实现各组件 + 同名 `styles.css`
3. `index.ts` 导出, `themeBridge.ts` 挂载命令式 API 到 `window.toolweb.ui`
4. dev 路由 `/ui-preview` 展示所有组件 (临时验证用, 生产构建排除)
5. 通用文案 (取消/确认/删除/保存 等) 入 `locales/{zh,en}.json` `ui.*` 命名空间

**验证**: `/ui-preview` 各组件可工作; `confirm()` Promise resolve/reject 正常; Tab/Esc 焦点行为正确

### 阶段 3: 全局样式重写

1. 拆 `index.css` 为 `tokens/*` + `base.css` + `layout.css`
2. 删除全部老类名 (`.btn-submit` / `.btn-cancel` / `.btn-danger` / `.add-btn` / `.filter-btn` / `.finance-tx-*` / `.custom-btn-*`), 改为新 ui 组件类名 (`btn-primary` 等命名空间在组件 css 内, 全局不再出现这些类)
3. 清除全部硬编码 hex (`#4a7c59`/`#e07050`/`#6b8cce`/`#c4943a`/`#e8a838`/`#4caf50`), 换语义 token
4. `LandingPage.tsx` 硬编码 `Personal productivity & finance hub` 入 `landing.subtitle`
5. `App.tsx:344` `'多选'` 入 `app.bulkSelect`
6. `FinanceDashboard.tsx` `DEFAULT_TYPES` 入 `finance.defaultAccountTypes`
7. 媒体查询补 1024 / 1280 断点
8. Header / Sidebar 用新组件 + 新 token 重写

**验证**: 视觉切到现代极简; i18n 切英文 LandingPage 副标题切换

### 阶段 4: Finance 模块重构

1. 拆 `pages/FinancePage.tsx` 为子页面 + nested route
2. 拆 `useFinance.ts` 为 6 个资源 hooks
3. 拆 `TransactionForm.tsx` 为容器 + 6 子组件
4. 全部删除操作改 `confirm()` (账户卡 / 交易 / 预算 / 事件 / 标签 / 分类)
5. `FinanceDashboard` 与 `TransactionList` 加 Skeleton
6. 加 EmptyState: 无账本 / 无交易 / 无预算 / 无事件 (icon + 引导)
7. 表单校验改用 `FormField` + 字段级 error; `EventForm` 校验 end_at < start_at
8. 移动端 (< 768px) 交易列表由表格切卡片堆叠 (新建 `TxCard.tsx`)
9. 金额输入用 `NumberInput`
10. 内联样式 (75 处) 清除到组件 css

**验证**: 端到端走 (新建账本 → 账户 → 交易 → 预算 → 事件 → 删除); 移动端 360 / 414 断点; 主题文件覆盖 `pages.finance` 影响仅 Finance

### 阶段 5: Todo 模块重构

1. `TodoList` / `TodoItem` / `TodoForm` / `SubTaskList` / `TaskDetail` / `TagInput` 改用新 ui 组件
2. 删除 / 批量删除用 `confirm()`
3. 加载与空状态用 Skeleton / EmptyState
4. 保留 dnd-kit, 仅替换视觉
5. 内联样式清除

**验证**: 全功能回归 (CRUD / 拖拽 / 子任务 / 标签 / 筛选); 主题文件 `position: "todoItem"` 按钮在每个 TodoItem 渲染

### 阶段 6: a11y + 响应式 + 收尾

1. 全局补 `aria-label` / `aria-describedby` / `role` (重点: 图标按钮, 表格, 状态区)
2. `ErrorBoundary` 文案 i18n
3. 颜色对比度审查 (WCAG AA, Lighthouse), 修正不达标 token
4. 键盘导航 audit: Tab 顺序 / Modal 焦点陷阱 / Esc 关闭 / Enter 提交
5. 横屏平板布局补
6. 清除阶段 3 拆分时漏掉的死代码
7. Bundle size 审查 (Radix 增加多少, gzip 后), 必要时按需 import

**验证**: Lighthouse Accessibility ≥ 95; 全键盘 Finance + Todo 走一遍; 横屏 iPad 模拟; console 零错误

---

## 关键文件清单

### 新增

- `frontend/src/styles/tokens/{atoms,semantic.light,semantic.dark,typography,motion,breakpoints}.css`
- `frontend/src/styles/{base,layout}.css`
- `frontend/src/components/ui/{Button,IconButton,Input,Textarea,NumberInput,Select,Combobox,Modal,Drawer,ConfirmDialog,Toast,Tooltip,Popover,Tabs,Skeleton,EmptyState,Spinner,Card,Badge,Avatar,FormField}/{index.tsx,styles.css}` + `index.ts`
- `frontend/src/runtime/themeBridge.ts`
- `frontend/src/components/finance/TxCard.tsx`
- `frontend/src/components/finance/transactionForm/{TxBasicFields,TxAmountInput,TxCategoryPicker,TxAttachments,TxSubItems,TxRelations}.tsx`
- `frontend/src/pages/finance/{FinanceDashboardPage,TransactionsPage,BudgetsPage,EventsPage}.tsx`
- `frontend/src/hooks/{useLedgers,useAccounts,useTransactions,useBudgets,useEvents,useCategories}.ts`
- `frontend/public/help/theme-schema.md`

### 重写

- `frontend/src/themeEngine.ts` - 新 schema, 全新接口
- `frontend/src/styles/index.css` - 改为只 `@import`
- `frontend/public/theme-template.json` - 新 schema 示例

### 修改

- `frontend/src/theme.ts` - 与新 token 协同
- `frontend/src/main.tsx` - 调 themeBridge 初始化
- `frontend/src/components/common/{Toast,ErrorBoundary,CustomButtons,SearchBar}.tsx` - Toast 包装新 Toast, ErrorBoundary i18n, CustomButtons 支持新 slot
- `frontend/src/pages/{LandingPage,FinancePage,HelpPage}.tsx`
- `frontend/src/App.tsx` - 硬编码字符串 i18n
- `frontend/src/components/finance/*.tsx` 全量
- `frontend/src/components/todo/*.tsx` 全量
- `frontend/src/components/auth/*.tsx`
- `frontend/src/components/settings/*.tsx`
- `frontend/src/hooks/useFinance.ts` - 拆完后删除
- `frontend/src/locales/{zh,en}.json` - 新增 `ui.*` 命名空间 + 漏译补全
- `frontend/package.json` - 新增 Radix 依赖
- `docs/` 各模块文档同步 (CLAUDE.md 规定)

### 删除

- `index.css` 中老类名规则 (`.btn-submit` / `.btn-cancel` / `.btn-danger` / `.add-btn` / `.filter-btn` / `.finance-tx-*` 等)
- `useFinance.ts` (拆完即删)
- 老变量名 (`--bg-primary` / `--bg-sidebar` 等)

---

## 验证方案

### 每阶段验证

- `npm run build` TypeScript 编译过
- `npm run dev` 访问 `http://localhost:5173`, 走受影响功能 (golden path + 边界)
- 上传新 schema 主题文件验证: token 覆盖 / 自定义按钮 (含新 position) / 脚本注册 `window.toolweb.scripts.*` 可被按钮触发 / 新 action (`openConfirmDialog`/`showToast`/`openModal`) 工作
- `git diff` 核对仅预期文件改 (CLAUDE.md 编码规范 #2)

### 阶段 6 最终验证

- Lighthouse: Accessibility ≥ 95, Best Practices ≥ 95, Performance ≥ 80
- 移动端模拟 (360 / 414 / 768): Finance 列表 / 表单 / 弹窗 无横向溢出
- 横屏 iPad (1024×768): 布局合理
- 键盘全程: Tab 进入 → 创建交易 → 选分类 → 提交; Esc 关弹窗; Modal 焦点陷阱
- 暗色主题切换无残留
- 上传随便颜色的主题文件视觉切换
- `cd backend && uv run pytest` 全绿
- 浏览器 console 零错 / 零警

---

## 风险与规避

| 风险 | 规避 |
|------|------|
| Radix 增加打包体积 | 按需 import + Vite tree-shake; 监控 bundle size |
| `index.css` 拆分 CSS 优先级混乱 | `@import` 顺序: tokens → base → layout → 各组件; 加注释 |
| `TransactionForm` 拆分破坏父子交易 / 附件 | 阶段 4 内分多 commit, 每抽一个子组件跑端到端 |
| `window.toolweb` 暴露过多致内部重构受限 | 白名单显式列对外方法, 内部组件 props 保灵活 |
| 阶段太长用户长期看不到效果 | 阶段 3 完成默认主题视觉立即可见 |

---

## 不在本计划范围内

- Calendar / Contact / Event / Summary / OAuth / PWA 等未来模块
- 后端 API 变更 (除非组件改造需要补字段, 单独评估)
- 主题市场 / 主题分享
- Storybook / 单测框架建设 (按需轻量临时方案)
- 国际化新增语种 (仅补漏译)
