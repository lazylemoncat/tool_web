# Tool Web

Tool Web 是一个个人工具网站, 目前包含 Todo 任务管理, Finance 个人记账, 用户认证, 自定义主题和帮助文档等模块. 项目面向 Web 用户和自动化 Agent 同时提供能力: 前端提供响应式交互界面, 后端暴露 RESTful API.

项目仍处于开发阶段, 当前前端已从 Vite + React Router 迁移到 Umi, 以便后续通过路由配置, 全局布局, 运行时入口和页面级主题上下文来降低维护成本.

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
| 前端 | React 19, TypeScript, Umi 4, Axios, Radix UI, dnd-kit, Recharts |
| 后端 | FastAPI, SQLAlchemy ORM, bcrypt, PyJWT |
| 数据库 | SQLite |
| 部署 | Docker Compose, Nginx |
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
│   ├── .umirc.ts                # Umi 配置: 路由, history, API 代理
│   ├── src/
│   │   ├── app.tsx              # Umi 运行时入口: Provider, ErrorBoundary, themeBridge
│   │   ├── layouts/index.tsx    # 全局布局: 鉴权, i18n, 主题, 顶部栏
│   │   ├── pages/               # 页面级入口, 包含 TodoPage / Home / Finance 子页
│   │   ├── components/          # UI, layout, todo, finance, auth, settings
│   │   ├── context/             # AuthContext, ThemeContext, I18n alias
│   │   ├── hooks/               # 数据请求 hooks
│   │   ├── runtime/             # themeBridge
│   │   ├── styles/              # 全局样式和 design tokens
│   │   ├── theme.ts             # 基础主题模式
│   │   ├── themeEngine.ts       # 自定义主题运行时
│   │   └── i18n.tsx             # JSON 词典加载
│   ├── public/
│   ├── nginx.conf
│   ├── package.json
│   └── Dockerfile
├── docs/
│   ├── frontend.md              # 前端 Umi 架构说明
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
JWT_SECRET=<your-secret> docker compose up -d
```

浏览器访问 `http://localhost:8003`.

### 本地开发

启动后端:

```bash
cd backend
uv sync
uv run uvicorn src.main:app --host 0.0.0.0 --port 8001
```

后端运行在 `http://localhost:8001`, API 文档位于 `http://localhost:8001/docs`.

启动前端:

```bash
cd frontend
npm install
npm run dev
```

前端由 Umi dev server 启动, 默认运行在 `http://localhost:8000`. `.umirc.ts` 会将 `/api` 请求代理到后端 `http://localhost:8001`.

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

> 当前迁移要求安装 `umi` 后再运行前端构建. 如果本地 `node_modules` 仍是旧 Vite 依赖, 请先执行 `npm install` 以刷新依赖和 `package-lock.json`.

## 前端开发约定

- Umi 路由集中在 `frontend/.umirc.ts`.
- 全局 Provider 和 themeBridge 初始化放在 `frontend/src/app.tsx`.
- 鉴权, i18n, 主题模式, 自定义主题加载和顶部栏布局放在 `frontend/src/layouts/index.tsx`.
- 页面组件放在 `frontend/src/pages`, 通用组件放在 `frontend/src/components`.
- 路由相关 hook 统一从 `umi` 导入, 不再直接使用 `react-router-dom`.
- 自定义主题的页面级 key 来自 `frontend/src/utils/pageTheme.ts`, 例如 `todo`, `finance`, `settings`.

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
