# 一、产品定位

Finance 模块并非传统“流水记账工具”，而是：

# LifeOS 中的 Financial Resource System（财务资源系统）

其核心目标：

- 管理个人财务流动
- 与 Todo / Calendar / Contact / Event 深度联动
- 构建统一的资源关系网络（Resource Graph）
- 提供预算、分析、事件归因、长期财务追踪能力

------

# 二、产品目标

## 核心目标

### 1. 快速记录财务行为

支持：

- 收入
- 支出
- 转账
- 拆单
- 多附件
- 标签
- 分类

------

### 2. 以 Event 为中心聚合财务数据

例如：

# 日本旅行

聚合：

- Todo
- Calendar
- Transactions
- Contacts
- Attachments

------

### 3. 提供多维预算控制

支持：

- 分类预算
- 标签预算
- Event 预算
- 账户预算
- 自定义过滤预算

并支持：

- RRULE 周期规则
- 预算提醒
- 预算进度分析

------

### 4. 提供强可视化分析能力

包括：

- 时间趋势
- 分类占比
- Event 花费
- 账户变化
- 预算使用率

------

# 三、目标用户

## 当前阶段

个人用户。

------

## 后续扩展

未来支持：

- 家庭账本
- 情侣账本
- 项目账本
- 团队协作

但 v1 不实现多人权限。

------

# 四、核心概念模型

------

# 1. Ledger（账本）

财务数据隔离空间。

例如：

- Personal
- Travel
- Side Project

------

## Ledger 字段

| 字段       | 类型      |
| ---------- | --------- |
| id         | uuid      |
| name       | string    |
| icon       | string    |
| currency   | string    |
| created_at | timestamp |

------

# 2. Account（账户）

资金实际载体。

例如：

- 微信
- 支付宝
- 招商银行卡
- 现金

------

## Account 类型

- cash
- debit_card
- credit_card
- e_wallet
- virtual

------

## Account 字段

| 字段            | 类型    |
| --------------- | ------- |
| id              | uuid    |
| ledger_id       | uuid    |
| name            | string  |
| type            | enum    |
| currency        | string  |
| initial_balance | decimal |
| archived        | boolean |

------

# 3. Transaction（交易）

系统核心财务记录。

------

## Transaction 类型

- expense
- income
- transfer

------

## Transaction 字段

| 字段                  | 类型          |
| --------------------- | ------------- |
| id                    | uuid          |
| ledger_id             | uuid          |
| account_id            | uuid          |
| type                  | enum          |
| amount                | decimal       |
| currency              | string        |
| occurred_at           | timestamp     |
| recorded_at           | timestamp     |
| category_id           | uuid          |
| note                  | text          |
| event_id              | uuid nullable |
| parent_transaction_id | uuid nullable |
| created_at            | timestamp     |

------

# 4. Split Item（拆单）

用于拆分复杂账单。

例如：

# Costco 账单

- 食品
- 日用品
- 宠物用品

------

## Split Item 字段

| 字段           | 类型    |
| -------------- | ------- |
| id             | uuid    |
| transaction_id | uuid    |
| amount         | decimal |
| category_id    | uuid    |
| note           | text    |

------

# 5. Category（分类）

树状结构。

------

## 特性

- 单选
- 多层级
- 用户自定义

------

## 示例

```
餐饮
├── 早餐
├── 午餐
└── 晚餐
```

------

## Category 字段

| 字段      | 类型          |
| --------- | ------------- |
| id        | uuid          |
| ledger_id | uuid          |
| parent_id | uuid nullable |
| name      | string        |
| icon      | string        |

------

# 6. Tag（标签）

灵活元信息。

------

## 特性

- 多选
- 无层级
- 可扩展

------

## 示例

- 报销
- 旅游
- 快乐消费
- 紧急

------

# 7. Event（事件）

系统核心聚合对象。

------

## Event 可关联

- Transactions
- Todo
- Calendar
- Contacts
- Attachments

------

## 示例

# 日本旅行

聚合：

- 机票支出
- 酒店
- Todo
- 行程

------

## Event 字段

| 字段        | 类型               |
| ----------- | ------------------ |
| id          | uuid               |
| ledger_id   | uuid               |
| name        | string             |
| description | text               |
| start_at    | timestamp nullable |
| end_at      | timestamp nullable |
| color       | string             |

------

# 8. Attachment（附件）

统一附件系统。

------

## 支持

- 图片
- PDF
- 文档

------

## Attachment 字段

| 字段       | 类型      |
| ---------- | --------- |
| id         | uuid      |
| url        | string    |
| mime_type  | string    |
| size       | number    |
| created_at | timestamp |

------

# 9. Budget（预算）

多维度预算系统。

------

## Budget 字段

| 字段            | 类型    |
| --------------- | ------- |
| id              | uuid    |
| ledger_id       | uuid    |
| name            | string  |
| amount          | decimal |
| currency        | string  |
| rrule           | text    |
| filters         | jsonb   |
| rollover        | boolean |
| alert_threshold | integer |

------

## filters 示例

```
{
  "category_ids": ["1"],
  "tag_ids": ["2"],
  "event_ids": ["3"]
}
```

------

# 五、关系系统（核心架构）

采用统一 Resource Relation 模型。

------

# Relation

## 字段

| 字段          | 类型   |
| ------------- | ------ |
| id            | uuid   |
| from_type     | string |
| from_id       | uuid   |
| relation_type | string |
| to_type       | string |
| to_id         | uuid   |

------

## 示例

| from        | relation   | to          |
| ----------- | ---------- | ----------- |
| todo        | related_to | transaction |
| transaction | belongs_to | event       |
| contact     | paid_for   | transaction |

------

