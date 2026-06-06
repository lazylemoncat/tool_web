# Tool Web 前端文档

## 功能概述

当前前端位于 `frontend/`, 已迁移为 Next.js + React + TypeScript + MUI. 主题风格明确采用 Material Design, 页面控件优先使用 MUI 的 `Box`, `Card`, `Button`, `Dialog`, `Drawer`, `Tabs`, `TextField`, `Select`, `Chip`, `Alert` 等组件. 首页、TODO 和 Finance 页面以根目录 `index.html`, `todo.html`, `accounting.html` 为视觉与交互基准重写, 并接入现有 FastAPI 后端.

## 目录结构

```text
frontend/
├── src/
│   ├── app/                  # Next App Router 页面
│   ├── components/           # 顶部导航, 主题注册, 登录守卫
│   ├── context/              # AuthContext 登录态, I18nContext 语言状态
│   ├── i18n/                 # 前端中文/英文文案词典
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
- 登录页视觉: `/login` 使用与注册页一致的低透明装饰圆背景, 440px `AuthCard`, 16px 圆角和顶部对齐内容; 登录表单使用外置字段标签, 50px 高度的 MUI outlined 输入框, 49px 主按钮, 以及自定义 22px 圆角 "记住我" 勾选框. 主题与语言入口位于页面右上角, 使用 Material 3 风格 Preference Chips, 主题偏好支持跟随系统/浅色/深色并保留后续多主题扩展配置, 语言菜单从 `supportedLocales` 派生以便后续扩展多语言.
- 登录页 i18n 与忘记密码: `frontend/src/context/I18nContext.tsx` 管理当前语言并持久化到 `localStorage` 的 `toolweb-language`; `frontend/src/i18n/messages.ts` 提供中文和英文词典. 表单校验, MFA, 常见认证 API 错误和忘记密码弹窗会随当前语言切换. "忘记密码?" 会打开 2FA 重置密码弹窗, 调用 `POST /api/v1/auth/password/reset`.
- 注册页视觉与交互: `/register` 以根目录 `register.html` 为基准, 使用带低透明装饰圆的 `AuthLayout`, 440px `AuthCard`, 外置字段标签, 四段密码强度条和 "创建账号" 按钮. 用户名达到 3 个字符后调用 `GET /api/v1/auth/username-availability` 实时提示是否可用; 密码强度旁的问号 tooltip 展示密码规则; 确认密码输入后实时提示是否一致. 注册成功后 `AuthContext.register()` 写入当前用户并跳转首页.
- 全局登录态: 调用 `GET /api/v1/auth/me`, 从响应的 `user` 字段恢复登录态, 退出调用 `POST /api/v1/auth/logout`.
- 顶部导航: `GlobalNav` 通过当前 pathname 计算 active 状态, 首页精确匹配 `/`, Todo 匹配 `/todo` 及子路径, Finance 匹配 `/finance` 及子路径, 避免进入记账模块时任务入口被错误强调.
- MUI 样式传参: `Typography` 和 `slotProps` 中的子组件样式统一通过 `sx` 传入, 例如 `ListItemText.slotProps.primary.sx`, 避免把 `fontWeight`, `fontSize` 等样式字段直接作为组件 prop 导致 Next build 类型检查失败.
- MUI 主题覆写: `frontend/src/theme.ts` 中组件变体样式使用 `components.Mui*.variants`, 不把 `containedPrimary` 等旧 class key 写入 `styleOverrides`, 以匹配当前 MUI 类型.
- `/`: Material/MUI 工作台, 对齐 `index.html`; 支持 Todo/记账入口, 月度记账摘要, 最近任务, 管理模式, 添加/移除卡片, 导航管理和偏好设置弹窗, 并在标题区显示当前项目版本.
- `/todo`: Material/MUI TODO 页面, 对齐 `todo.html`; 调用 folders, tags 和 todos 接口, 支持读取, 搜索, 状态/优先级/文件夹/标签筛选, 新建, 编辑, 删除, 切换完成, 多选批量完成/移动/删除, 文件夹新建/编辑/删除, 以及 `kanban` 模式文件夹的看板视图切换.
- TODO 侧边栏: 文件夹按后端返回的 `children` 递归渲染, 箭头向右表示收起, 向下表示展开; `mode: "kanban"` 的文件夹名称右侧显示看板图标; 新建子文件夹弹窗使用点击位置作为固定锚点, 避免输入时因行内按钮重排导致弹窗漂移.
- TODO 任务弹窗: 新建任务继承当前选中文件夹作为隐藏 `folder_id`, 不再显示所属文件夹下拉框; 标签输入使用 MUI Autocomplete 的 `renderValue` 渲染已选标签 Chip, 兼容当前 MUI 版本并避免未知 DOM prop warning.
- TODO Kanban 新建任务: 第一列的新增按钮复用任务弹窗, 并通过隐藏字段提交当前 `sprint_id` 和目标 `column_id`, 保存后按当前 sprint 刷新, 确保新任务立即出现在对应列.
- 日期选择: 前端日期选择器统一使用 MUI X `DatePicker`, 输入框显示格式通过 `format={DATE_PICKER_DISPLAY_FORMAT}` 控制, 共享常量位于 `frontend/src/lib/dateFormats.ts`.
- `/finance`: Material/MUI 记账页面, 对齐 `accounting.html`; 调用 ledgers, accounts, categories, tags, budgets, events, dashboard, stats, transactions, attachments 接口, 支持仪表盘, 交易筛选, 记一笔, 编辑/删除交易, 拆分交易, 上传附件, 关联待办, 账本/账户/分类/标签/预算/事件管理.
- Finance 仪表盘分类支出占比卡片: `CategoryDonut` 使用 MUI X `PieChart` 的 donut 模式并关闭内置图例, 仅保留右侧自绘图例; 图表容器固定 120px, 移动端改为上下排列, 避免默认图例挤压导致样式错乱.
- Finance 初始加载: `/api/v1/finance/ledgers` 失败时展示错误, 返回空数组时自动进入账本管理并结束 loading, 避免无账本用户无法创建第一个账本.

## Recent Todo Frontend Notes

- `frontend/src/components/layout/TodoSidebar.tsx` supports editable built-in views. Visible view ids are persisted in `localStorage` under `tool_web.todo.sidebar_views`.
- Todo sidebar view filters are built in `frontend/src/app/todo/page.tsx`: completed, today, and upcoming views map to explicit API query params, and sidebar selection updates the toolbar status filter to avoid stale filter state.
- Sidebar folder drag sorting only submits reorder requests for folders with the same `parent_id`.
- Todo task drag sorting only reorders siblings with the same `parent_id`; root tasks are handled by `TaskList`, and expanded child tasks are handled by `TaskDetail`.
- Kanban task creation hides the sprint selector in create mode and binds new cards to the currently active sprint. The Kanban board horizontal scrollbar is thicker for easier dragging.
- Workspace home reads `NEXT_PUBLIC_APP_VERSION`, injected from `frontend/package.json` by `frontend/next.config.ts`, and shows it as a compact version label.
- `frontend/src/components/shared/MarkerPicker.tsx` provides the shared pure-color or preset-emoji marker selector. Todo folder creation, Todo subfolder creation, and Finance category creation all use this component, and display markers through `MarkerIcon`.
- Finance categories use `icon_type` and `icon_value` in API payloads and responses. Emoji markers are selected from the preset dropdown, not entered as free text.

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
npm run test
node node_modules\typescript\bin\tsc --noEmit
node node_modules\eslint\bin\eslint.js src
node node_modules\next\dist\bin\next build
```

当前前端测试使用 Vitest, React Testing Library, jsdom 和 user-event. `npm run lint` 仍存在重构遗留 baseline 错误, 目前 CI 中作为非阻塞输出, 详见 `docs/testing.md`.

认证页面受 `AuthGuard` 保护. 未登录浏览器访问 `/`, `/todo`, `/finance` 会进入登录流程; 对目标页面做视觉验收时需要先启动后端并使用有效账号登录.
