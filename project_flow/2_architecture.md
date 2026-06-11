# 2_architecture

## 1. 当前架构选择

| 项目 | 选择 | 原因 |
| ---- | ---- | ---- |
| 架构风格 | 前后端分离的 Web-first 架构 | 前端承担响应式交互,后端暴露 RESTful API,便于后续 Agent 和自动化脚本接入 |
| 编程语言 | 前端 TypeScript,后端 Python 3.12+ | TypeScript 提升 UI 与 API 类型约束,Python 适合 FastAPI 生态和快速迭代 |
| 前端框架 | Next.js 16,React 19,MUI | App Router 管理页面与布局,MUI 提供一致组件体系和 DatePicker 等复杂控件 |
| 后端框架 | FastAPI,SQLAlchemy,Alembic,Pydantic | API 定义清晰,ORM 与迁移能力完整,适合模块化路由和测试 |
| 数据库 | SQLite | 当前个人部署和 MVP 阶段足够轻量,降低本地启动和备份复杂度 |
| 缓存 | 暂不引入独立缓存 | 当前读写规模较小,优先保持系统简单,等 Agent/Webhook 负载明确后再评估 |
| 部署方式 | Docker Compose,Next.js,FastAPI | 支持本地开发,测试环境和发布环境复用同一服务边界 |

## 2. 模块划分

```text
tool_web/
├── frontend/
│   └── src/
│       ├── app/          # Next App Router 页面,全局布局和路由入口
│       ├── components/   # 通用 UI,布局,认证,Todo,Finance,设置组件
│       ├── context/      # AuthContext,I18nContext 等全局状态
│       ├── data/         # 前端静态数据或配置数据
│       ├── i18n/         # 中文和英文词典
│       └── lib/          # API client,共享类型和前端工具函数
├── backend/
│   └── src/
│       ├── main.py       # FastAPI 入口,CORS,路由注册和中间件挂载
│       ├── database.py   # 数据库连接,Alembic 迁移和 session 管理
│       ├── auth/         # 认证领域逻辑
│       ├── middleware/   # 认证和请求处理中间件
│       ├── models/       # SQLAlchemy 数据模型
│       ├── routers/      # auth,todo,folder,tag,finance,theme 等 API 路由
│       ├── schemas/      # Pydantic 请求和响应 schema
│       └── utils/        # 安全,限流,错误处理等工具
├── docs/                 # 项目级模块文档
└── project_flow/         # 项目设想,架构和迭代规划文档
```

## 3. 依赖方向

```text
Browser
  ↓
Next.js App Router 页面
  ↓
React 组件,Context,lib/api.ts
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

-   前端 API 调用统一经过 `frontend/src/lib/api.ts`,避免页面组件直接散落请求细节.
-   前端日期选择控件必须使用 MUI X `DatePicker`,日期显示格式通过共享常量和 `format` 属性控制.
-   后端新增接口必须进入对应 `backend/src/routers/` 模块,并配套 Pydantic schema 和 pytest 覆盖.
-   后端质量检查以 `ruff`, `mypy` 和 `pytest` 为准,避免新增未类型化或未格式化代码.
-   当前阶段不引入 Redis,消息队列或微服务拆分,除非 Agent/Webhook 的实际需求证明有必要.
-   `.env` 保存本地敏感配置,公开文档只维护 `.env.example` 和必要说明.

## 5. 未来扩展点

| 扩展点 | 当前做法 | 未来可能演化 |
| ------ | -------- | ------------ |
| Agent API Token | 复用用户认证和 REST API 边界 | 增加 token 管理,权限 scope,撤销和审计日志 |
| Webhook 事件 | 当前业务直接写库和返回响应 | 增加事件表,重试机制和签名校验 |
| 自动化规则 | 暂无独立规则引擎 | 从简单 IF/THEN 规则开始,逐步扩展到任务和财务事件 |
| 数据库 | SQLite 单文件部署 | 数据增长或多用户部署时迁移到 PostgreSQL |
| Dashboard 自定义 | 当前以固定页面和组件为主 | 增加 Widget 配置,布局保存和多端布局策略 |
