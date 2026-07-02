# Tool Web

Tool Web 是一个自用为主, 可自部署的个人工具网站, 目前包含 Todo 任务管理, Finance 个人记账, Focus 专注番茄钟, Calendar 日历, 用户认证, 自定义主题和帮助文档等模块. 前端提供响应式交互界面, 后端暴露 RESTful API, 亦可供脚本和 Agent 等外部调用方使用.

项目仍处于开发阶段, 当前前端已迁移为 Next.js + React + MUI, 通过 Next rewrites 将 `/api/*` 和 `/uploads/*` 代理到 FastAPI 后端.

## 功能

- **用户认证**: 登录, 注册, cookie-based JWT, token 自动刷新, 偏好设置同步.
- **Todo 任务管理**: 文件夹, 标签, 优先级, 子任务, 搜索筛选, 拖拽排序, 批量操作.
- **Finance 个人记账**: 多账本, 账户, 分类, 标签, 交易, 子交易, 预算, 事件, 图表统计.
- **Focus 专注番茄钟**: 番茄钟, 自由计时, 多标签, 休息, 归档复盘, 记录筛选, 记录编辑和数据总览.
- **Calendar 日历**: 月/周/日/日程视图, 手动事件管理, 聚合 Todo 截止日与 Finance 交易和事件的只读展示.
- **自定义主题**: 亮色/暗色/Matcha/跟随系统, 用户上传 JSON 主题, 页面级 token 覆盖, 自定义按钮和脚本桥接.
- **国际化**: 中文和英文 TypeScript 词典, 登录页支持语言切换和本地化错误提示.
- **响应式布局**: 桌面顶部栏, TODO 侧边栏, 移动端顶栏与抽屉式导航.
- **RESTful API**: FastAPI 后端, 统一认证与模块化路由.

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 16, React 19, TypeScript, MUI |
| 后端 | FastAPI, SQLAlchemy ORM, bcrypt, PyJWT |
| 数据库 | SQLite |
| 部署 | Docker Compose, Next.js, FastAPI |
| 测试 | pytest, TestClient, Vitest, React Testing Library |

## 项目结构

```text
tool_web/
├── backend/
│   ├── src/
│   │   ├── main.py              # FastAPI 入口: CORS, 路由注册, 中间件
│   │   ├── database.py          # 数据库连接, Alembic 迁移执行, session 管理
│   │   ├── auth/                # 可复用认证领域逻辑和 FastAPI 适配
│   │   ├── models/              # SQLAlchemy 模型
│   │   ├── schemas/             # Pydantic schema
│   │   ├── routers/             # todo / folder / tag / sprint / kanban / finance / focus / theme
│   │   ├── middleware/          # 认证和日志中间件
│   │   └── utils/               # 安全, 限流, 错误工具
│   ├── migrations/              # Alembic schema 迁移
│   ├── tests/                   # pytest 测试
│   ├── pyproject.toml
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next App Router 页面
│   │   ├── components/          # UI, layout, todo, finance, focus, auth, settings
│   │   ├── context/             # AuthContext 登录态, I18nContext 语言状态
│   │   ├── i18n/                # 前端中文/英文文案词典
│   │   ├── lib/                 # API client 与共享类型
│   │   └── theme.ts             # MUI 主题
│   ├── public/
│   ├── next.config.ts           # /api 与 /uploads 代理
│   ├── package.json
│   └── Dockerfile
├── docs/
│   ├── README.md                # 文档索引
│   ├── product.md               # 产品文档 (PRD)
│   ├── architecture.md          # 架构说明
│   ├── roadmap.md               # 路线图
│   ├── tech-debt.md             # 技术债清单
│   ├── frontend.md              # 前端 Next.js 架构说明
│   ├── api.md
│   ├── auth.md
│   ├── calendar.md
│   ├── finance.md
│   ├── focus.md
│   ├── github-actions.md
│   ├── testing.md
│   ├── theme.md
│   └── todo.md
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

## 快速开始

### 环境变量

```bash
cp .env.example .env
# 编辑 .env, 至少配置 JWT_SECRET
```

### Docker Compose

```bash
cp .env.example .env
# 编辑 .env, 至少配置 JWT_SECRET
./build-and-run.sh
```

浏览器访问 `http://localhost:8003`.

