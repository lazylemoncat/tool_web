# 技术债清单

本文档是代码技术债的唯一事实来源 (SSOT). 何时修看 [`roadmap.md`](roadmap.md); 修复完成后删除条目并登记 [`changelog.md`](../changelog.md).

优先级定义:

- **P1**: 下次改动对应模块代码前先还清, 否则不一致会继续扩散.
- **P2**: 改到相关代码时顺手还.
- **P3**: 观察, 暂不行动.

## 前端

### TD-01 [P1] API 客户端三套组织方式并存

- 现状: `frontend/src/lib/api.ts` (约 20KB, 含 auth/todo/folder/tag/sprint/kanban-column/finance) 与 `frontend/src/lib/api/focus.ts`, `frontend/src/lib/api/kanbanTask.ts` 子目录, 以及 `frontend/src/components/calendar/calendarService.ts` (与组件同目录) 三种方式并存.
- 影响: 新模块无所适从, 每次新增都在加剧分裂; 巨型文件难以审阅.
- 建议: 统一收敛到 `lib/api/<模块>.ts`; `lib/api.ts` 按模块拆散后移除; `calendarService.ts` 迁入 `lib/api/calendar.ts`.
- 验收: `lib/api.ts` 不复存在; `components/` 下无 API service 文件; 所有模块的请求层位于 `lib/api/`.

### TD-02 [P1] 类型定义分裂

- 现状: `lib/types.ts`, `lib/financeTypes.ts`, `lib/focusTypes.ts` 在 `lib/` 下平铺, `components/calendar/calendarTypes.ts` 与组件同目录.
- 影响: 与 TD-01 同源, 新模块类型放置位置无约定.
- 建议: 统一为 `lib/types/<模块>.ts`; 与 TD-01 同批处理.
- 验收: 所有共享类型位于 `lib/types/`; `components/` 下无跨组件复用的类型文件.

### TD-03 [P2] Kanban 组件寄生在 Todo 目录

- 现状: Kanban 全部组件 (30+ 文件) 位于 `components/todo/kanban/`, 无独立页面, 由 `app/todo/page.tsx` 承载 (import 40+ 个 kanban 符号).
- 影响: Todo 页面文件臃肿; Kanban 的模块归属不清晰.
- 建议: 先在 [`todo.md`](todo.md) 明确 Kanban 是 Todo 的一种视图还是独立模块, 再决定是否提升为 `components/kanban/` + 独立路由.
- 验收: 文档明确归属; 目录结构与文档一致.

### TD-05 [P2] formatTodoDue 重复实现

- 现状: `components/todo/TaskItem.tsx` 与 `components/todo/TaskDetail.tsx` 各定义一份 `formatTodoDue`, 逻辑几乎相同, 仅空值返回不同 (`''` vs `'未设置'`).
- 建议: 合并为一份放入共享工具 (如 `components/todo/todoUtils.ts` 或 `lib/`), 空值文案由调用方决定.
- 验收: 全仓只有一份 `formatTodoDue` 定义.

### TD-06 [P2] 日期格式化散落且存在硬编码

- 现状: `components/finance/EventDetailDrawer.tsx` (formatDateTime), `components/finance/EventsTab.tsx` (formatEventDateTime), `components/calendar/dateUtils.ts` (formatDate) 各写各的; 其中 `calendar/dateUtils.ts` 硬编码 `'YYYY年M月D日'`, 而 `lib/dateFormats.ts` 已导出同值常量 `DATE_PICKER_DISPLAY_FORMAT` (违反 AGENTS.md 禁止硬编码规则).
- 建议: 格式字符串一律引用 `lib/dateFormats.ts` 常量; 通用格式化函数收敛到共享工具.
- 验收: 全仓 grep 无重复的日期格式字符串字面量.

### TD-10 [P3] 纯逻辑函数挂在组件文件导出

- 现状: `app/todo/page.tsx` 从 `components/todo/kanban/KanbanTaskDrawer.tsx` import `getKanbanSubtasks` — 纯数据逻辑从 Drawer 组件文件导出.
- 建议: 移入 kanban 工具模块 (如 `components/todo/kanban/kanbanUtils.ts`); 可与 TD-03 同批处理.
- 验收: 组件文件只导出组件与其 props 类型.

## 后端

### TD-04 [P2] Kanban URL 前缀三套不一致

- 现状: `/api/v1/kanban-columns` (连字符), `/api/v1/kanban/tasks` (子路径), `/api/v1/sprints` (无 kanban 前缀), 分别来自 `routers/kanban_column.py`, `routers/kanban_task.py`, `routers/sprint.py`.
- 影响: API 风格不统一, 外部调用方难以预测.
- 建议: 统一为 `/api/v1/kanban/*` 前缀; 属破坏性变更, 需与前端调用方 (TD-01 收敛后) 同批修改并更新 [`api.md`](api.md).
- 验收: Kanban 相关端点前缀统一; `api.md` 同步.

### TD-07 [P2] routers/finance.py 巨型文件

- 现状: `backend/src/routers/finance.py` 约 47KB, 为全仓最大文件, 承载账本/账户/分类/标签/交易/预算/事件/附件/统计全部端点.
- 建议: 按子域拆分为 `routers/finance/` 包 (accounts, transactions, budgets, events, stats 等), 路由前缀不变.
- 验收: 单文件不超过合理规模; 端点行为与 `api.md` 无变化, pytest 全绿.

### TD-08 [P1] Alembic 迁移编号规则未落实

- 现状: `migrations/versions/20260617_0003_calendar_events.py` 与 `20260622_0003_focus_sessions.py` 两个迁移都使用 `_0003` 序号; focus 迁移曾因 down_revision 指错造成 multi-head 启动事故 (changelog 2026-06-22 有记录), 已修复但编号冲突仍在.
- 影响: 新迁移编号有歧义, 有再次 multi-head 的风险.
- 建议: **不回改已应用迁移的文件名与 revision**; 在 `backend/migrations/README.md` 明确后续编号规则 (全局递增, 下一个为 `_0005`), 新迁移创建前先查看当前 head.
- 验收: 编号规则写入迁移目录 README; 后续新迁移遵守.

### TD-09 [P2] 两套限流器职责疑似重叠

- 现状: `utils/rate_limit.py` (全局中间件) 与 `auth/adapters/in_memory_rate_limiter.py` (auth 六边形架构专用适配器) 两份实现.
- 建议: 先调查各自调用方与限流维度, 确认是否真需两套; 若重叠, 保留一套并让 auth 适配器委托它.
- 验收: 调查结论记录在本条目或直接完成合并.
