# Todo System Polish & Task Detail View Design

## Context

Audit of the todo/task management system revealed 30 issues across critical bugs (5),
important improvements (10), and minor polish items (15). Additionally, a new
task detail view feature is requested: a "?" icon that opens a read-only modal
showing all task metadata.

## Design

### A. Critical Bug Fixes

**C1 — Replace hardcoded Chinese with i18n**

Affected strings and their replacement keys:
- Swipe buttons "编辑"/"删除" → `t('app.edit')` / `t('app.delete')`
- Recurrence presets → `recurrence.daily`, `recurrence.weekly`, `recurrence.weekdays`, `recurrence.weekends`, `recurrence.monthly`
- Recurrence UI labels → `recurrence.enable`, `recurrence.custom`, `recurrence.addRule`
- Preference for RRULE display: human-readable description (e.g. "Every weekday") shown alongside raw string

New i18n keys in zh.json/en.json under `"recurrence"` namespace.

**C2 — Folder deletion shows data count**

Frontend-only fix. Sidebar already has `FolderOut.todo_count` from the GET response. The
confirmation dialog reads this existing data: "确定删除文件夹 '{name}'? 该文件夹包含 {folder.todo_count} 个任务, 删除后不可恢复." Also display count of child folders from `folder.children.length`. No backend change needed.

**C3 — Validate parent_id/folder_id ownership on create/update**

In `POST/PUT /api/v1/todos`: if `folder_id` is set, verify `Folder.id == folder_id AND Folder.user_id == current_user.id`. If `parent_id` is set, verify `Todo.id == parent_id AND Todo.user_id == current_user.id`. Return 400 with `"Folder not found"` or `"Parent todo not found"` on failure.

**C4 — Recursive optimistic toggle for subtasks**

`useTodos.toggleTodo` optimistic update uses a recursive helper: `updateNestedTodo(todos, id)` that
depth-first searches through `children` arrays and flips `is_completed` on the match.

**C5 — Fix recurring subtask parent assignment**

In `toggle_todo` recurrence logic: after generating the next instance, if `todo.parent_id` is set,
check if `parent.is_completed`. If parent is completed → set `new_todo.parent_id = None`.
If parent is active → keep original `parent_id`.

### B. Important Improvements

**I1 — Locale-aware date formatting**

`TodoItem.tsx`: `date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {month:'short', day:'numeric'})`.
Fallback for dates >2 days: same locale-aware format.

**I2 — Normalize sort_order on single reorder**

`PATCH /todos/{id}/reorder`: after updating the target todo's sort_order, renumber all
siblings in the same parent group as 0, 1, 2, ...

**I3 — Validate RRULE strings on create/update**

`TodoCreate.recurrence_rules` and `TodoUpdate.recurrence_rules`: add `@field_validator` that
calls `dateutil.rrule.rrulestr()` per entry. Invalid rules raise `ValueError("Invalid RRULE: ...")`.

**I4 — Add missing `tag.add` i18n key**

zh.json: `"tag.add": "添加标签"`, en.json: `"tag.add": "Add tag"`.

**I5 — Recursive optimistic reorder for subtasks**

Same recursive pattern as C4: `reorderTodos` optimistic update walks `children` arrays.

**I6 — Search includes note field**

`GET /todos?search=` changes filter from `Todo.title.contains(q)` to
`(Todo.title.ilike(q) | Todo.note.ilike(q))`.

**I7 — Paginated response with total count**

`GET /todos` response format changes from `list[TodoOut]` to
`{"items": [...], "total": N, "skip": S, "limit": L}` using the existing `PaginatedResponse` schema.

**I8 — URL-synced filter state**

TodoApp uses `useSearchParams()` from react-router-dom. Filter changes update URL query params:
`?folder_id=&search=&status=&priority=&tag_id=`. On mount, state initializes from URL params.
Browser back/forward preserves filter history.

**I9 — Folder rename UI**

Sidebar folder items: hover reveals an edit (pencil) icon alongside the existing delete icon.
Click opens an inline input pre-filled with the current name. Enter or blur saves via
`PUT /folders/{id}`. Escape cancels.

**I10 — Bulk operations**