生产发布使用 `deploy.sh`. 该脚本会合并本地构建配置和生产镜像配置, 构建并推送 `${DOCKER_USER}/tool-web-frontend:latest` 与 `${DOCKER_USER}/tool-web-backend:latest`, 再同步 `docker-compose.prod.yml` 与 `.env` 到远端并执行 `docker compose -f docker-compose.prod.yml up -d`.

前端 Docker 构建时会把 `API_PROXY_TARGET` 写入 Next.js rewrites. Docker Compose 使用 `DOCKER_API_PROXY_TARGET` 注入该值, 默认值为 `http://backend:8000`. 如果该值错误地使用 `http://localhost:8004`, 前端容器会代理到自身的 localhost 并出现后端服务不可用.

### 本地开发

Windows 本地开发可在项目根目录一键启动前后端:

```bat
start-local-dev.bat
```

脚本会检查 `uv` 和 `npm.cmd`,分别打开 `Tool Web Backend` 和 `Tool Web Frontend` 两个命令行窗口. 后端会先执行 `uv sync`,再启动 FastAPI `http://localhost:8004`; 前端会在缺少 `node_modules` 时执行 `npm install`,再启动 Next.js dev server `http://localhost:3000`. 如需仅检查目录和命令依赖,可执行 `start-local-dev.bat --check`.

启动后端:

```bash
cd backend
uv sync
uv run uvicorn src.main:app --host 0.0.0.0 --port 8004
```

后端运行在 `http://localhost:8004`, API 文档位于 `http://localhost:8004/docs`.

启动前端:

```bash
cd frontend
npm install
npm run dev
```

前端由 Next.js dev server 启动, 默认运行在 `http://localhost:3000`. `next.config.ts` 会将 `/api` 与 `/uploads` 请求代理到后端 `http://localhost:8004`.

### 构建与检查

```bash
cd frontend
npm run test
npm run build
```

```bash
cd backend
uv sync --extra dev
uv run --with ruff ruff check src tests
uv run --with mypy mypy --ignore-missing-imports src tests
JWT_SECRET=test uv run python -m pytest tests/ -v
```

> 如果本地 `node_modules` 仍是旧依赖, 请先执行 `npm install` 或 `npm ci` 以刷新依赖和 `package-lock.json`.
> 当前前端 `npm run lint` 仍有重构遗留的 baseline 错误, CI 暂时将 lint 作为非阻塞输出, 详见 `docs/testing.md`.

## 前端开发约定

- Next App Router 页面集中在 `frontend/src/app`.
- 全局 Provider, 主题注册和鉴权壳层放在 `frontend/src/app/layout.tsx`.
- 页面组件放在 `frontend/src/app`, 通用组件放在 `frontend/src/components`.
- API 统一通过 `frontend/src/lib/api.ts` 调用, 由 `frontend/next.config.ts` 代理到后端.

## 常用文档

- [文档索引](docs/README.md)
- [产品文档 (PRD)](docs/product.md)
- [架构说明](docs/architecture.md)
- [路线图](docs/roadmap.md)
- [技术债清单](docs/tech-debt.md)
- [前端架构](docs/frontend.md)
- [API 文档](docs/api.md)
- [认证模块](docs/auth.md)
- [Todo 模块](docs/todo.md)
- [Finance 模块](docs/finance.md)
- [Focus 专注模块](docs/focus.md)
- [Calendar 模块](docs/calendar.md)
- [主题系统](docs/theme.md)
- [测试方案](docs/testing.md)
- [GitHub Actions 部署](docs/github-actions.md)

## 未来规划

近期与远期规划统一维护在 [docs/roadmap.md](docs/roadmap.md).

## GitHub Actions

项目包含 release 生产部署和 dev 测试部署两个 Docker workflow, 触发分支, 质量检查, Secrets 与 Variables 配置详见 [docs/github-actions.md](docs/github-actions.md).
