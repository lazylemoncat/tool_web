# Tool Web 记账功能文档

## 功能概述

Finance 模块是 Tool Web 中的个人财务管理系统, 与 Todo 模块共享认证和 UI 框架. 支持多账本、多账户、收支记录、分类管理、预算控制、事件聚合.

当前 Next.js 前端 `frontend/src/app/(auth)/finance/page.tsx` 已接入后端 Finance API, 支持读取账本、账户、分类、仪表盘和交易列表, 并支持新建账本、账户、分类和交易.

原型 mock 数据位于 `frontend/src/data/mockFinance.ts`, 仅保留给历史原型和本地参考使用. 该文件使用独立 mock 类型, 不再从 `frontend/src/lib/financeTypes.ts` 导入真实后端 API 类型, 避免旧原型字段影响生产构建类型检查.

## 核心概念

### 1. Ledger (账本)

财务数据隔离空间. 每个用户可创建多个账本, 如 Personal、Travel、Side Project.

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| name | string | 账本名称 |
| icon | string | 图标 (emoji) |
| currency | string | 货币代码, 默认 CNY |

### 2. Account (账户)

资金实际载体. 支持 5 种类型: cash (现金), debit_card (借记卡), credit_card (信用卡), e_wallet (电子钱包), virtual (虚拟账户).

余额计算: `current_balance = initial_balance + 收入 - 支出`

### 3. Transaction (交易)

核心财务记录, 支持 3 种类型:

- **expense** (支出): 金额从账户扣除
- **income** (收入): 金额加入账户
- **transfer** (转账): 账户间资金转移

每笔交易关联: 账户、分类、标签、事件、备注、发生时间.

### 4. Child Transaction (子交易)

父交易下可创建多个子交易, 每个子交易是完整的 Transaction (独立金额、账户、分类、时间、备注、标签、附件、Todo 关联、事件关联).

**嵌套限制**: 仅支持 1 层嵌套 (父→子). 子交易不可再创建下级子交易. 后端在 POST/PUT /transactions 时校验 parent_transaction_id 链深度, 违反时返回 400.

**子单管理**: 
- 父单编辑态通过 SubTxDrawer (右侧 Drawer) 创建/编辑子单, 复用 TransactionForm 全部字段
- 子单为独立 Transaction 记录, 通过 parent_transaction_id 关联父单
- 子单 CRUD 为独立 API 调用 (POST/PUT/DELETE /transactions)
- 父单卡片显示子单数量 chip, 子单卡片显示 ↳ 标识
- 新建父单时不可添加子单 (需先保存父单)

### 5. Category (分类)

树状结构, 单选. 示例:

```
餐饮
├── 早餐
├── 午餐
└── 晚餐
交通
├── 公交
└── 打车
```

### 6. Tag (标签)

扁平多选, 灵活标注. 如: 报销、旅游、紧急.

### 7. Event (事件)

聚合对象, 关联多笔交易. 如 "日本旅行" 聚合机票、酒店、购物等支出.

Event 页面展示: 交易列表、总支出/收入、关联关系.

### 8. Budget (预算)

多维度预算控制:

- 支持 RRULE 周期规则 (如每月)
- 按分类/标签/事件过滤
- 进度条显示
- 超额提醒阈值

### 9. ResourceRelation (关系)

统一多态关联: `(from_type, from_id) → (relation_type) → (to_type, to_id)`.

支持 Transaction ↔ Todo, Transaction ↔ Event 等任意关联.

Relation API 会校验 `from_type/from_id` 与 `to_type/to_id` 指向的资源均属于当前用户. 查询和删除关系时也会按 `from` 资源归属隔离, 避免跨用户读取或删除关系.

## 页面导航

访问 `/finance` 进入记账模块.

## UI 组件配置

前端通过 `frontend/src/app/layout.tsx` 挂载 `ThemeRegistry`,由该组件统一接入 MUI Material 和 MUI X Date Pickers. `ThemeRegistry` 负责提供 MUI `ThemeProvider`, `CssBaseline`, dayjs adapter 和语言环境.

