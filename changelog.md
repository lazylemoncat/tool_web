# changelog

## 2026-06-22

### feat

-   新增 Focus 专注番茄钟模块, 前端 `/focus` 支持番茄钟,自由计时,暂停/继续,放弃保存,15 分钟休息,本地恢复,归档复盘,数据总览和记录筛选; 关联文件包括 `frontend/src/app/focus/page.tsx`, `frontend/src/components/focus/*`, `frontend/src/lib/focusTypes.ts`, `frontend/src/lib/api/focus.ts`.
-   新增后端 Focus 持久化能力, `FocusSession` 支持关联 Todo 文件夹和共享标签, 并提供 `/api/v1/focus/sessions` CRUD 与 `/api/v1/focus/summary` 统计接口; 关联文件包括 `backend/src/models/focus.py`, `backend/src/schemas/focus.py`, `backend/src/routers/focus.py`, `backend/migrations/versions/20260622_0003_focus_sessions.py`, `backend/tests/test_focus.py`.
-   顶部导航新增 `专注` 入口, 与现有导航管理配置合并逻辑兼容; 关联文件为 `frontend/src/components/layout/GlobalNav.tsx`.
-   完善 Focus 标签和记录管理, 侧边栏新增标签页, 计时/归档/编辑专注记录均支持多标签和新增标签, 记录页新增文件夹侧边栏与编辑弹窗; 关联文件包括 `frontend/src/app/focus/page.tsx`, `frontend/src/components/focus/FocusSidebar.tsx`, `frontend/src/components/focus/FocusTimer.tsx`, `frontend/src/components/focus/FocusArchiveDialog.tsx`, `frontend/src/components/focus/FocusRecords.tsx`, `frontend/src/components/focus/FocusSessionEditDialog.tsx`, `frontend/src/components/focus/FocusTagPicker.tsx`, `frontend/src/components/focus/FocusTags.tsx`.
-   放大并居中 Focus 90 天热力图, 热力图色阶改为复用 MUI 主题 token; 关联文件为 `frontend/src/components/focus/FocusOverview.tsx`.

### docs

-   新增 `docs/focus.md`, 并更新 `docs/README.md`, `docs/frontend.md`, `docs/api.md`, `README.md`, 记录 Focus 模块入口, 文件位置, API, 主题 token 约束和 MUI X `DatePicker` 日期筛选规范.
-   更新 `docs/focus.md`, `docs/frontend.md`, `docs/api.md`, 补充 Focus 标签页, 计时标签, 记录编辑, 文件夹侧边栏和热力图尺寸说明.

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
