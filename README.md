# Tool Web

Tool Web 是一个个人工具网站, 目前包含 Todo 任务管理, Finance 个人记账, 用户认证, 自定义主题和帮助文档等模块. 项目面向 Web 用户和自动化 Agent 同时提供能力: 前端提供响应式交互界面, 后端暴露 RESTful API.

项目仍处于开发阶段, 当前前端已迁移为 Next.js + React + MUI, 通过 Next rewrites 将 `/api/*` 和 `/uploads/*` 代理到 FastAPI 后端.

## 功能

- **用户认证**: 登录, 注册, cookie-based JWT, token 自动刷新, 偏好设置同步.
- **Todo 任务管理**: 文件夹, 标签, 优先级, 子任务, 搜索筛选, 拖拽排序, 批量操作.
- **Finance 个人记账**: 多账本, 账户, 分类, 标签, 交易, 子交易, 预算, 事件, 图表统计.
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
│   │   ├── routers/             # todo / folder / tag / sprint / kanban / finance / theme
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
│   │   ├── components/          # UI, layout, todo, finance, auth, settings
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
│   ├── frontend.md              # 前端 Next.js 架构说明
│   ├── api.md
│   ├── auth.md
│   ├── calendar.md
│   ├── finance.md
│   ├── github-actions.md
│   ├── testing.md
│   ├── theme.md
│   ├── todo.md
│   ├── uml/
│   └── superpowers/
├── project_flow/
│   ├── 1_project_idea.md
│   ├── 2_architecture.md
│   └── sprints/
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

脚本会检查 `uv` 和 `npm`,分别打开 `Tool Web Backend` 和 `Tool Web Frontend` 两个命令行窗口. 后端会先执行 `uv sync`,再启动 FastAPI `http://localhost:8004`; 前端会在缺少 `node_modules` 时执行 `npm install`,再启动 Next.js dev server `http://localhost:3000`. 如需仅检查目录和命令依赖,可执行 `start-local-dev.bat --check`.

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
- [当前 PRD](product2.md)
- [项目设想](project_flow/1_project_idea.md)
- [架构说明](project_flow/2_architecture.md)
- [前端架构](docs/frontend.md)
- [API 文档](docs/api.md)
- [认证模块](docs/auth.md)
- [Todo 模块](docs/todo.md)
- [Finance 模块](docs/finance.md)
- [Calendar 模块](docs/calendar.md)
- [主题系统](docs/theme.md)
- [测试方案](docs/testing.md)
- [GitHub Actions 部署](docs/github-actions.md)
- [UML 图索引](docs/uml/index.md)

## 未来规划

- 日历模块
- 联系人模块
- 周期总结模块
- 第三方登录, 2FA, CAPTCHA
- 更完整的主题编辑器和主题市场
- Agent 友好的 API 操作接口
- PWA 离线能力

## GitHub Actions

项目包含两个 Docker 部署 workflow:

- `.github/workflows/release-build-run.yml`: 当代码 push 到 `release_*` 分支时触发. 先执行后端质量检查: `uv sync --frozen --extra dev`, `ruff check src tests`, `mypy --ignore-missing-imports src tests`, `pytest tests -q`; 同时执行前端质量检查: `npm ci`, `npm run lint` (当前非阻塞), `npm run test`, `npm run build`. 检查通过后,按 `deploy.sh` 的生产发布方式构建前后端镜像,推送 `${DOCKERHUB_USERNAME}/tool-web-frontend:latest` 和 `${DOCKERHUB_USERNAME}/tool-web-backend:latest`,再通过 SSH 在发布服务器执行 `docker compose -f docker-compose.prod.yml up -d`.
- `.github/workflows/dev-test-deploy.yml`: 当代码 push 到 `dev` 分支时触发. 先执行同样的后端和前端质量检查. 检查通过后,构建并推送 `:dev` 测试镜像,在测试服务器写入独立的 `docker-compose.test.yml`,使用独立 Compose project 和测试数据目录运行测试环境. 默认测试端口为前端 `18003`,后端 `18004`,可通过 GitHub Variables 调整.

Ruff 配置位于 `backend/pyproject.toml`,当前启用规则前缀为 `E`, `W`, `N`, `I`, `F`, `UP`.

必须配置的 GitHub Secrets:

- `DOCKERHUB_USERNAME`: Docker Hub 用户名.
- `DOCKERHUB_TOKEN`: Docker Hub 访问令牌.
- `RELEASE_SSH_HOST`: 发布服务器 SSH host.
- `RELEASE_SSH_PRIVATE_KEY`: 发布服务器 SSH 私钥.
- `RELEASE_JWT_SECRET`: 发布环境 JWT secret.
- `TEST_SSH_HOST`: 测试服务器 SSH host.
- `TEST_SSH_PRIVATE_KEY`: 测试服务器 SSH 私钥.
- `TEST_JWT_SECRET`: 测试环境 JWT secret.

可选 GitHub Secrets:

- `RELEASE_SSH_USER`: 发布服务器 SSH 用户,默认 `root`.
- `RELEASE_ADMIN_PASSWORD`: 发布环境管理员种子密码,为空则由后端按现有逻辑处理.
- `TEST_SSH_USER`: 测试服务器 SSH 用户,默认 `root`.
- `TEST_ADMIN_PASSWORD`: 测试环境管理员种子密码,为空则由后端按现有逻辑处理.

常用 GitHub Variables:

- `RELEASE_REMOTE_PATH`: 发布环境远程目录,默认 `/opt/tool_web`.
- `RELEASE_SSH_PORT`: 发布服务器 SSH 端口,默认 `22`.
- `RELEASE_ALLOWED_ORIGINS`: 发布环境 CORS origins,默认 `http://localhost:8003,http://localhost:3000`.
- `RELEASE_DOCKER_API_PROXY_TARGET`: 发布环境前端代理目标,默认 `http://backend:8000`.
- `RELEASE_RESET_AUTH_SCHEMA`: 发布后是否重置认证 schema,默认 `0`.
- `TEST_REMOTE_PATH`: 测试环境远程目录,默认 `/opt/tool_web_test`.
- `TEST_SSH_PORT`: 测试服务器 SSH 端口,默认 `22`.
- `TEST_FRONTEND_PORT`: 测试环境前端宿主机端口,默认 `18003`.
- `TEST_BACKEND_PORT`: 测试环境后端宿主机端口,默认 `18004`.
- `TEST_ALLOWED_ORIGINS`: 测试环境 CORS origins,默认 `http://localhost:${TEST_FRONTEND_PORT}`.
- `TEST_DOCKER_API_PROXY_TARGET`: 测试环境前端代理目标,默认 `http://backend:8000`.
- `TEST_COMPOSE_PROJECT`: 测试环境 Docker Compose project 名,默认 `tool-web-test`.
- `TEST_RESET_AUTH_SCHEMA`: 测试环境部署后是否重置认证 schema,默认 `0`.