记账页面位于 `frontend/src/app/finance/page.tsx`,主要业务组件位于 `frontend/src/components/finance/`. 基础按钮、输入框、弹窗、菜单、图表和日期选择器优先使用 MUI Material / MUI X,再按业务需要做二次封装. 记账模块遵循 Material + microinteractions 风格,列表 hover,拖拽排序,按钮反馈,弹窗打开关闭和表单校验都应提供轻量即时反馈.

同类资源排序统一使用拖拽排序,包括账本,账户,分类,标签和预算. 不使用点击式上移/下移作为主排序方式;拖拽项通过排序手柄,边框高亮,透明度变化和 `cursor: grab` 表达排序状态,页面不额外展示 "拖拽排序" 文本.

管理类弹窗标题区统一复用 `frontend/src/components/shared/DialogHeader.tsx`,删除确认统一使用 `frontend/src/components/shared/ConfirmDialog.tsx`. 账本,账户,分类,标签和预算删除不再使用原生 `window.confirm`,以保持焦点管理,键盘操作和视觉层级一致.

Finance 页面首次加载使用 `frontend/src/components/finance/FinancePageSkeleton.tsx` 呈现仪表盘结构骨架,不使用居中 spinner. 页面容器高度使用 `100dvh`,保证移动端浏览器地址栏变化时侧边栏和内容区仍可完整滚动.

### Dashboard (仪表盘)

四张汇总卡片: 总资产、本月收入、本月支出、预算使用率.

图表区域: 分类占比饼图 + 月度支出趋势柱状图, 支持按周/月/年切换周期.

下方展示最近 10 笔交易, 点击可查看详情.

仪表盘只负责展示资产、收支、预算使用率、图表和最近交易. 分类管理与标签管理不放在仪表盘内, 统一移动到基础管理页.

仪表盘支持管理模式: 可显示/隐藏仪表组件, 调整组件顺序, 并修改图表周期参数. 金额汇总统一先转换为数字再格式化, 避免字符串余额拼接成异常金额.

### Transactions (交易列表)

交易记录列表, 支持:

- 按账户/分类/标签/事件/类型筛选 (可折叠筛选栏)
- 标签筛选已在 `frontend/src/components/finance/Transactions/FilterBar.tsx` 中提供下拉选择, `frontend/src/components/finance/TransactionsTab.tsx` 按 `TransactionOut.tags[].id` 过滤交易, 并在关键词搜索中匹配标签名称.
- 筛选栏控件统一使用 MUI `TextField`, `ToggleButtonGroup` 和 `MenuItem`,不使用裸 `input` 或 `select`,确保键盘焦点,辅助标签和主题样式一致.
- 按日期范围查询
- 关键词搜索
- 无限滚动加载 (每页 50 条, 滚动到底自动加载更多)
- 支持与任务清单一致的拖拽排序, 顺序写入 `Transaction.sort_order`
- 点击交易行弹出详情 Modal (完整字段、标签、拆单、附件、关联待办)
- 详情中可直接编辑或删除交易
- 点击 "记一笔" 打开记账表单

交易列表, 筛选条, 交易行, 详情抽屉和记账模块管理页使用 MUI `background`, `divider`, `text`, `action` 与语义色 token 渲染中性背景, 边框, hover 和 chip 状态, 避免浅深色主题切换后残留固定浅色 surface.

### Budgets (预算)

预算列表, 每条显示: 名称、进度条、花费/预算数值. 支持新建/编辑 (Modal)、删除和拖拽排序.

账本,账户,分类,标签和预算均支持拖拽排序,并通过后端 reorder API 持久化顺序. 预算顺序写入 `Budget.sort_order`.

预算字段: 名称、金额、币种、RRULE 重复规则、筛选条件 (分类/标签/事件)、结转、提醒阈值.

预算编辑表单中的结转等布尔选项统一使用 `form-inline-control` 布局类, 让复选框/开关与说明文本保持同一行并垂直居中. 后续新增类似表单项时不要直接复用普通 `.form-group label` 包裹 checkbox, 避免继承输入框宽度和块级 label 样式导致错位. 新建/编辑交易、预算、事件时, 必填项需要在 label 旁显示 `*`, 点击确认后用红色边框和错误文案标出缺失字段, 不应直接关闭弹窗.

### Events (事件)

