# 记账模块 (Finance Module) 设计文档

## 上下文

基于 `accounting.html` 的视觉设计，在现有 Next.js + React + TypeScript + MUI v9 技术栈下，重构记账模块为 `/finance` 路由。使用模拟数据渲染，暂不接入后端。

### 现有约束
- 框架：Next.js 16 (App Router) + React 19 + TypeScript
- UI 库：MUI v9 + `@mui/icons-material` + `@mui/x-date-pickers`
- 图表：MUI X Charts（仅免费图表：PieChart、BarChart）
- 主题：现有 `theme.ts`，主色 `#6C5CE7`（紫色），字体 Plus Jakarta Sans
- 认证：`AuthGuard` 包裹所有页面，`LayoutClient` 提供全局顶部导航
- 现有模式参考：`src/app/todo/page.tsx` + TodoSidebar + ContentHeader

## 路由与导航

| 路径 | 文件 | 说明 |
|------|------|------|
| `/finance` | `src/app/finance/page.tsx` | 主页面，默认渲染 Dashboard（带 `?tab=dashboard` 查询参数切换标签） |

### 需要更新的现有文件
- `src/components/layout/GlobalNav.tsx`：将 `/accounting` 链接改为 `/finance`
- `src/components/layout/NavManageDialog.tsx`：将 `accounting` id 改为 `finance`，路径改为 `/finance`
- `src/components/layout/SettingsDialog.tsx`：将 `accounting` 选项值改为 `finance`

## 架构

```
AppLayout (LayoutClient + GlobalNav)
└── FinancePage (/finance)
    ├── FinanceSidebar
    │   ├── BookSelector (账本下拉)
    │   └── NavItems (8 项 + 徽章)
    └── MainContent
        ├── ContentHeader (复用)
        └── TabContent
            ├── DashboardTab
            ├── TransactionsTab
            ├── BooksTab
            ├── AccountsTab
            ├── CategoriesTab
            ├── TagsTab
            ├── BudgetsTab
            └── EventsTab
```

### 页面级状态（FinancePage）
- `activeTab: string` — 当前标签
- `mobileSidebarOpen: boolean` — 移动端侧栏开关
- 所有对话框/抽屉的 open 状态
- 所有 mock 数据作为 state（初期用 `useState`，后续可换 context）

## 文件结构

```
src/
├── app/
│   └── finance/
│       └── page.tsx              # 主页面 'use client'
├── components/
│   └── finance/
│       ├── FinanceSidebar.tsx     # 侧栏：Book 选择器 + 导航
│       ├── DashboardTab.tsx       # 仪表盘标签页
│       ├── Dashboard/
│       │   ├── StatCard.tsx       # KPI 统计卡片
│       │   ├── BudgetProgress.tsx # 预算进度条组件
│       │   ├── CategoryDonut.tsx  # 分类支出环形图 (MUI X PieChart)
│       │   ├── TrendChart.tsx     # 月度收支柱状图 (MUI X BarChart)
│       │   └── RecentTransactions.tsx # 最近交易列表
│       ├── TransactionsTab.tsx    # 交易记录标签页
│       ├── Transactions/
│       │   ├── FilterBar.tsx      # 筛选栏卡片
│       │   ├── TransactionRow.tsx # 单条交易行
│       │   └── SubTransaction.tsx # 子交易行
│       ├── BooksTab.tsx           # 账本管理
│       ├── AccountsTab.tsx        # 账户管理
│       ├── CategoriesTab.tsx      # 分类管理（树形）
│       ├── TagsTab.tsx            # 标签管理
│       ├── BudgetsTab.tsx         # 预算管理
│       ├── EventsTab.tsx          # 事件管理
│       ├── TransactionFormDialog.tsx # 交易表单弹窗
│       ├── TransactionDetailDrawer.tsx # 交易详情抽屉
│       └── EventDetailDrawer.tsx  # 事件详情抽屉
├── data/
│   └── mockFinance.ts            # 全部模拟数据
├── lib/
│   └── financeTypes.ts           # Finance 类型定义
```

### 复用现有组件
- `ContentHeader` — 页面标题栏（有 hamburger 按钮支持移动端侧栏）
- `ConfirmDialog` — 删除确认弹窗
- `EmptyState` — 空状态（需微调 props 使其通用化）
- `Skeleton` — 加载骨架屏（需微调使其通用化）

## 模拟数据 (`src/data/mockFinance.ts`)

### 数据结构

```typescript
interface Book { id, name, emoji, currency, description, createdAt, isActive }
interface Account { id, name, type, balance, initialBalance, isArchived, emoji }
interface Category { id, name, emoji, parentId, children? }
interface FinanceTag { id, name, color }
interface Budget { id, name, emoji, categoryName, amount, used, cycle, overspendThreshold }
interface FinanceEvent { id, name, emoji, description, startDate, endDate, color, transactions }
interface Transaction { id, type, amount, category, note, date, account, tags, parentId?, subTransactions? }
```

