# changelog

## 2026-06-21

### chore

-   新增 Windows 本地开发一键启动脚本 `start-local-dev.bat`,可分别打开后端 FastAPI 和前端 Next.js dev server 命令行窗口,并支持 `--check` 进行启动前依赖检查.影响范围:本地开发启动流程.关联文件: `start-local-dev.bat`, `README.md`.

### docs

-   更新本地开发说明,记录 Windows 一键启动脚本的入口,前后端端口和依赖检查行为.影响范围:开发文档.关联文件: `README.md`, `changelog.md`.

## 2026-06-18

### feat

-   任务模块新增可选截止时间字段 `due_time`,前端任务弹窗支持在截止日期外选择时间,后端持久化后在日历中按全天/非全天事件同步展示.
-   记账模块交易表单新增发生日期和发生时间选择,交易列表筛选新增开始/结束日期 DatePicker,记账事件新增开始/结束时间选择并随日历来源展示.

### fix

-   修复日历模块深色主题下日期数字使用硬编码深色导致可读性过低的问题,改为复用 MUI 主题文本 token;同时移除月视图和周视图中周末日期的额外淡化显示.关联文件: `frontend/src/components/calendar/CalendarPage.tsx`, `docs/calendar.md`.

## 2026-06-17

### feat

-   日历模块移除前端 mock 数据,新增 `/api/v1/calendar/*` 后端 API 和 `calendar_events` 持久化表,手动日历事件支持按用户隔离创建,编辑,删除和刷新后保留.
-   日历事件列表改为聚合真实 Todo 到期日,Finance 收支交易和 Finance 记账事件,并保留这些来源在日历中的只读展示边界.

### fix

-   删除日历页面中的硬编码节假日和伪农历标签,节假日仅在后端提供真实事件时展示.

### docs

-   更新 `docs/calendar.md` 和 `docs/api.md`,记录日历真实数据来源,持久化模型,API 端点和只读来源规则.

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