事件列表, 显示: 名称、颜色标签、关联交易数量、总金额. 支持新建/编辑 (Modal, 含色块选择器) 和删除.

### Manage (基础管理)

基础管理页承接分类树管理与标签管理:

- 分类管理: 新建、重命名、删除和同级拖拽排序.
- 标签管理: 新建、重命名、删除交易标签和拖拽排序.

事件字段: 名称、描述、开始/结束时间、颜色.

## 记账表单

点击 Transactions 页面的 "记一笔" 按钮打开.

### 字段

| 字段 | 说明 |
|------|------|
| 类型 | 支出 / 收入 / 转账 |
| 金额 | 支持快捷金额按钮 (10/20/50/100/200/500) |
| 账户 | 从已创建账户中选择 |
| 分类 | 树状分类选择, 旁有 "+" 内联创建分类 |
| 日期 | 日期时间选择器, 默认当前时间 |
| 标签 | 多选标签 chips, 创建或编辑交易时可关联多个已有标签 |
| 备注 | 可选文本 |
| 附件 | 多文件上传, 上传成功后用 `attachment_ids` 关联到交易 |
| 关联待办 | 关联 Todo 待办事项 |
| 子交易 | 展开后可添加多个子交易 |

### 子交易操作

1. 点击 "+ 子交易" 展开子交易区域
2. 每个子交易: 金额、分类、备注、附件
3. 提交时先创建父交易, 再逐个创建子交易关联

### 附件上传

1. 在记账表单中选择文件 (支持多文件).
2. 前端调用 `/api/v1/finance/attachments/upload` 上传文件, 后端写入 `attachments` 并返回附件 ID.
3. 创建或编辑交易时提交 `attachment_ids`, 后端维护 `transaction_attachments` 关联.
4. 交易详情抽屉展示附件入口, 点击后打开 `/uploads/*` 文件.

### Todo 关联

1. 在记账表单中选择待办事项 (checkbox 列表)
2. 交易详情中可查看关联的待办并跳转

## API 端点

Base: `/api/v1/finance`

| 资源 | 端点 | 方法 |
|------|------|------|
| Ledger | `/ledgers` | GET/POST |
| | `/ledgers/{id}` | PUT/DELETE |
| Account | `/accounts?ledger_id=` | GET |
| | `/accounts` | POST |
| | `/accounts/{id}` | PUT/DELETE |
| Category | `/categories?ledger_id=` | GET |
| | `/categories` | POST |
| | `/categories/{id}` | PUT/DELETE |
| Tag | `/tags?ledger_id=&search=` | GET |
| | `/tags` | POST |
| | `/tags/{id}` | DELETE |
| Transaction | `/transactions?ledger_id=&skip=&limit=` | GET (含筛选参数) |
| | `/transactions/{id}` | GET |
| | `/transactions` | POST |
| | `/transactions/{id}` | PUT/DELETE |
| Event | `/events?ledger_id=` | GET |
| | `/events` | POST |
| | `/events/{id}` | PUT/DELETE |
| | `/events/{id}/summary` | GET |
| Budget | `/budgets?ledger_id=` | GET |
| | `/budgets` | POST |
| | `/budgets/{id}` | PUT/DELETE |
| Attachment | `/attachments/upload` | POST (multipart) |
| Dashboard | `/dashboard?ledger_id=` | GET |
| Stats | `/stats?ledger_id=&period=` | GET |
| Relation | `/relations?from_type=&from_id=` | GET |
| | `/relations` | POST |
| | `/relations/{id}` | DELETE |

Stats 接口用于前端仪表盘图表通信: `category_data` 返回分类名, 图标, 金额和颜色; `trend_data` 返回最近 6 个月的收入和支出序列, 字段名与 `frontend/src/lib/financeTypes.ts` 保持一致.

## 数据模型

