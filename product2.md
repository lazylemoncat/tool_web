# 产品需求文档（PRD）

## 项目名称

暂定名：**tool-web**

## 文档定位

本文档是 `tool-web` 的新版产品与技术产品文档，用于替代旧版 PRD。

本文档同时描述：

- 当前已经实现的产品能力与技术栈
- 当前数据模型和系统限制
- 产品长期目标架构
- 面向外部 Agent 的开放能力规划
- 近期、中期、长期路线图

重要边界：本项目不是内置 Agent Runtime，不负责运行、编排或托管 AI Agent。项目定位是 **Agent-ready Personal Workspace**，即为用户和用户授权的外部 Agent / 脚本 / 自动化工具提供结构化数据、API、权限、审计、Webhook 与 MCP 风格接口。

---

# 1. 产品概述

## 1.1 产品定位

`tool-web` 是一款 **Web-first、API-first、Self-hostable 的 Agent-ready Personal Workspace**。

产品核心定位：

> 面向个人与未来轻量协作场景的结构化信息管理平台，为用户提供任务、财务、主题、自定义工作空间等能力，并在长期演进中为外部 Agent 提供安全、可审计、可控的数据操作接口。

产品强调：

- 结构化数据管理
- Web 多端统一访问
- 高度可自定义主题与界面体验
- API-first 的后端能力
- 可自部署与 Docker 化部署
- 面向外部 Agent 的开放数据接口
- 长期可演进为统一 Resource 中心模型

## 1.2 产品不是什麼

为了避免产品边界失控，当前和长期设计中需要明确以下限制：

- 不内置 AI Agent Runtime
- 不内置 Agent 聊天 UI
- 不直接执行外部 Agent 代码
- 不允许外部 Agent 直接访问数据库
- 不把系统设计成通用 LLM 编排平台
- 不把插件系统作为近期核心目标

外部 Agent 未来只能通过受控方式接入，例如：

- REST API
- API Token / Personal Access Token
- Webhook
- MCP Server 风格接口
- 未来可能的 OAuth-style 授权

## 1.3 产品核心价值

### 1.3.1 对普通用户

用户可以在一个统一的 Web 工作空间中管理：

- 任务
- 文件夹
- 子任务
- 标签
- 重复规则
- 财务账本
- 账户
- 分类
- 交易
- 拆分项
- 预算
- 财务事件
- 附件
- 主题偏好
- 帮助文档

### 1.3.2 对高级用户

用户可以：

- 自部署系统
- 管理个人数据
- 使用 API 连接外部工具
- 自定义主题和界面体验
- 未来接入外部 Agent、MCP Client、自动化工具

### 1.3.3 对外部 Agent / 自动化工具

长期目标是让用户授权的外部工具能够：

- 安全读取结构化数据
- 创建和修改任务
- 创建和查询财务记录
- 查询 Resource 关系图谱
- 接收 Webhook 事件
- 通过 MCP 工具接口操作系统
- 所有操作均受权限、审计和幂等机制约束

---

# 2. 产品设计原则

## 2.1 Web-first

产品采用 Web-first 策略。

用户无需安装原生客户端，可通过浏览器访问：

- PC
- 手机
- 平板

当前前端基于 Next.js 16 + React 19 + MUI,通过 Next App Router 提供页面和布局,并由 Next rewrites 代理 `/api/*` 与 `/uploads/*` 到 FastAPI 后端.

## 2.2 API-first

后端能力应通过清晰、稳定、结构化的 API 暴露。

API-first 的目的：

- 支持前后端解耦
- 支持未来移动端或其他客户端
- 支持外部脚本和自动化工具
- 支持未来外部 Agent 接入
- 支持 MCP Server 复用同一套服务能力

## 2.3 Self-hostable

产品应支持个人或小团队自部署。

当前部署方式包括：

- Docker
- Docker Compose
- Next.js 前端服务托管页面和 rewrites
- 后端容器运行 FastAPI 服务
- `deploy.sh` 自动构建、推送镜像并通过 SSH 部署到远端

