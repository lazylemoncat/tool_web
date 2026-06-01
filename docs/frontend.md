# Tool Web 前端文档

## 功能概述

当前前端位于 `frontend/`, 已迁移为 Next.js + React + TypeScript + MUI. 主题风格明确采用 Material Design, 页面控件优先使用 MUI 的 `Box`, `Card`, `Button`, `Dialog`, `Drawer`, `Tabs`, `TextField`, `Select`, `Chip`, `Alert` 等组件. 首页、TODO 和 Finance 页面以根目录 `index.html`, `todo.html`, `accounting.html` 为视觉与交互基准重写, 并接入现有 FastAPI 后端.

## 目录结构

```text
frontend/
├── src/
│   ├── app/                  # Next App Router 页面
│   ├── components/           # 顶部导航, 主题注册, 登录守卫
│   ├── context/              # AuthContext 登录态
│   ├── lib/                  # API client 与前后端共享类型
│   └── theme.ts              # MUI 主题
├── public/                   # 静态资源
├── next.config.ts            # /api 与 /uploads 代理
├── package.json
└── Dockerfile
```

## 前后端通信

前端统一使用 `frontend/src/lib/api.ts` 的 `apiRequest` 调用后端. 请求默认携带 `credentials: "include"`, 以支持后端 httpOnly cookie 认证.

Next.js 代理规则在 `frontend/next.config.ts`:

- `/api/:path*` -> `API_PROXY_TARGET/api/:path*`
- `/uploads/:path*` -> `API_PROXY_TARGET/uploads/:path*`

本地开发默认 `API_PROXY_TARGET=http://localhost:8001`. Docker Compose 中设置为 `http://backend:8000`.

## 已接入页面

- `login`: 调用 `POST /api/v1/auth/login`.
- `register`: 调用 `POST /api/v1/auth/register`.
- 全局登录态: 调用 `GET /api/v1/auth/me`, 退出调用 `POST /api/v1/auth/logout`.
- `/`: Material/MUI 工作台, 对齐 `index.html`; 支持 Todo/记账入口, 月度记账摘要, 最近任务, 管理模式, 添加/移除卡片, 导航管理和偏好设置弹窗.
- `/todo`: Material/MUI TODO 页面, 对齐 `todo.html`; 调用 folders, tags 和 todos 接口, 支持读取, 搜索, 状态/优先级/文件夹/标签筛选, 新建, 编辑, 删除, 切换完成, 多选批量完成/移动/删除, 文件夹新建/编辑/删除.
- `/finance`: Material/MUI 记账页面, 对齐 `accounting.html`; 调用 ledgers, accounts, categories, tags, budgets, events, dashboard, stats, transactions, attachments 接口, 支持仪表盘, 交易筛选, 记一笔, 编辑/删除交易, 拆分交易, 上传附件, 关联待办, 账本/账户/分类/标签/预算/事件管理.

## 运行

```bash
cd frontend
npm install
npm run dev
```

开发服务默认运行在 `http://localhost:3000`, 后端本地服务默认运行在 `http://localhost:8001`.

Docker Compose 运行时前端暴露在 `http://localhost:8003`, 后端暴露在 `http://localhost:8001`.

## 验证

```bash
cd frontend
node node_modules\typescript\bin\tsc --noEmit
node node_modules\eslint\bin\eslint.js src
node node_modules\next\dist\bin\next build
```

认证页面受 `AuthGuard` 保护. 未登录浏览器访问 `/`, `/todo`, `/finance` 会进入登录流程; 对目标页面做视觉验收时需要先启动后端并使用有效账号登录.
