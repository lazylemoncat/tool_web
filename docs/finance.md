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

### 4. Split Item (拆单)

一笔交易拆分为多个子项, 各自分配金额和分类.

示例: 超市购物 500 元, 拆分:
- 食品 300 元
- 日用品 100 元
- 宠物用品 100 元

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

下方展示账户列表和最近 10 笔交易.

### Transactions (交易列表)

交易记录列表, 支持:

- 按账户/分类/标签/事件/类型筛选
- 按日期范围查询
- 关键词搜索
- 分页加载 (每页 50 条)
- 点击 "记一笔" 打开记账表单

### Budgets (预算)

预算列表, 每条显示:

- 预算名称和金额
- 当前花费进度条
- 花费/预算 数值

### Events (事件)

事件列表, 显示:

- 事件名称和颜色标签
- 关联交易数量
- 总金额

## 记账表单

点击 Transactions 页面的 "记一笔" 按钮打开.

### 字段

| 字段 | 说明 |
|------|------|
| 类型 | 支出 / 收入 / 转账 |
| 金额 | 支持快捷金额按钮 (10/20/50/100/200/500) |
| 账户 | 从已创建账户中选择 |
| 分类 | 树状分类选择 |
| 日期 | 日期时间选择器, 默认当前时间 |
| 标签 | 多选标签 chips |
| 备注 | 可选文本 |
| 拆单 | 展开后可添加多个子项 |

### 拆单操作

1. 点击 "+ Split Items" 展开拆单区域
2. 为每个子项填写金额、分类
3. 提交时子项自动关联到交易

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
└── routers/finance.py       # API 路由 (34 endpoints)

frontend/src/
├── hooks/useFinance.ts      # React 数据 hooks
├── pages/FinancePage.tsx    # 主页面容器
└── components/finance/
    ├── FinanceDashboard.tsx  # 仪表盘组件
    └── TransactionForm.tsx   # 记账表单
```

## 使用流程

1. 侧边栏点击 "记账" 进入 Finance 页面
2. 首次使用需创建账本 (如 "Personal")
3. 创建账户 (如 "微信"、"银行卡")
4. 创建分类 (可选, 系统默认支持)
5. 点击 "记一笔" 开始记账
6. Dashboard 查看汇总, Transactions 查看明细