## 2.4 Structured Data First

产品中的核心数据应尽量使用结构化模型，而不是仅依赖富文本或页面内容。

当前已经结构化的模块包括：

- Todo
- Finance
- Theme
- Auth

长期目标是建立统一 Resource 中心模型，使任务、交易、事件、附件、插件资源等都能被统一搜索、关联、授权和审计。

## 2.5 External-agent-ready

系统长期目标是为外部 Agent 做好准备，而不是在系统内部运行 Agent。

外部 Agent 接入原则：

- 用户显式授权
- 使用受控凭证
- 使用明确 scopes
- 通过公开 API 或 MCP 接口访问
- 所有写操作记录 AuditLog
- 所有关键操作产生 DomainEvent
- 通过 Webhook 对外通知事件

## 2.6 Progressive Extensibility

扩展能力应渐进式开放：

1. 当前模块稳定：Auth / Todo / Finance / Theme / Help
2. 增强 API 能力
3. 引入 Workspace 和 Resource 中心模型
4. 引入 AuditLog / DomainEvent / Webhook / Idempotency
5. 引入 MCP Server
6. 引入 Workflow DAG 自动化
7. 远期引入插件系统

---

# 3. 当前技术栈

## 3.1 后端技术栈

当前后端技术栈：

| 类型          | 技术                                            |
| ------------- | ----------------------------------------------- |
| 语言          | Python 3.12+                                    |
| Web 框架      | FastAPI                                         |
| ORM           | SQLAlchemy 2.x                                  |
| 数据校验      | Pydantic 2.x                                    |
| 默认数据库    | SQLite，当前默认 `sqlite:///./data/tool_web.db` |
| 认证          | JWT                                             |
| Cookie        | 支持 httpOnly cookie                            |
| Header Auth   | 支持 Authorization header                       |
| 密码哈希      | bcrypt                                          |
| ASGI Server   | Uvicorn                                         |
| 环境变量      | python-dotenv                                   |
| 日期处理      | python-dateutil                                 |
| 表单/文件上传 | python-multipart                                |

当前项目没有使用：

- NestJS
- Prisma
- PostgreSQL
- Redis
- 队列系统
- MCP Server

## 3.2 前端技术栈

当前前端技术栈：

| 类型     | 技术                                                         |
| -------- | ------------------------------------------------------------ |
| UI 框架  | React 19                                                     |
| 语言     | TypeScript                                                   |
| 应用框架 | Next.js 16 App Router                                        |
| 请求层   | `fetch` + `frontend/src/lib/api.ts`                          |
| UI 组件  | MUI Material, MUI Icons, MUI X Charts, MUI X Date Pickers     |
| 日期处理 | dayjs                                                        |
| 多语言   | `zh-CN` / `en-US` TypeScript 词典                             |

说明：

- 历史上的 Vite, Umi, Radix UI 和 Axios 方案已经被 Next.js + MUI 实现替代.
- 前端入口位于 `frontend/src/app`,全局 Provider 位于 `frontend/src/app/layout.tsx`.

## 3.3 部署方式

当前部署能力：

- Docker
- Docker Compose
- Next.js 前端容器托管页面,静态资源和 rewrites
- `deploy.sh` 构建 backend / frontend 镜像
- 镜像推送 Docker Hub
- 通过 SSH 到远端执行 compose 部署
- 前端默认暴露端口：`8003`

## 3.4 测试技术栈

当前测试技术栈：

- pytest
- httpx
- pytest-asyncio

已有后端测试覆盖：

- Auth 基础场景
- Folders 基础场景
- Todos 基础场景
- Finance Transactions 基础场景

---

# 4. 当前已实现能力

## 4.1 Auth 用户系统

当前已实现：

- 用户注册
- 用户登录
- 用户登出
- 密码修改
- 账号删除
- JWT 认证
- httpOnly cookie 认证
- Authorization header 认证
- bcrypt 密码哈希

当前数据归属主要基于 `user_id`。

## 4.2 Todo 任务模块

当前已实现：

