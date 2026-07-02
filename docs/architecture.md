# Tool Web 架构说明

本文档是架构与技术选型的唯一事实来源 (SSOT). 产品定位见 [`product.md`](product.md), 各模块实现细节见对应模块文档.

## 1. 当前架构选择

| 项目 | 选择 | 原因 |
| ---- | ---- | ---- |
| 架构风格 | 前后端分离的 Web-first 架构 | 前端承担响应式交互,后端暴露 RESTful API,便于后续 Agent 和自动化脚本接入 |
| 编程语言 | 前端 TypeScript,后端 Python 3.12+ | TypeScript 提升 UI 与 API 类型约束,Python 适合 FastAPI 生态和快速迭代 |
| 前端框架 | Next.js 16,React 19,MUI | App Router 管理页面与布局,MUI 提供一致组件体系和 DatePicker 等复杂控件 |
| 后端框架 | FastAPI,SQLAlchemy,Alembic,Pydantic | API 定义清晰,ORM 与迁移能力完整,适合模块化路由和测试 |
| 数据库 | SQLite | 当前个人部署阶段足够轻量,降低本地启动和备份复杂度 |
| 缓存 | 暂不引入独立缓存 | 当前读写规模较小,优先保持系统简单,等实际负载明确后再评估 |
| 部署方式 | Docker Compose,Next.js,FastAPI | 支持本地开发,测试环境和发布环境复用同一服务边界 |

## 2. 模块划分

```text
tool_web/
├── frontend/
│   └── src/
│       ├── app/          # Next App Router 页面: todo, finance, focus, calendar, login, register
│       ├── components/   # 按模块分目录: layout, auth, todo(含 kanban), finance, focus, calendar, workspace, theme
│       ├── context/      # AuthContext, I18nContext, LayoutActionsContext 等全局状态
│       ├── i18n/         # 中文和英文词典
│       └── lib/          # API client, 共享类型和前端工具函数
├── backend/
│   └── src/
│       ├── main.py       # FastAPI 入口,CORS,路由注册和中间件挂载
│       ├── database.py   # 数据库连接,启动时执行 Alembic 迁移,session 管理
│       ├── auth/         # 认证领域逻辑 (六边形架构: core / ports / adapters / fastapi_adapter)
│       ├── middleware/   # 认证和请求处理中间件
│       ├── models/       # SQLAlchemy 数据模型
│       ├── routers/      # todo, folder, tag, kanban, sprint, finance, focus, calendar, theme 等 API 路由
│       ├── schemas/      # Pydantic 请求和响应 schema
│       └── utils/        # 安全,限流,错误处理等工具
│   └── migrations/       # Alembic 迁移脚本 (versions/ 按时间戳递增编号)
└── docs/                 # 项目文档 (索引见 docs/README.md)
```

说明:

- 数据库 schema 变更一律通过 Alembic 迁移管理, 后端启动时在 lifespan 中自动执行 `upgrade head`, 不使用 `create_all`.
- 前端 API 调用层当前存在三种组织方式并存 (`lib/api.ts` 巨型文件, `lib/api/` 子目录, 组件目录内 service), 属已立案技术债, 目标是统一收敛到 `lib/api/<模块>.ts`, 见 [`tech-debt.md`](tech-debt.md) TD-01/TD-02.

## 3. 依赖方向

```text
Browser
  ↓
Next.js App Router 页面
  ↓
React 组件,Context,API client (lib/)
  ↓
Next.js rewrites: /api/*,/uploads/*
  ↓
FastAPI routers
  ↓
schemas,auth,middleware,utils
  ↓
SQLAlchemy models
  ↓
SQLite database
```

后端内部依赖方向保持为 router 调用 schema,auth,utils 和 database session,再访问 model. Model 不反向依赖 router 或前端类型.

## 4. 架构约束

-   前端 API 调用统一经过 API client 层 (`frontend/src/lib/`),避免页面组件直接散落请求细节.
-   前端日期选择控件必须使用 MUI X `DatePicker`,日期显示格式通过共享常量 (`frontend/src/lib/dateFormats.ts`) 和 `format` 属性控制.
-   后端新增接口必须进入对应 `backend/src/routers/` 模块,并配套 Pydantic schema 和 pytest 覆盖.
-   文件夹和标签默认属于各自业务模块,新模块必须使用独立数据表,API client,前端类型和状态管理.只有需求或设计文档明确写明共享时,才允许跨模块复用文件夹或标签能力.
-   后端质量检查以 `ruff`, `mypy` 和 `pytest` 为准,避免新增未类型化或未格式化代码.
-   当前阶段不引入 Redis,消息队列或微服务拆分,除非实际需求证明有必要.
-   `.env` 保存本地敏感配置,公开文档只维护 `.env.example` 和必要说明.

## 5. 未来扩展点

| 扩展点 | 当前做法 | 未来可能演化 |
| ------ | -------- | ------------ |
| Agent API Token | 复用用户认证和 REST API 边界 | 增加 token 管理,权限 scope,撤销和审计日志 |
| Webhook 事件 | 当前业务直接写库和返回响应 | 增加事件表,重试机制和签名校验 |
| 自动化规则 | 暂无独立规则引擎 | 从简单 IF/THEN 规则开始,逐步扩展到任务和财务事件 |
| 数据库 | SQLite 单文件部署 | 数据增长或多用户部署时迁移到 PostgreSQL |
| Dashboard 自定义 | 当前以固定页面和组件为主 | 增加 Widget 配置,布局保存和多端布局策略 |

以上扩展点均属远期方向, 排期见 [`roadmap.md`](roadmap.md).
