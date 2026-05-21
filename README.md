# Tool Web

个人工具网站，从 Todo 任务管理起步，逐步加入日历、联系人、记账、总结等功能模块。项目向外暴露 RESTful API 接口，方便 Agent 自动或半自动操作数据。前端响应式适配，支持电脑、手机和平板等设备。

账号系统目前使用账号密码登录，未来接入第三方登录（OAuth）以及 2FA、验证码等增强保护。项目高度可自定义：主题颜色、按钮逻辑均可配置，甚至支持用户新增按钮，从网站下载模板修改后即可应用。

## 功能

- **用户认证** — JWT 登录/注册，多用户数据隔离，偏好设置云同步
- **文件夹分类** — 按自定义文件夹组织任务，支持颜色标记和拖拽排序
- **任务优先级** — 高 / 中 / 低三级优先级，支持按优先级筛选
- **子任务** — 支持无限层级子任务嵌套
- **搜索与筛选** — 防抖搜索，按状态、优先级组合筛选，分页查询
- **拖拽排序** — 任务和文件夹支持拖拽调整顺序
- **国际化** — 中/英文切换，基于 JSON 文件可轻松扩展新语言
- **主题切换** — 浅色 / 深色 / 跟随系统三种模式
- **响应式布局** — 适配桌面和移动端，侧边栏在移动端自动折叠
- **RESTful API** — 完整的 CRUD 接口，统一响应格式，预留扩展空间

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19, TypeScript, Vite, Axios, @dnd-kit |
| 后端 | FastAPI (Python), SQLAlchemy ORM, bcrypt, PyJWT |
| 数据库 | SQLite |
| 部署 | Docker Compose, Nginx |
| 测试 | pytest, TestClient |

## 项目结构

```
tool_web/
├── backend/
│   ├── src/
│   │   ├── main.py              # FastAPI 入口: CORS, 路由注册, 中间件
│   │   ├── database.py          # 数据库连接、session 管理、迁移、种子数据
│   │   ├── models/
│   │   │   ├── todo.py          # Folder, Todo 模型 (自引用子任务, user_id)
│   │   │   └── user.py          # User 模型
│   │   ├── schemas/
│   │   │   ├── todo.py          # Pydantic 模型 (含分页、通用排序)
│   │   │   └── auth.py          # 认证请求/响应模型
│   │   ├── routers/
│   │   │   ├── auth.py          # /api/v1/auth: register, login, me, preferences
│   │   │   ├── todo.py          # /api/v1/todos: CRUD + 排序 + 切换状态
│   │   │   └── folder.py        # /api/v1/folders: CRUD + 排序
│   │   ├── middleware/
│   │   │   ├── auth.py          # JWT 认证依赖
│   │   │   └── logging.py       # 请求日志中间件
│   │   └── utils/
│   │       ├── security.py      # bcrypt 密码哈希, JWT 创建/解码
│   │       ├── rate_limit.py    # 内存 IP 限流器
│   │       └── errors.py        # 统一异常类
│   ├── tests/                   # pytest 测试套件
│   ├── pyproject.toml
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # 主应用: 状态管理, 数据流, 错误边界
│   │   ├── theme.ts             # 主题系统
│   │   ├── i18n.tsx             # 国际化 (JSON 文件懒加载)
│   │   ├── api/client.ts        # Axios 封装, 统一响应解包
│   │   ├── context/AuthContext.tsx
│   │   ├── components/
│   │   │   ├── auth/AuthPage.tsx
│   │   │   ├── layout/          # Header, Sidebar
│   │   │   ├── todo/            # TodoList, TodoItem, TodoForm, SubTaskList
│   │   │   ├── common/          # SearchBar, PriorityTag, ErrorBoundary, Toast
│   │   │   └── settings/SettingsPage.tsx
│   │   ├── hooks/               # useTodos, useFolders
│   │   ├── locales/             # zh.json, en.json (可扩展语言)
│   │   └── styles/index.css
│   ├── nginx.conf               # 生产环境 Nginx 配置 (API 反向代理)
│   ├── vite.config.ts           # 开发环境 API 代理
│   └── Dockerfile               # 多阶段构建 (Node + Nginx)
├── docker-compose.yml           # 一键启动
├── docker-compose.prod.yml      # 生产环境
├── .env.example                 # 环境变量模板
└── docs/api.md                  # API 详细文档
```

## 快速开始

### 环境变量

```bash
cp .env.example .env
# 编辑 .env，填入 JWT_SECRET（必需）和其他可选配置
```

### 方式一: Docker Compose (推荐)

```bash
JWT_SECRET=<your-secret> docker compose up -d
```

浏览器访问 `http://localhost:8003`。

### 方式二: 本地开发

**启动后端** (需要 Python 3.12+, 使用 uv 管理依赖):

```bash
cd backend
uv sync
uv run uvicorn src.main:app --host 0.0.0.0 --port 8001
```

后端运行在 `http://localhost:8001`，API 文档自动生成在 `/docs` (Swagger UI)。

**启动前端** (需要 Node.js 22+):

```bash
cd frontend
npm install
npm run dev
```

前端运行在 `http://localhost:5173`，Vite 自动将 `/api` 请求代理到后端 `8001` 端口。

**运行测试:**

```bash
cd backend
uv sync --extra dev
JWT_SECRET=test uv run python -m pytest tests/ -v
```

## API 接口

认证接口:

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/register` | 注册新用户 |
| POST | `/api/v1/auth/login` | 用户登录，返回 JWT |
| GET | `/api/v1/auth/me` | 获取当前用户信息 |
| PUT | `/api/v1/auth/preferences` | 更新用户偏好 |

功能接口（需 Bearer Token）:

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/folders` | 获取文件夹列表（支持 skip/limit） |
| POST | `/api/v1/folders` | 创建文件夹 |
| PUT | `/api/v1/folders/{id}` | 更新文件夹 |
| DELETE | `/api/v1/folders/{id}` | 删除文件夹 (级联删除) |
| POST | `/api/v1/folders/reorder` | 批量排序 |
| GET | `/api/v1/todos` | 获取任务列表 (支持 folder_id/search/priority/status/skip/limit) |
| POST | `/api/v1/todos` | 创建任务 (支持 parent_id 子任务) |
| PUT | `/api/v1/todos/{id}` | 更新任务 |
| DELETE | `/api/v1/todos/{id}` | 删除任务 (级联删除子任务) |
| PATCH | `/api/v1/todos/{id}/toggle` | 切换完成状态 |
| PATCH | `/api/v1/todos/{id}/reorder` | 调整排序位置 |
| POST | `/api/v1/todos/reorder` | 批量排序 |

响应格式：直接返回数据模型 JSON，错误时返回 `{"detail":"..."}`。

## 未来规划

- [ ] **日历模块** — 日历视图，按日期查看/管理任务
- [ ] **联系人模块** — 通讯录管理
- [ ] **记账模块** — 收支记录与统计
- [ ] **总结模块** — AI 辅助的周期性总结
- [ ] **第三方登录** — OAuth (Google, GitHub 等)
- [ ] **安全增强** — 2FA, 验证码 (CAPTCHA)
- [ ] **高度自定义** — 用户自定义主题、按钮、模板下载
- [ ] **Agent 集成** — API 面向 AI Agent 优化，支持自动/半自动操作
- [ ] **PWA 支持** — 离线访问、桌面快捷方式