- 任务创建
- 任务编辑
- 任务删除
- 任务完成状态
- 文件夹
- 子任务
- 标签
- 重复规则

Todo 是当前核心业务模块之一，但长期产品核心会从具体模块升级为统一 Resource 平台。

## 4.3 Finance 财务模块

当前已实现：

- 账本
- 账户
- 分类
- 标签
- 交易
- 拆分项
- 预算
- 财务事件
- 附件
- 简单关系

当前 Finance 定位是 **轻量个人财务管理模块**。

长期目标是升级为 **单币种专业复式记账模型**：

- 每个 ledger 一个 currency
- account 继承 ledger currency
- transaction / journal_entry / journal_line 使用 ledger currency
- 表结构预留 currency 字段
- 暂不实现多币种和汇率系统

## 4.4 Theme 自定义主题

Theme 是正式产品能力，不只是辅助功能。

当前定位：

> 允许用户高度自定义界面主题，提升个人工作空间的可塑性和长期使用体验。

Theme 能力应作为“个性化工作空间”的重要组成部分持续增强。

未来 Theme 可继续扩展：

- 颜色主题
- 字体偏好
- 布局密度
- 明暗模式
- 自定义组件风格
- 多设备主题同步

## 4.5 Help 文档

Help 是辅助模块，用于承载产品说明、使用帮助和引导内容。

它不是核心业务模块，但对自部署用户、API 用户和未来 Agent 接入用户很重要。

## 4.6 国际化

当前前端支持：

- 中文 zh
- 英文 en

国际化是正式产品能力，也属于非功能需求的一部分。

未来要求：

- 新增页面必须支持 i18n
- 新增核心文案不得硬编码单语言
- API 错误信息应支持稳定错误码，前端负责本地化展示

---

# 5. 当前数据模型特点与限制

## 5.1 当前数据模型特点

当前数据模型具有以下特点：

- 主要以 `user_id` 做数据归属
- 主键多为自增整数 `Integer`
- 业务模块各自建模
- Todo 和 Finance 已具备相对独立的业务表
- 已存在简单关系能力
- 附件主要服务于当前业务模块
- 当前数据库默认 SQLite

## 5.2 当前尚未实现的基础设施

当前尚未实现：

- Workspace 多租户模型
- Workspace Member / Role / Scope
- 统一 Resource 中心模型
- External Client 模型
- API Credential / Personal Access Token 管理
- 完整 AuditLog
- DomainEvent
- Webhook Subscription / Delivery
- Idempotency Key
- MCP Server
- 统一搜索索引
- 统一 Relation Graph
- Workflow DAG 自动化
- 插件系统
- Redis / 队列系统
- PostgreSQL 生产级适配

## 5.3 当前限制

当前系统更接近一个单用户个人 Web 应用，而不是完整的多租户 Agent-ready 数据平台。

主要限制：

1. 数据归属基于 `user_id`，未来协作和外部授权场景不够灵活。
2. 外部 API 不宜直接暴露自增整数 ID。
3. 缺少统一 Resource 层，跨模块搜索、关联、权限、审计成本较高。
4. 缺少 AuditLog，无法完整回答“谁在什么时候通过什么方式修改了什么”。
5. 缺少 DomainEvent 和 Webhook，外部系统无法稳定订阅数据变化。
6. 缺少 Idempotency，对外部 Agent、脚本和自动化重试不够安全。
7. SQLite 适合当前轻量部署，但对多租户、高并发、队列消费、复杂搜索存在天然限制。

---

# 6. 目标架构方向

## 6.1 当前层与目标层分离

文档中需要区分两层：

### 当前实现层

当前实现层基于：

- FastAPI
- SQLAlchemy
- SQLite
- user_id 数据归属
- 现有 Auth / Todo / Finance / Theme / Help 模块

### 目标架构层

目标架构层面向长期能力：

- Workspace-owned data
- Resource-centered architecture
- External Client / API Credential
- AuditLog
- DomainEvent
- Webhook
- Idempotency
- MCP Server
- Workflow DAG
- Plugin system

