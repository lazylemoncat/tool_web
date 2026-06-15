# changelog

## 2026-06-15

### fix

-   删除工作台偏好设置中的紧凑模式和未接入的占位配置,仅保留已生效的深色模式切换; 关联文件: `frontend/src/components/layout/SettingsDialog.tsx`.
-   修复 Finance 账本,账户,分类,标签和预算删除流程依赖原生 `window.confirm` 的问题,统一改为共享确认弹窗; 关联文件: `frontend/src/components/finance/AccountsTab.tsx`, `frontend/src/components/finance/BooksTab.tsx`, `frontend/src/components/finance/CategoriesTab.tsx`, `frontend/src/components/finance/TagsTab.tsx`, `frontend/src/components/finance/BudgetsTab.tsx`, `frontend/src/components/shared/ConfirmDialog.tsx`.
-   修复 Kanban Sprint 弹窗仍使用原生日期输入的问题,改为 MUI X `DatePicker` 和共享日期格式; 关联文件: `frontend/src/components/todo/kanban/SprintDialog.tsx`.
-   清理前端 lint baseline,补齐可访问性标签,移除未使用代码并修正 hook 依赖; 关联文件: `frontend/src/app/todo/page.tsx`, `frontend/src/components/layout/GlobalNav.tsx`, `frontend/src/components/workspace/CardGrid.tsx`, `frontend/src/components/todo/kanban/*`.

### refactor

-   新增共享 `DialogHeader`,统一 Finance,Todo,导航管理和偏好设置弹窗标题区,移除多处重复渐变标题实现; 关联文件: `frontend/src/components/shared/DialogHeader.tsx`, `frontend/src/components/finance/*`, `frontend/src/components/todo/*`, `frontend/src/components/layout/*`.
-   将 Finance 交易筛选栏改为 MUI `TextField`, `ToggleButtonGroup` 和 `MenuItem` 控件组合,提升主题一致性和键盘可用性; 关联文件: `frontend/src/components/finance/Transactions/FilterBar.tsx`.
-   Finance 和工作台首页初始加载改为结构化骨架屏,应用壳层和满屏业务页高度改用 `100dvh`; 关联文件: `frontend/src/components/finance/FinancePageSkeleton.tsx`, `frontend/src/components/workspace/WorkspaceSkeleton.tsx`, `frontend/src/app/finance/page.tsx`, `frontend/src/components/workspace/WorkspaceHome.tsx`, `frontend/src/theme.ts`.
-   全局字体改用 Next.js `next/font/google` 加载 `Plus Jakarta Sans`,避免在 layout 中手写外部字体链接; 关联文件: `frontend/src/app/layout.tsx`, `frontend/src/theme.ts`.

### chore

-   前端 ESLint 忽略构建和原型产物目录,并将 GitHub Actions 中 `npm run lint` 恢复为阻塞质量检查; 关联文件: `frontend/eslint.config.mjs`, `.github/workflows/dev-test-deploy.yml`, `.github/workflows/release-build-run.yml`.

### docs

-   更新前端,记账,测试,GitHub Actions 和 README 文档,记录紧凑模式移除,共享弹窗规范,骨架屏加载,`100dvh` 页面高度以及 lint baseline 已清理; 关联文件: `README.md`, `docs/frontend.md`, `docs/finance.md`, `docs/testing.md`, `docs/github-actions.md`.

## 2026-06-14

### feat

-   记账模块交易记录支持按标签下拉筛选, `frontend/src/components/finance/Transactions/FilterBar.tsx` 新增标签筛选控件, `frontend/src/components/finance/TransactionsTab.tsx` 按标签 ID 过滤并支持关键词匹配标签名称.
-   记账模块账本和账户管理改为拖拽排序,移除上移/下移点击排序按钮,并保留现有 reorder API 持久化.
-   顶部导航管理改为可持久化配置,支持模块顺序,显示状态和名称调整,导航栏读取同一份配置.

### fix

-   修复浅深色主题切换时大部分组件仍显示浅色 surface 的问题,将 MUI 全局输入框,菜单,弹窗,列表选中态以及记账模块,工作区首页,Todo 看板和日历中性背景改为主题 token; 关联文件包括 `frontend/src/theme.ts`, `frontend/src/components/finance/*`, `frontend/src/components/todo/kanban/*`, `frontend/src/components/workspace/WorkspaceHome.tsx`, `frontend/src/components/calendar/CalendarPage.tsx`.
-   删除记账模块排序控件中的可见拖拽文本,分类,标签和预算仅保留排序手柄和拖拽反馈.
-   修复导航管理弹窗仅维护本地状态但不影响顶部导航的问题.

### docs

-   更新 `docs/finance.md` 和 `docs/theme.md`,记录交易记录标签筛选实现位置,主题 token 使用约束以及本次深浅色切换修复影响范围.
-   在 `docs/frontend.md` 和 `docs/finance.md` 补充 Material + microinteractions 风格要求,并明确多文件夹,账本,账户,分类,标签和预算等排序需求优先使用拖拽排序.
-   新增 `docs/README.md` 作为项目文档索引,集中整理根目录文档,模块文档,项目流程文档,历史方案,UML 和零散记录入口.
-   更新 `README.md`,修正项目结构缩进,补充完整常用文档入口.
-   标记 `product.md` 为历史 PRD,修正 `product2.md` 中旧 Umi/Radix/Nginx 技术栈为当前 Next.js/React/MUI/Next rewrites 描述.
-   清理 `docs/api.md`, `docs/auth.md`, `docs/frontend.md`, `docs/finance.md`, `docs/theme.md`, `docs/todo.md`, `docs/github-actions.md`, `docs/uml/index.md` 和前端组件 UML 图中的过期标题,路径和技术栈描述.
-   将 `todo/login.md` 与 `todo/register.md` 归档为已完成历史待办清单.

## 2026-06-12

### feat

-   将记账分类,标签和预算管理的顺序调整改为拖拽排序,并继续通过现有 reorder API 持久化.
-   记账表单支持多选交易标签,支持上传多个附件并通过 `attachment_ids` 关联到交易.
-   交易详情抽屉展示已关联附件,可点击打开上传文件.
-   创建 Todo 子文件夹时,默认继承父文件夹的颜色或 emoji 标识.

### fix

-   修复记账移动端导航中选择账本后抽屉未关闭的问题.

### docs

-   在 `AGENTS.md` 增加变更必须同步写入 `changelog.md` 的规则,明确记录日期,变更类型,影响范围和关联文件.
-   完善 `project_flow/1_project_idea.md`,补充 Tool Web 的项目定位,目标用户,问题边界,替代方案和成功标准.
-   完善 `project_flow/2_architecture.md`,补充当前架构选择,模块划分,依赖方向,架构约束和未来扩展点.
-   完善 `project_flow/sprints/MVP_sprint.md` 和 `project_flow/sprints/sprint1.md`,补充迭代目标,核心用户路径,范围边界,技术边界和验收清单.
