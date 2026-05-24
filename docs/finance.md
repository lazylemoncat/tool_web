# Tool Web 记账功能文档

## 功能概述

Finance 模块是 Tool Web 中的个人财务管理系统, 与 Todo 模块共享认证和 UI 框架. 支持多账本、多账户、收支记录、分类管理、预算控制、事件聚合.

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

## 页面导航

访问 `/finance` 进入记账模块.

### Dashboard (仪表盘)

四张汇总卡片: 总资产、本月收入、本月支出、预算使用率.

图表区域: 分类占比饼图 + 月度支出趋势柱状图, 支持按周/月/年切换周期.

管理区域: 账户管理 (添加/删除/自定义类型) + 分类树管理 (新建/重命名/删除/子分类) + 标签管理 (新建/删除).

下方展示最近 10 笔交易, 点击可查看详情.

### Transactions (交易列表)

交易记录列表, 支持:

- 按账户/分类/标签/事件/类型筛选 (可折叠筛选栏)
- 按日期范围查询
- 关键词搜索
- 无限滚动加载 (每页 50 条, 滚动到底自动加载更多)
- 点击交易行弹出详情 Modal (完整字段、标签、拆单、附件、关联待办)
- 详情中可直接编辑或删除交易
- 点击 "记一笔" 打开记账表单

### Budgets (预算)

预算列表, 每条显示: 名称、进度条、花费/预算数值. 支持新建/编辑 (Modal) 和删除.

预算字段: 名称、金额、币种、RRULE 重复规则、筛选条件 (分类/标签/事件)、结转、提醒阈值.

### Events (事件)

事件列表, 显示: 名称、颜色标签、关联交易数量、总金额. 支持新建/编辑 (Modal, 含色块选择器) 和删除.

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
| 标签 | 多选标签 chips |
| 备注 | 可选文本 |
| 附件 | 多文件上传 |
| 关联待办 | 关联 Todo 待办事项 |
| 子交易 | 展开后可添加多个子交易 |

### 子交易操作

1. 点击 "+ 子交易" 展开子交易区域
2. 每个子交易: 金额、分类、备注、附件
3. 提交时先创建父交易, 再逐个创建子交易关联

### 附件上传

1. 在记账表单中选择文件 (支持多文件)
2. 提交时文件先上传到服务器, 再关联到交易
3. 编辑时可管理已有附件 (新增/删除)

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

## 数据模型

### 表清单

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `ledgers` | 账本 | user_id, name, icon, currency |
| `accounts` | 账户 | user_id, ledger_id, name, type, initial_balance |
| `finance_categories` | 分类 | user_id, ledger_id, parent_id, name, icon |
| `finance_tags` | 标签 | user_id, ledger_id, name |
| `transactions` | 交易 | user_id, ledger_id, account_id, type, amount, category_id, note, event_id |
| `split_items` | 拆单项 | transaction_id, amount, category_id, note |
| `events` | 事件 | user_id, ledger_id, name, start_at, end_at, color |
| `budgets` | 预算 | user_id, ledger_id, name, amount, rrule, filters, alert_threshold |
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
├── hooks/useFinance.ts      # React 数据 hooks
├── pages/FinancePage.tsx    # 主页面容器
└── components/finance/
    ├── FinanceDashboard.tsx  # 仪表盘组件
    ├── FinanceCharts.tsx     # 图表 (饼图 + 趋势)
    ├── TransactionForm.tsx   # 记账表单
    ├── TransactionDetail.tsx # 交易详情 Modal
    ├── BudgetForm.tsx        # 预算创建/编辑
    ├── EventForm.tsx         # 事件创建/编辑
    ├── CategoryManager.tsx   # 分类树管理
    ├── TagManager.tsx        # 标签管理
    └── TxFilterBar.tsx       # 交易筛选栏
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