### Mock 数据量
- 3 个 Book
- 4 个 Account（含 1 个归档）
- 7 个 Category（含子分类）
- 6 个 Tag
- 3 个 Budget
- 2 个 Event
- 8+ 个 Transaction（含 1 个拆分交易）

## 页面设计详述

### 1. Sidebar (`FinanceSidebar`)

**桌面端**：固定 240px 宽度，`height: calc(100vh - 64px)`，`overflow-y: auto`。

**移动端**：MUI `SwipeableDrawer`，由 ContentHeader 的 hamburger 按钮触发。

**结构**：
1. Book 选择器（顶部）
   - 显示当前账本 emoji + 名称 + 货币
   - 点击展开下拉：列出所有账本 + "新建账本" 选项
   - 当前选中项有紫色 ✓ 标记
2. 导航项列表
   - 8 项，每项：emoji 图标 + 中文名 + 可选数字徽章
   - 选中项：紫色浅底 (`#E8E0FF`) + 紫色文字 (`#6C5CE7`) + 加粗
   - 悬停项：浅灰底
   - 徽章：`#E8E0FF` 背景，`#6C5CE7` 文字

### 2. Dashboard (`DashboardTab`)

**背景**：`#F5F6FA`，页边距 24px，卡片间距 16px。

**标题区**：
- 左："记账仪表盘"（26px 700）+ "日常账本 · 截至 2026 年 6 月"（13px `#4B5563`）
- 右：`周/月/年` 切换按钮组 + `+ 记一笔` 紫色按钮 + `管理仪表盘` 白色按钮

**Row 1 — 4 个 StatCard**：等宽网格 `grid-template-columns: repeat(4, 1fr)`，gap 16px。
- 白色卡片，14px 圆角，box-shadow + 细边框
- 每卡：小图标 + 指标名（12px `#636068`）+ 大金额（26px 700）+ 说明（11px）
- 色彩：总资产深色、收入绿色 `#10B981`、支出红色 `#EF4444`、结余紫色 `#6C5CE7`

**Row 2 — 50/50 并排**：
- **预算使用率卡片**：标题 `💰 预算使用率` + 标签 `月度预算`。3 条进度条（8px 高，圆角 4px），每条含分类名、金额、剩余提示。颜色：餐饮橙 `#F59E0B`、交通绿 `#10B981`、购物红 `#EF4444`。
- **分类支出占比卡片**：标题 `📊 分类支出占比` + 标签 `本月`。左侧 MUI X PieChart（donut 模式，120px，居中挖空显示总支出），右侧竖向图例列表。

**Row 3 — 月度收支趋势**：
- 全宽白色卡片，MUI X BarChart
- 1-6 月，收入绿色柱 `#10B981`、支出红色柱 `#EF4444`
- 6 月柱子用紫色 `#6C5CE7` 强调
- 图例在右上角

**Row 4 — 最近交易**：
- 全宽白色卡片，标题 `最近交易` + 标签 `最近 10 笔`
- 每行：圆形图标（32px，浅色背景）+ 分类名（12px 600）+ 备注（11px `#4B5563`）+ 日期/账户/标签（10px `#9CA3AF`）+ 金额（13px 700，支出红/收入绿）
- 行间有浅灰分割线

### 3. 交易记录 (`TransactionsTab`)

**标题区**：
- 左："交易记录"（26px 700）+ "日常账本 · 共 48 笔交易"（13px `#4B5563`）
- 右：仅一个 `+ 记一笔` 紫色按钮（40px 高，10px 圆角）

**筛选栏**：白色卡片，12px 圆角，box-shadow + 细边框，内边距 14px 16px。
- 左侧搜索框（flex: 1），38px 高，浅灰背景 `#F3F4F6`，放大镜图标 + "搜索备注..." 占位
- 类型切换：`全部 / 支出 / 收入 / 转账`，选中项紫色浅底
- 4 个下拉按钮：`全部账户` `全部分类` `全部标签` `自定义`
- 最右侧齿轮图标

**交易列表**：大列表布局，非表格。
- 白色背景容器，12px 圆角，box-shadow + 细边框
- 每行 76-86px 高：左侧 38px 圆形图标 + 中间 3 行文字 + 右侧金额
- 拆分交易父行可展开，子行缩进 48px，浅灰背景 `#F9FAFB`，`├`/`└` 符号缩进
- **无表头、无分页**

**子交易视觉**：
- 父行：分类名后带 `▼` + "含 3 笔子交易" 备注 + `3 子单` 灰色标签
- 子行：`├` 或 `└` 缩进符号 + 备注 + 右对齐金额

### 4. 账本管理 (`BooksTab`)

- 标题：`账本管理` + `+ 新建账本` 按钮
- 自适应网格：`grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`
- 卡片：emoji（28px）、名称（14px 600）、描述、创建日期、货币
- 当前激活账本：紫色边框（2px）+ 右上角 `当前` 标签