目标架构必须基于当前技术栈演进，不应假设项目已经切换到 NestJS / Prisma / PostgreSQL。

## 6.2 Workspace 模型

长期应从 `user_id` 数据归属升级为 `workspace_id` 数据归属。

建议模型：

- User：真实用户账户
- Workspace：数据容器
- WorkspaceMember：用户在 workspace 中的成员关系
- Role：owner / admin / member / viewer
- Scope：更细粒度权限控制

产品上可以先表现为个人 workspace，但数据库和后端服务应支持未来协作。

## 6.3 Resource 中心模型

长期核心不是 Todo 或 Finance，而是统一 Resource 平台。

Resource 应代表所有可被用户看到、搜索、关联、授权、审计、外部 Agent 操作的根对象。

应成为 Resource 的对象：

- Todo
- Folder
- Project
- Calendar Event
- Finance Transaction
- Journal Entry
- Finance Account
- Budget
- Attachment
- Dashboard
- Automation Rule
- Plugin Installation
- Custom Plugin Resource

通常不应成为 Resource 的对象：

- 中间表
- 标签关联行
- Journal Line
- Webhook Delivery
- AuditLog
- Workspace Member
- API Credential Scope

## 6.4 ID 策略

长期建议：

- 内部数据库可继续使用整数主键
- 对外 API 使用稳定 public_id
- public_id 建议使用 ULID 或 UUID

规则：

- 外部 API 不暴露内部整数 ID
- Webhook payload 不暴露内部整数 ID
- MCP 工具不暴露内部整数 ID
- 前端路由和外部链接优先使用 public_id

## 6.5 数据库策略

当前默认数据库：SQLite。

建议定位：

- SQLite：开发环境、个人轻量自部署、小规模单机部署
- PostgreSQL：未来生产级部署、高级部署、多租户、复杂搜索、Webhook/队列场景

当前不要求立即切换 PostgreSQL，但未来设计应避免强绑定 SQLite-only 能力。

---

# 7. 外部 Agent 接入规划

## 7.1 产品边界

外部 Agent 是系统外部调用方，不是系统内部运行主体。

系统需要管理：

- 谁授权了外部 Agent
- 外部 Agent 使用哪个凭证
- 凭证有哪些权限
- 外部 Agent 读写了哪些资源
- 写操作是否可审计、可追踪、可回放

系统不需要管理：

- Agent 的对话上下文
- Agent 的推理过程
- Agent 的长期记忆
- Agent 的内部工具链
- Agent 的执行计划

## 7.2 External Client

长期应引入 External Client 概念。

External Client 类型包括：

- agent
- script
- cli
- integration
- mcp_client
- webhook_consumer
- automation_tool

External Client 可以绑定 API Credential，并通过 scopes 控制权限。

## 7.3 API Credential

长期支持：

- API Token
- Personal Access Token
- 未来预留 OAuth-style grant

要求：

- 只存储 token hash
- token 创建后只显示一次
- 支持过期时间
- 支持吊销
- 支持 last_used_at
- 支持 scopes

## 7.4 MCP Server

MCP Server 是长期 Agent 接入方式之一，当前尚未实现。

未来可暴露工具：

- resource.search
- resource.get
- resource.create
- resource.update
- resource.relate
- todo.create
- todo.update
- todo.complete
- finance_transaction.create
- finance_transaction.get
- calendar_event.create

MCP 必须复用同一套：

- 认证
- workspace 上下文
- scope 权限
- audit log
- idempotency
- rate limit

---

# 8. Webhook、DomainEvent 与 Idempotency

## 8.1 DomainEvent

长期应引入 DomainEvent，作为系统内部事件流。

DomainEvent 用于驱动：

- Webhook
- Automation
- Notification
- Search Index
- Activity Timeline

事件命名建议：

- generic event：`resource.created`
- specific event：`core.todo.created`

一个事件可同时保存 generic 和 specific 类型。

## 8.2 Webhook

Webhook 是外部系统和外部 Agent 订阅系统变化的方式。

长期要求：

