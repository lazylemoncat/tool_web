# Tool Web

Tool Web 是一个个人工具网站, 目前包含 Todo 任务管理, Finance 个人记账, 用户认证, 自定义主题和帮助文档等模块. 项目面向 Web 用户和自动化 Agent 同时提供能力: 前端提供响应式交互界面, 后端暴露 RESTful API.

项目仍处于开发阶段, 当前前端已迁移为 Next.js + React + MUI, 通过 Next rewrites 将 `/api/*` 和 `/uploads/*` 代理到 FastAPI 后端.

## 功能

- **用户认证**: 登录, 注册, cookie-based JWT, token 自动刷新, 偏好设置同步.
- **Todo 任务管理**: 文件夹, 标签, 优先级, 子任务, 搜索筛选, 拖拽排序, 批量操作.
- **Finance 个人记账**: 多账本, 账户, 分类, 标签, 交易, 子交易, 预算, 事件, 图表统计.
- **自定义主题**: 亮色/暗色/Matcha/跟随系统, 用户上传 JSON 主题, 页面级 token 覆盖, 自定义按钮和脚本桥接.
- **国际化**: 中文和英文 JSON 词典.
- **响应式布局**: 桌面顶部栏, TODO 侧边栏, 移动端顶栏与抽屉式导航.
- **RESTful API**: FastAPI 后端, 统一认证与模块化路由.

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 16, React 19, TypeScript, MUI |
| 后端 | FastAPI, SQLAlchemy ORM, bcrypt, PyJWT |
| 数据库 | SQLite |
| 部署 | Docker Compose, Next.js, FastAPI |
| 测试 | pytest, TestClient |

## 项目结构

```text
tool_web/
├── backend/
│   ├── src/
│   │   ├── main.py              # FastAPI 入口: CORS, 路由注册, 中间件
│   │   ├── database.py          # 数据库连接, session 管理
│   │   ├── models/              # SQLAlchemy 模型
│   │   ├── schemas/             # Pydantic schema
│   │   ├── routers/             # auth / todo / folder / tag / finance / theme
│   │   ├── middleware/          # 认证和日志中间件
│   │   └── utils/               # 安全, 限流, 错误工具
│   ├── tests/                   # pytest 测试
│   ├── pyproject.toml
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next App Router 页面
│   │   ├── components/          # UI, layout, todo, finance, auth, settings
│   │   ├── context/             # AuthContext 登录态
│   │   ├── lib/                 # API client 与共享类型
│   │   └── theme.ts             # MUI 主题
│   ├── public/
│   ├── next.config.ts           # /api 与 /uploads 代理
│   ├── package.json
│   └── Dockerfile
├── docs/
│   ├── frontend.md              # 前端 Next.js 架构说明
│   ├── api.md
│   ├── auth.md
│   ├── finance.md
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
npm run build
```

```bash
cd backend
uv sync --extra dev
JWT_SECRET=test uv run python -m pytest tests/ -v
```

> 如果本地 `node_modules` 仍是旧依赖, 请先执行 `npm install` 以刷新依赖和 `package-lock.json`.

## 前端开发约定

- Next App Router 页面集中在 `frontend/src/app`.
- 全局 Provider, 主题注册和鉴权壳层放在 `frontend/src/app/layout.tsx`.
- 页面组件放在 `frontend/src/app`, 通用组件放在 `frontend/src/components`.
- API 统一通过 `frontend/src/lib/api.ts` 调用, 由 `frontend/next.config.ts` 代理到后端.

## 常用文档

- [前端架构](docs/frontend.md)
- [API 文档](docs/api.md)
- [认证模块](docs/auth.md)
- [Todo 模块](docs/todo.md)
- [Finance 模块](docs/finance.md)
- [主题系统](docs/theme.md)

## 未来规划

- 日历模块
- 联系人模块
- 周期总结模块
- 第三方登录, 2FA, CAPTCHA
- 更完整的主题编辑器和主题市场
- Agent 友好的 API 操作接口
- PWA 离线能力