### 5. 账户管理 (`AccountsTab`)

- 标题：`账户管理` + `+ 新建账户` 按钮
- 自适应网格：`grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`
- 卡片水平布局：左侧 40px 彩色图标方块 + 右侧信息（名称、类型标签、余额 22px 700、初始余额）
- 归档账户：整体 55% opacity + `已归档` 橙色标签
- 4 种类型颜色：借记卡绿色、信用卡红色、电子钱包紫色、虚拟账户灰色

### 6. 分类管理 (`CategoriesTab`)

- 标题：`分类管理` + 搜索框
- 树形列表：白色卡片容器
- 每节点：展开箭头 + emoji + 名称 + 子分类计数 + 悬停时显示操作按钮
- 缩进层级：子节点缩进 24px

### 7. 标签管理 (`TagsTab`)

- 标题：`标签管理` + 搜索框
- 标签网格：flex wrap，gap 8px
- 每个标签：彩色 pill（浅色背景 + 深色文字 + × 删除按钮）

### 8. 预算管理 (`BudgetsTab`)

- 标题：`预算管理` + `+ 新建预算` 按钮
- 卡片列表：每卡含标题+周期标签、已用金额（大号彩色）、预算金额、进度条、状态提示

### 9. 事件管理 (`EventsTab`)

- 标题：`事件管理` + `+ 新建事件` 按钮
- 卡片列表：每卡含 4px 左侧彩色边条、emoji+名称、描述、日期范围、收支统计

### 10. 交易表单对话框 (`TransactionFormDialog`)

- MUI Dialog，scrollable 内容区
- 字段：类型切换（支出/收入/转账）、金额输入（大号 28px）、快速金额按钮（10/20/50/100/200/500）、账户选择、分类选择、日期时间选择、标签选择、备注 textarea、附件上传区、关联 Todo、关联事件、拆分交易（添加拆分项 → 子行备注+金额）
- Footer：`取消` `保存并继续` `保存`

### 11. 交易详情抽屉 (`TransactionDetailDrawer`)

- MUI Drawer，480px 宽，从右侧滑出
- 内容：大号金额 + 详情网格（日期/账户/分类/类型）+ 标签 + 备注 + 子交易 + 附件 + 关联信息
- Footer：`关闭` `删除` `编辑`

### 12. 事件详情抽屉 (`EventDetailDrawer`)

- 同上模式，展示事件信息 + 关联交易列表

## 视觉规格

| 属性 | 值 |
|------|----|
| 页面背景 | `#F5F6FA` |
| 卡片背景 | `#ffffff` |
| 卡片圆角 | 12-14px |
| 卡片阴影 | `0 1px 3px rgba(0,0,0,0.06)` |
| 卡片边框 | `1px solid #EDECF0` |
| 页边距 | 24px |
| 卡片间距 | 16px |
| 主强调色 | `#6C5CE7` |
| 选中浅底 | `#E8E0FF` / `#EEECFF` |
| 收入色 | `#10B981` |
| 支出色 | `#EF4444` |
| 警告色 | `#F59E0B` |
| 行分割线 | `#F3F4F6` 或 `#F0EFF4` |
| 次要文字 | `#636068` / `#4B5563` |
| 辅助文字 | `#9CA3AF` |
| Sidebar 宽度 | 240px |
| Sidebar 导航项高 | 约 40px |
| KPI 金额字号 | 26px, weight 700 |

## 实现要点

1. **所有页面 `'use client'`** — 使用 useState 管理 tab、对话框、模拟数据状态
2. **模拟数据**放在 `mockFinance.ts`，作为单个 export 对象或 hook
3. **Tab 切换**不创建子路由 — 用 `useState<string>` 控制显示哪个 Tab 组件
4. **图表**用 MUI X Charts：
   - `PieChart` + `pieArcLabel` 实现 donut（通过 `cx`/`cy` + `outerRadius`/`innerRadius`）
   - `BarChart` 实现趋势图（grouped bars）
5. **移动端响应式**：ContentHeader 的 hamburger 按钮控制 SwipeableDrawer；卡片网格自动收缩
6. **MUI 组件**使用 `sx` prop 而非独立 CSS 文件（与现有代码风格一致）
7. **主题适配**：使用 `theme.palette.mode` 判断暗色模式，调整卡片背景和文字色

## 验证

1. `npm run dev` → 访问 `http://localhost:3000/finance`
2. 确认 8 个标签页切换正常，Sidebar 导航项高亮同步
3. 确认 Dashboard 图表渲染（饼图 + 柱状图）
4. 确认交易列表为非表格布局，子交易可展开
5. 确认移动端 Drawer 正常开关
6. 确认暗色模式切换后所有卡片正常显示
7. 确认 `+ 记一笔` 按钮只有一个（页面右上角）
8. 确认无英文残留、无低透明度文字、无分页组件