Toolbar gains a "Select" toggle button. When active:
- Each TodoItem shows a selection checkbox
- Selected count display appears
- Bottom action bar: "Complete selected" / "Delete selected" / "Move to folder"
- API: new `POST /api/v1/todos/bulk` endpoint accepting `{ids: [...], action: 'complete'|'delete'|'move', folder_id?: int}`

### C. Minor Polish

| ID | Fix |
|----|-----|
| M1 | CRUD failures: call `ToastContext.error(displayError(err))` from all todo/folder hooks |
| M2 | Todo delete: confirmation dialog "确定删除任务 '{title}'?" before calling onDelete |
| M3 | Toggle parent completion: add optional `complete_children: bool = False` body param; if true, recursively mark all children as completed |
| M4 | N+1 query: `GET /todos` uses `selectinload(Todo.children).selectinload(Todo.tags).selectinload(Todo.recurrence_rules)`; `GET /folders` uses `selectinload(Folder.children)` |
| M5 | Folder.color column: `String(7)` → `String(9)`, no regex constraint change |
| M6 | TagInput debounce: 150ms → 300ms |
| M7 | Tag model: add `UniqueConstraint('user_id', 'name')` |
| M8 | Normalize sort_order after delete: before committing deletion, renumber remaining siblings |
| M9 | Expand/collapse icons: use `t('todo.expand')` / `t('todo.collapse')` text alongside the triangle glyph |
| M10 | Composite indexes: add `Index('idx_todos_user_parent', Todo.user_id, Todo.parent_id)` and `Index('idx_todos_user_folder_status', Todo.user_id, Todo.folder_id, Todo.is_completed)` |
| M11 | Batch reorder: validate all IDs share same `parent_id` (all root or all same parent), return 400 if mixed |
| M12 | Drag activation: PointerSensor distance 5→8, TouchSensor delay remains 200ms |
| M13 | Keyboard shortcuts: `N` → new task, `/` → focus search, `Escape` → close modal. Use `useEffect` with `keydown` listener in TodoApp |
| M14 | TodoCreate.note: add `max_length=10000` |
| M15 | Remove `as any` cast: define `TodoFormData` interface matching the form output, use in `handleEditTodo` |

### D. Task Detail Modal (New Feature)

**Component**: `frontend/src/components/todo/TaskDetail.tsx`

**Props**: `todo: Todo`, `onClose: () => void`, `onEdit: (todo: Todo) => void`

**Trigger**: A "?" icon button in `TodoItem.tsx` action buttons area, between the add-subtask and
delete buttons. Uses unicode `ℹ` or a CSS-styled `?` badge.

**Modal layout** (read-only, similar to TodoForm modal but without input fields):

```
┌─────────────────────────────────┐
│ ℹ 任务详情                  [X] │  ← header with close button
├─────────────────────────────────┤
│ 标题: 买猫粮                     │
│ 状态: ● 未完成                   │
│ 优先级: [高] #e07050             │
│ 文件夹: 📁 生活                  │
│ 父任务: 每周采购  (可点击跳转)    │
│ 截止日期: 2026-05-20 (后天)      │
│ 标签: [购物] [宠物]              │
├─────────────────────────────────┤
│ 备注:                           │
│ 皇家猫粮, 2kg装                  │
│ 需要去宠物店买, 不在超市买        │
├─────────────────────────────────┤
│ 🔁 重复规则:                     │
│ • 每工作日 (FREQ=WEEKLY;BYDAY=...)│
├─────────────────────────────────┤
│ 子任务 (2/3 已完成):             │
│ ✓ 查看价格                       │
│ ✓ 确认库存                       │
│ ○ 下单购买                       │
├─────────────────────────────────┤
│ 创建时间: 2026-05-10 14:30      │
│ 更新时间: 2026-05-15 09:12      │
│ 完成时间: —                      │
├─────────────────────────────────┤
│          [编辑]  [关闭]          │  ← footer buttons
└─────────────────────────────────┘
```

**Data fetching**: The `Todo` object already contains all data (children, tags, recurrence_rules
are embedded in the backend response via `_build_todo_out`). No additional API call needed.