# 六、核心功能

------

# 1. 快速记账

## 支持

- 收入
- 支出
- 转账

------

## 字段

- 金额
- 分类
- 标签
- 时间
- 账户
- Event
- 联系人
- 备注
- 附件
- Todo 关联

------

## 支持

- 快速输入
- 键盘优化
- 最近分类记忆

------

# 2. 拆单

## 功能

一个 Transaction 可拆多个子项。

------

## 示例

```
山姆超市 500
├── 食品 300
├── 日用品 100
└── 宠物用品 100
```

------

# 3. Event 聚合

Event 页面展示：

- 财务统计
- Todo
- 日历
- 联系人
- 文件

------

# 4. 预算系统

支持：

- 时间周期
- 多维过滤
- RRULE
- 预算进度
- 超额提醒

------

# 5. Todo 联动

------

## Todo → Finance

例如：

Todo 完成：

# 缴房租

自动弹出：

# 创建支出

------

## Finance → Todo

例如：

信用卡账单：

自动创建：

# 5 月 12 日还款

------

## 双向关系

Transaction 与 Todo 可互相跳转。

------

# 6. 可视化分析

------

## Dashboard

### 顶部

- 总资产
- 本月收入
- 本月支出
- 预算使用率

------

## 图表

### 分类饼图

支出分类占比。

------

### 时间趋势图

按：

- 日
- 周
- 月
- 年

展示。

------

### Event 花费排行

例如：

- 日本旅行
- MacBook 项目

------

### 预算进度

预算消耗条。

------

### 账户变化趋势

账户余额变化。

------

# 七、筛选系统

支持：

- 时间
- 分类
- 标签
- Event
- 联系人
- 账户
- 金额区间
- 是否预算内

支持：

- 保存筛选器
- 组合查询

------

# 八、页面结构

------

# 1. Finance Dashboard

------

## 模块

- 资产卡片
- 预算卡片
- 图表
- 最近交易
- Todo 提醒

------

# 2. Transaction List

支持：

- Group By
- Collapse
- 无限滚动
- 虚拟列表

------

# 3. Transaction Detail Drawer

支持：

- 编辑
- 附件
- 标签
- Todo
- Event
- 联系人

------

# 4. Budget 页面

支持：

- 创建预算
- RRULE 编辑
- 预算历史
- 趋势分析

------

# 5. Event 页面

聚合：

- Todo
- Finance
- Calendar
- Contacts

------

# 九、技术方案 (已适配项目技术栈)

------

# 前端

沿用项目现有技术栈:

- React 19 + Vite
- TypeScript
- React Router (Hash 路由)
- @dnd-kit (拖拽排序)
- 自定义 Hooks (useState + useCallback 模式, 无状态管理库)

------

# UI

沿用项目现有方案:

- 自定义 CSS 变量系统 (亮/暗主题)
- 手写组件 (无第三方 UI 库)
- CSS 类名前缀: `finance-*`

------

# 图表

新增轻量依赖:

- Recharts (React 原生, 声明式 API, 体积小)

原因:

- 无需额外构建配置
- Tree-shaking 友好
- 与现有 React + TypeScript 技术栈天然契合

------

# 后端

沿用项目现有技术栈:

- Python FastAPI + Uvicorn
- SQLAlchemy 2.0 ORM
- SQLite (开发/小规模部署), 通过 DATABASE_URL 环境变量切换
- Pydantic 2.0 (Schema 校验)

------

# 十、数据库设计建议 (已适配)

------

# ID 策略

使用项目统一的 Integer 自增主键 (非 UUID):

- 与现有 Folder/Todo/Tag 模型一致
- SQLite 友好
- URL 中更简洁

------

# 树结构

Category 使用:

# Adjacency List (parent_id 自引用)

原因:

- 与现有 Folder 模型模式一致
- SQLAlchemy ORM relationship 原生支持
- 项目已有成熟的递归查询和序列化模式
- 层级深度有限 (通常 <= 5 层), 无需物化路径

------

# 关系系统

统一 ResourceRelation 模型 (多态关联):

- 用 `from_type/from_id/to_type/to_id` 实现
- 支持 Transaction ↔ Todo, Transaction ↔ Event 等任意关联

------

# JSON 字段

Budget filters 使用:

# SQLAlchemy JSON 类型

SQLite 原生支持 JSON 函数, SQLAlchemy JSON 类型自动适配.

------

# 十一、性能要求

------

# Transaction List

支持：

- 10w+ 数据量

采用：

- cursor pagination
- virtualization

------

# 图表

采用：

- aggregation table
- materialized view

------

# 十二、MVP 范围（必须控制）

------

# 第一阶段必须做

## 核心

- Ledger
- Account
- Transaction
- Category
- Tag
- Budget
- Event
- Attachment

------

## 页面

- Dashboard
- Transaction List
- Detail Drawer
- Budget
- Event

------

## 图表

- 分类占比
- 时间趋势
- 预算进度

------

# 第二阶段

- 自动规则
- OCR
- AI 分析
- 多币种
- 报销
- AA

------

# 第三阶段

- 协同
- 权限
- 实时同步
- AI Agent

------

# 十三、未来扩展方向

------

# AI

例如：

- 自动分类
- 月度总结
- 异常消费提醒
- Event 花费分析

------

# 自动化

例如：

IF：

Todo 完成

THEN：

创建 Transaction

------

# Knowledge Graph

形成：

# 人、事、钱、时间

统一关系网络。

------

# 十四、产品核心理念

# Finance 不是孤立模块。

而是：

# LifeOS 中关于“资源流动”的核心系统。

它连接：

- 时间
- 任务
- 人
- 项目
- 资产

最终形成统一 Personal Operating System。