- 支持事件订阅
- 支持 HMAC 签名
- 支持 retry policy
- 支持 delivery log
- 支持 dead-letter
- 支持手动重放
- 支持 payload 模式：thin / summary / full

默认 payload 模式建议为 summary。

## 8.3 Idempotency

外部调用方、MCP、Webhook callback 和自动化写操作应支持幂等。

目的：

- 防止外部 Agent 重试导致重复创建
- 防止脚本异常重复提交
- 防止网络重试造成重复交易或重复任务

长期建议支持 `Idempotency-Key` header。

---

# 9. 自动化与 Workflow

## 9.1 自动化目标

自动化是长期能力，目标是让用户能基于系统事件配置规则和流程。

基础模型：

- Trigger
- Condition
- Action

长期模型：Workflow DAG。

## 9.2 Workflow DAG

未来 Workflow DAG 应支持：

- Trigger
- Condition
- Action
- Branch / if-else
- Delay / wait until
- Manual approval
- Webhook call
- External client callback
- MCP tool call

当前不要求实现完整 DAG，但数据模型和服务边界应允许未来扩展。

---

# 10. 插件系统规划

插件系统是远期能力，不进入近期核心路线。

长期插件系统应支持：

- permissions / scopes
- resource types
- relation types
- widgets
- pages
- actions
- automation triggers
- automation actions
- external network access declaration
- sandbox runtime requirements

插件代码不应直接访问核心数据库。

第一阶段可以使用 `plugin_data` JSON 存储插件私有数据，未来再考虑插件私有 schema/table。

插件卸载应支持：

- 保留数据
- 导出数据
- 删除数据

---

# 11. Finance 长期方向

## 11.1 当前定位

当前 Finance 是轻量个人财务管理模块。

当前能力包括：

- 账本
- 账户
- 分类
- 标签
- 交易
- 拆分项
- 预算
- 财务事件
- 附件
- 简单关系

## 11.2 长期目标

长期目标是升级为单币种专业复式记账模型。

核心模型：

- Ledger
- FinanceAccount
- FinanceTransaction
- JournalEntry
- JournalLine
- Budget
- FinanceEvent

## 11.3 单币种规则

长期规则：

- 每个 ledger 一个 currency
- account 必须继承 ledger currency
- transaction 必须使用 ledger currency
- journal_entry 必须使用 ledger currency
- journal_line 必须使用 ledger currency
- 表中可以预留 currency 字段
- 暂不实现多币种汇率和重估损益

## 11.4 复式记账规则

长期规则：

- Posted journal entry 必须借贷平衡
- debit 总和必须等于 credit 总和
- 同一 journal line 不能同时有 debit 和 credit
- posted entry 不建议直接修改，应通过 reversal 或 adjustment 处理

---

# 12. Theme 与个性化工作空间

Theme 是产品正式能力。

当前 Theme 应从“用户主题”升级为“个性化工作空间”的基础能力。

未来可以扩展：

- 自定义颜色
- 自定义字体
- 自定义暗色/亮色模式
- 自定义卡片样式
- 自定义图表风格
- 自定义布局密度
- 多设备同步主题
- 主题导入导出

Theme 与未来 Dashboard / Widget / Plugin UI 可以形成统一的个性化体系。

---

# 13. 国际化与可访问性

## 13.1 国际化

当前支持：

- zh
- en

长期要求：

- 所有新增用户可见文案必须进入 i18n
- API 返回稳定错误码
- 前端负责错误码本地化
- 日期、数字、货币应根据语言和地区格式化

## 13.2 可访问性

未来 UI 应关注：

- 键盘可访问
- 对话框焦点管理
- 颜色对比度
- 表单错误提示
- 移动端触控体验

MUI 组件应继续作为可访问性基础,对话框,菜单,日期选择器和表单控件优先复用 MUI / MUI X 能力.

---

# 14. 非功能需求

## 14.1 性能

目标：

| 指标          | 目标                           |
| ------------- | ------------------------------ |
| 首屏加载      | 尽量控制在 3 秒以内            |
| 常规 API 响应 | P95 ≤ 500ms，复杂查询除外      |
| Todo 基础操作 | 应保持轻量快速                 |
| Finance 查询  | 支持按账本、账户、时间范围过滤 |