**RRULE display**: Use a helper function `describeRRule(rrule_string: string): string` that
parses common patterns into human-readable descriptions in the current locale:
- `FREQ=DAILY` → "每天" / "Daily"
- `FREQ=WEEKLY;BYDAY=MO,WE,FR` → "每周一、三、五" / "Mon, Wed, Fri"
- Fallback: show raw RRULE string

**Subtask display**: Non-interactive list. Shows checkbox state (✓/○) + title. No drag, no
expand/collapse, no action buttons. Read-only.

**Footer buttons**:
- "编辑" (pencil icon) → calls `onEdit(todo)` which opens TodoForm in edit mode
- "关闭" → calls `onClose()`

**Integration in App.tsx**:
- New state: `detailTodo: Todo | null`
- When set, renders `<TaskDetail todo={detailTodo} onClose={() => setDetailTodo(null)} onEdit={...} />`
- `onEdit` closes detail modal and opens TodoForm with the same todo

## Implementation Order

| Phase | Items | Rationale |
|-------|-------|-----------|
| Phase 1: Backend fixes | C2, C3, C5, I2, I3, I6, I7, M3, M4, M5, M7, M8, M10, M11, M14, I10 (bulk endpoint) | Foundation — API must be correct first |
| Phase 2: Frontend fixes | C1, C4, I1, I4, I5, I8, I9, M1, M2, M6, M9, M12, M13, M15 | Depends on backend being stable |
| Phase 3: Task detail modal | D (all) | New component, depends on phase 2 for TodoItem integration |
| Phase 4: Bulk ops UI | I10 (frontend) | New interaction patterns, depends on phase 1 bulk endpoint |
| Phase 5: Docs | Update todo.md | After all changes |

## Files Summary

**Backend (8 files)**:
- `routers/todo.py` — C2 (folder count), C3 (validation), C5 (recurring subtask), I2 (normalize), I6 (search), I7 (paginated), I10 (bulk), M3 (complete_children), M4 (eager load), M8 (normalize delete), M11 (batch validate)
- `routers/folder.py` — M4 (eager load)
- `schemas/todo.py` — I3 (rrule validate), I7 (paginated response), M14 (note max_length)
- `models/todo.py` — M5 (color length), M10 (indexes)
- `models/tag.py` — M7 (unique constraint)
- `database.py` — migration for new columns/indexes
- `locales/zh.json` — C1, I4, recurrence keys, task detail keys
- `locales/en.json` — same

**Frontend (10 files)**:
- `hooks/useTodos.ts` — C4 (recursive toggle), I5 (recursive reorder), M1 (toast)
- `hooks/useFolders.ts` — M1 (toast)
- `components/todo/TodoItem.tsx` — C1 (i18n), I1 (date), M2 (confirm delete), M9 (expand icons), M12 (drag distance), task detail trigger
- `components/todo/TodoForm.tsx` — C1 (i18n), I3 (rrule error display)
- `components/todo/TagInput.tsx` — M6 (debounce)
- `components/todo/TodoList.tsx` — I10 (bulk select checkboxes)
- `components/layout/Sidebar.tsx` — I9 (folder rename), C2 (delete confirmation)
- `components/todo/TaskDetail.tsx` — D (new component)
- `App.tsx` — I8 (URL sync), M13 (keyboard shortcuts), I10 (bulk action bar), task detail modal integration
- `styles/index.css` — task detail modal, bulk action bar, folder rename input

## Verification

1. All hardcoded Chinese strings removed; switching locale changes all UI text
2. Folder delete shows accurate task/folder counts; cancelling does nothing
3. Creating todo with invalid folder_id returns 400
4. Toggling a subtask shows instant visual feedback (checkbox changes)
5. Completing recurring subtask with completed parent creates standalone root task
6. Search finds tasks by note content
7. API returns `{items, total, skip, limit}` for paginated todo list
8. Filters survive page refresh (URL params)
9. Folder can be renamed via inline edit in sidebar
10. Bulk select → complete/delete/move works end-to-end
11. Delete todo shows confirmation dialog; confirm deletes, cancel does nothing
12. "?" icon opens task detail modal with all fields; "编辑" button switches to edit mode
13. Keyboard shortcuts: N opens new task form, / focuses search
14. N+1 query resolved: single request loads children+tags+recurrence
15. `docs/todo.md` reflects all changes