### 表清单

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `ledgers` | 账本 | user_id, name, icon, currency, sort_order |
| `accounts` | 账户 | user_id, ledger_id, name, type, initial_balance, sort_order |
| `finance_categories` | 分类 | user_id, ledger_id, parent_id, name, icon, sort_order |
| `finance_tags` | 标签 | user_id, ledger_id, name, sort_order |
| `transactions` | 交易 | user_id, ledger_id, account_id, type, amount, category_id, note, event_id |
| `split_items` | 拆单项 | transaction_id, amount, category_id, note |
| `events` | 事件 | user_id, ledger_id, name, start_at, end_at, color |
| `budgets` | 预算 | user_id, ledger_id, name, amount, rrule, filters, alert_threshold, sort_order |
| `attachments` | 附件 | user_id, url, mime_type, size |
| `resource_relations` | 关系 | from_type, from_id, relation_type, to_type, to_id |
| `transaction_tags` | 交易-标签关联 | transaction_id, tag_id |
| `transaction_attachments` | 交易-附件关联 | transaction_id, attachment_id |

### 关系图

```
User (1) ──┬── (N) Ledger (1) ──┬── (N) Account
            │                     ├── (N) Category (tree, parent_id)
            │                     ├── (N) Tag
            │                     ├── (N) Transaction ──┬── (N) SplitItem
            │                     │                      ├── (M) Tag (via transaction_tags)
            │                     │                      ├── (N) Attachment (via transaction_attachments)
            │                     │                      ├── (1) Category
            │                     │                      └── (1) Event
            │                     ├── (N) Event
            │                     └── (N) Budget
            └── (N) ResourceRelation (from_type/from_id → to_type/to_id)
```

## 文件结构

```
backend/src/
├── models/finance.py        # SQLAlchemy 数据模型
├── schemas/finance.py       # Pydantic 请求/响应 schema
└── routers/finance.py       # API 路由 (36+ endpoints)

frontend/src/
├── app/finance/page.tsx          # Finance 页面入口
└── components/finance/
    ├── DashboardTab.tsx              # 仪表盘 tab
    ├── TransactionsTab.tsx           # 交易列表 tab
    ├── TransactionFormDialog.tsx     # 记账表单弹窗
    ├── TransactionDetailDrawer.tsx   # 交易详情抽屉
    ├── BudgetsTab.tsx                # 预算管理 tab
    ├── EventsTab.tsx                 # 事件管理 tab
    ├── AccountsTab.tsx               # 账户管理 tab
    ├── CategoriesTab.tsx             # 分类树管理 tab
    ├── TagsTab.tsx                   # 标签管理 tab
    ├── FinanceSidebar.tsx            # 账本和模块导航侧边栏
    ├── Dashboard/                    # 统计卡片,分类占比,趋势图,最近交易
    └── Transactions/                 # 筛选栏,交易行和子交易组件
```

附件上传目录: `backend/uploads/`, 通过 `/uploads/` 路由提供静态文件服务.

## 使用流程

1. 侧边栏点击 "记账" 进入 Finance 页面
2. 首次使用需创建账本 (如 "Personal")
3. 创建账户 (如 "微信"、"银行卡")
4. 配置分类和标签 (可选, Dashboard 中管理)
5. 创建预算和事件 (可选)
6. 点击 "记一笔" 开始记账 (支持附件上传和待办关联)
7. Dashboard 查看汇总与图表, Transactions 筛选与无限滚动浏览
8. 点击交易行查看详情, 支持编辑/删除

## 当前前端说明

Finance 当前通过 Next.js App Router 暴露 `/finance`,页面入口为 `frontend/src/app/finance/page.tsx`,组件集中在 `frontend/src/components/finance/`,请求统一通过 `frontend/src/lib/api.ts`.

## 后端类型检查

Finance ORM 模型位于 `backend/src/models/finance.py`,使用 SQLAlchemy 2 `Mapped` 和 `mapped_column` 注解. 金额字段使用 `Decimal` 类型,统计响应应构造 `CategoryStatsItem` / `TrendStatsItem` schema 对象,不要返回未类型化字典.

## 分类标识更新

Finance 分类现在使用 `icon_type` (`color` 或 `emoji`) 和 `icon_value`,不再使用旧的自由文本 `icon` API 字段. `frontend/src/components/finance/CategoriesTab.tsx` 创建分类时复用共享 `MarkerPicker`,emoji 值从预设项选择,不手动输入.

分类统计数据同时返回 `category_icon_type` 和 `category_icon`,因此 `frontend/src/components/finance/Dashboard/CategoryDonut.tsx` 可以在图例中渲染颜色标识或 emoji 标识.
