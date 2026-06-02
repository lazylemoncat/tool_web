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

前端统一使用 `frontend/src/lib/api.ts` 的 `apiFetch` 调用后端. 请求默认携带 `credentials: "include"`, 以支持后端 httpOnly cookie 认证. 非认证接口遇到 401 会尝试调用 `/api/v1/auth/refresh` 后重试一次; 登录接口自身的 401 会直接透传后端错误消息, 不触发自动 refresh.

Next.js 代理规则在 `frontend/next.config.ts`:

- `/api/:path*` -> `API_PROXY_TARGET/api/:path*`
- `/uploads/:path*` -> `API_PROXY_TARGET/uploads/:path*`

本地开发默认 `API_PROXY_TARGET=http://localhost:8004`. Docker Compose 构建和运行前端容器时通过 `DOCKER_API_PROXY_TARGET` 设置代理目标, 默认是 `http://backend:8000`, 避免生产构建后的 rewrites 继续代理到前端容器内的 localhost.

## 已接入页面

- `login`: 调用 `POST /api/v1/auth/login`, 成功后从响应的 `user` 字段写入 `AuthContext`; 当后端返回 `mfa_required` 时, 登录页会进入验证码/恢复码验证步骤并调用 `POST /api/v1/auth/mfa/verify`.
- 全局登录态: 调用 `GET /api/v1/auth/me`, 从响应的 `user` 字段恢复登录态, 退出调用 `POST /api/v1/auth/logout`.
- 顶部导航: `GlobalNav` 通过当前 pathname 计算 active 状态, 首页精确匹配 `/`, Todo 匹配 `/todo` 及子路径, Finance 匹配 `/finance` 及子路径, 避免进入记账模块时任务入口被错误强调.
- MUI 样式传参: `Typography` 和 `slotProps` 中的子组件样式统一通过 `sx` 传入, 例如 `ListItemText.slotProps.primary.sx`, 避免把 `fontWeight`, `fontSize` 等样式字段直接作为组件 prop 导致 Next build 类型检查失败.
- MUI 主题覆写: `frontend/src/theme.ts` 中组件变体样式使用 `components.Mui*.variants`, 不把 `containedPrimary` 等旧 class key 写入 `styleOverrides`, 以匹配当前 MUI 类型.
- `/`: Material/MUI 工作台, 对齐 `index.html`; 支持 Todo/记账入口, 月度记账摘要, 最近任务, 管理模式, 添加/移除卡片, 导航管理和偏好设置弹窗.
- `/todo`: Material/MUI TODO 页面, 对齐 `todo.html`; 调用 folders, tags 和 todos 接口, 支持读取, 搜索, 状态/优先级/文件夹/标签筛选, 新建, 编辑, 删除, 切换完成, 多选批量完成/移动/删除, 文件夹新建/编辑/删除.
- TODO 侧边栏: 文件夹按后端返回的 `children` 递归渲染, 箭头向右表示收起, 向下表示展开; 新建子文件夹弹窗使用点击位置作为固定锚点, 避免输入时因行内按钮重排导致弹窗漂移.
- TODO 任务弹窗: 新建任务继承当前选中文件夹作为隐藏 `folder_id`, 不再显示所属文件夹下拉框; 标签输入使用 MUI Autocomplete 的 `renderValue` 渲染已选标签 Chip, 兼容当前 MUI 版本并避免未知 DOM prop warning.
- 日期选择: 前端日期选择器统一使用 MUI X `DatePicker`, 输入框显示格式通过 `format={DATE_PICKER_DISPLAY_FORMAT}` 控制, 共享常量位于 `frontend/src/lib/dateFormats.ts`.
- `/finance`: Material/MUI 记账页面, 对齐 `accounting.html`; 调用 ledgers, accounts, categories, tags, budgets, events, dashboard, stats, transactions, attachments 接口, 支持仪表盘, 交易筛选, 记一笔, 编辑/删除交易, 拆分交易, 上传附件, 关联待办, 账本/账户/分类/标签/预算/事件管理.
- Finance 仪表盘分类支出占比卡片: `CategoryDonut` 使用 MUI X `PieChart` 的 donut 模式并关闭内置图例, 仅保留右侧自绘图例; 图表容器固定 120px, 移动端改为上下排列, 避免默认图例挤压导致样式错乱.
- Finance 初始加载: `/api/v1/finance/ledgers` 失败时展示错误, 返回空数组时自动进入账本管理并结束 loading, 避免无账本用户无法创建第一个账本.

## 运行

```bash
cd frontend
npm install
npm run dev
```

开发服务默认运行在 `http://localhost:3000`, 后端本地服务默认运行在 `http://localhost:8004`.

Docker Compose 运行时前端暴露在 `http://localhost:8003`, 后端暴露在 `http://localhost:8004`.

生产发布由根目录 `deploy.sh` 构建并推送 frontend/backend 两个镜像. `docker-compose.prod.yml` 中前端镜像为 `${DOCKER_USER}/tool-web-frontend:latest`, 后端镜像为 `${DOCKER_USER}/tool-web-backend:latest`; 前端镜像构建和容器运行时都通过 `DOCKER_API_PROXY_TARGET` 注入 `API_PROXY_TARGET`, 默认访问 `http://backend:8000`.

## 验证

```bash
cd frontend
node node_modules\typescript\bin\tsc --noEmit
node node_modules\eslint\bin\eslint.js src
node node_modules\next\dist\bin\next build
```

认证页面受 `AuthGuard` 保护. 未登录浏览器访问 `/`, `/todo`, `/finance` 会进入登录流程; 对目标页面做视觉验收时需要先启动后端并使用有效账号登录.