## 14.2 安全

当前已有：

- JWT
- httpOnly cookie
- Authorization header
- bcrypt 密码哈希

长期需要：

- Workspace 级数据隔离
- Scope 权限
- API Credential hash 存储
- AuditLog
- Rate Limit
- Idempotency
- Webhook HMAC 签名
- 敏感操作二次确认

## 14.3 可维护性

要求：

- FastAPI 路由按模块组织
- SQLAlchemy 模型清晰分层
- Pydantic schema 与 ORM 模型边界清楚
- 服务层封装业务逻辑
- 测试覆盖核心业务路径
- 避免前端页面直接绑定后端内部实现细节

## 14.4 可部署性

要求：

- 保持 Docker 部署能力
- 保持 Docker Compose 部署能力
- 保持 Next.js 前端容器部署方式
- 生产配置通过环境变量管理
- SQLite 数据文件路径可配置
- 未来支持 PostgreSQL 连接配置

---

# 15. 路线图

## 15.1 当前状态

当前已经具备：

- Auth
- Todo
- Finance
- Theme
- Help
- zh/en 多语言
- Docker 部署
- 基础测试
- SQLite 默认数据库
- FastAPI + SQLAlchemy 后端
- Next.js + React + MUI 前端

## 15.2 近期目标

近期目标应聚焦当前架构增强，不做大规模平台化重构。

建议优先级：

1. 完善当前 PRD 与技术文档
2. 梳理现有 SQLAlchemy 模型
3. 明确 API 规范
4. 为外部 API 引入 public_id
5. 完善测试覆盖
6. 增强 Theme 自定义能力
7. 优化 Todo / Finance 当前体验
8. 明确 SQLite 数据备份和迁移策略

## 15.3 中期目标

中期目标是从单用户模块化应用演进为结构化数据平台。

建议能力：

1. Workspace 模型
2. WorkspaceMember / Role / Scope
3. Resource 中心模型
4. 统一 Relation Graph
5. AuditLog
6. DomainEvent
7. Idempotency
8. External Client / API Credential
9. Webhook
10. PostgreSQL 可选支持

## 15.4 长期目标

长期目标是 Agent-ready 平台化能力。

建议能力：

1. MCP Server
2. Workflow DAG 自动化
3. 单币种复式记账 Finance
4. 统一搜索：Postgres FTS + trigram + 未来 vector
5. Dashboard / Widget 系统
6. 插件系统
7. 插件注册 Resource Type / Relation Type
8. 多 workspace 协作体验
9. 高级权限与审计能力
10. 数据导入导出和备份恢复

---

# 16. 产品版本规划

## 当前版本：已实现基础产品

包含：

- 用户系统
- Todo
- Finance
- Theme
- Help
- 多语言
- Docker 部署
- 基础测试

## 近期版本：稳定化与 API 化

目标：

- 整理 API
- 强化测试
- 增加 public_id
- 优化现有模块
- 增强主题自定义
- 完善部署文档

## 中期版本：平台底座

目标：

- Workspace
- Resource
- Relation
- AuditLog
- DomainEvent
- Webhook
- Idempotency
- External Client

## 长期版本：Agent-ready Workspace

目标：

- MCP Server
- Workflow DAG
- 插件系统
- 高级搜索
- Dashboard / Widget
- 专业 Finance
- 多用户协作

---

# 17. 文档维护原则

本文档应与实际项目保持同步。

当以下内容变化时，需要更新文档：

- 技术栈变化
- 数据库类型变化
- 核心模型变化
- API 认证方式变化
- 新增核心模块
- 部署方式变化
- 外部 Agent 接入方式变化
- MCP / Webhook / Plugin 等长期能力进入实现阶段

产品文档和 Codex 工程修改建议应分开维护：

- 产品文档说明产品目标、现状、能力和路线图
- Codex Engineering Brief 说明具体代码修改、迁移、测试和验收标准

