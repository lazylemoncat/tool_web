# Todo System Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 30 audit issues (5 critical, 10 important, 15 minor) across the todo/task system and add a read-only task detail modal triggered by a "?" icon on each task item.

**Architecture:** Backend fixes (validation, pagination, N+1 queries, bulk endpoint, indexes, RRULE validation) come first, then frontend fixes (i18n, optimistic updates, toast errors, URL-synced filters, folder rename UI, keyboard shortcuts), then new TaskDetail modal component, then bulk operation UI, finally docs update.

**Tech Stack:** FastAPI (Python 3.12), SQLAlchemy 2.0, React 19, TypeScript, dnd-kit, Axios

---

### Task 1: Backend models — M5, M7, M10 (color length, tag unique constraint, composite indexes)

**Files:** `backend/src/models/todo.py`, `backend/src/models/tag.py`, `backend/src/database.py`

- [ ] **Step 1: Update Folder.color column length**

In `backend/src/models/todo.py`, change `String(7)` to `String(9)` on the `color` column of `Folder`:
```python
color = Column(String(9), default="#6366f1")
```

- [ ] **Step 2: Add UniqueConstraint to Tag model**

In `backend/src/models/tag.py`, add to imports:
```python
from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, Table
```

Add `__table_args__` to the `Tag` class:
```python
class Tag(Base):
    __tablename__ = "tags"
    __table_args__ = (UniqueConstraint("user_id", "name"),)
    # ... existing columns
```

- [ ] **Step 3: Add composite indexes to Todo model**

In `backend/src/models/todo.py`, add to imports:
```python
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Text, ForeignKey, Index
```

Add `__table_args__` to the `Todo` class:
```python
class Todo(Base):
    __tablename__ = "todos"
    __table_args__ = (
        Index("idx_todos_user_parent", "user_id", "parent_id"),
        Index("idx_todos_user_folder_status", "user_id", "folder_id", "is_completed"),
    )
```

- [ ] **Step 4: Add migration for tag unique constraint and indexes**

In `backend/src/database.py` `_migrate_schema()`, after the existing column checks:

```python
    # Task 1: Create unique index on tags(user_id, name) if not exists
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='index' AND name='uq_tags_user_name'")
        ).first()
        if not result:
            logger.info("Migrating schema: adding unique constraint on tags(user_id, name)")
            conn.execute(
                text("CREATE UNIQUE INDEX uq_tags_user_name ON tags(user_id, name)")
            )
            conn.commit()

    # Composite indexes for todos
    with engine.connect() as conn:
        for idx_name, idx_sql in [
            ("idx_todos_user_parent", "CREATE INDEX idx_todos_user_parent ON todos(user_id, parent_id)"),
            ("idx_todos_user_folder_status", "CREATE INDEX idx_todos_user_folder_status ON todos(user_id, folder_id, is_completed)"),
        ]:
            result = conn.execute(
                text(f"SELECT name FROM sqlite_master WHERE type='index' AND name='{idx_name}'")
            ).first()
            if not result:
                logger.info(f"Migrating schema: creating index {idx_name}")
                conn.execute(text(idx_sql))
                conn.commit()
```

- [ ] **Step 5: Verify and commit**

```bash
cd backend && .venv/Scripts/python.exe -c "from src.database import init_db; init_db(); print('Migration OK')"
git add backend/src/models/todo.py backend/src/models/tag.py backend/src/database.py
git commit -m "feat: add composite indexes, tag unique constraint, folder color length 9"
```

---

### Task 2: Backend schemas — I3 (RRULE validate), I7 (paginated), M14 (note max_length), I10 (bulk schemas)

**Files:** `backend/src/schemas/todo.py`

- [ ] **Step 1: Read current schemas/todo.py and apply changes**

Add imports:
```python
from dateutil.rrule import rrulestr
```

Update `TodoCreate`:
```python
class TodoCreate(BaseModel):
    folder_id: Optional[int] = None
    parent_id: Optional[int] = None
    title: str = Field(min_length=1, max_length=500)
    note: Optional[str] = Field(None, max_length=10000)
    priority: int = Field(default=2, ge=1, le=3)
    due_date: Optional[date] = None
    sort_order: int = 0
    tag_ids: list[int] = []
    recurrence_rules: list[str] = []

    @field_validator("recurrence_rules")
    @classmethod
    def validate_rrules(cls, v: list[str]) -> list[str]:
        for r in v:
            try:
                rrulestr(r)
            except (ValueError, TypeError):
                raise ValueError(f"Invalid RRULE: {r}")
        return v
```

Update `TodoUpdate.recurrence_rules` to `Optional[list[str]] = None` and add same validator (skip if None).

Update `GET /todos` response to use `PaginatedResponse`:
```python
class TodoListResponse(BaseModel):
    items: list[TodoOut]
    total: int
    skip: int
    limit: int
```

Add bulk operation schema:
```python
class BulkAction(str, Enum):
    complete = "complete"
    delete = "delete"
    move = "move"

class BulkTodoRequest(BaseModel):
    ids: list[int] = Field(min_length=1)
    action: BulkAction
    folder_id: Optional[int] = None  # only for "move" action
```

- [ ] **Step 2: Verify and commit**

```bash
cd backend && .venv/Scripts/python.exe -c "from src.schemas.todo import TodoCreate, BulkTodoRequest; print('Schemas OK')"
git add backend/src/schemas/todo.py
git commit -m "feat: add RRULE validation, paginated response, note max_length, bulk schemas"
```

---

### Task 3: Backend router — C3 (ownership validation), C5 (recurring subtask), I2 (normalize reorder), I6 (search note), I7 (paginated), I10 (bulk), M3 (complete_children), M4 (eager load), M8 (normalize delete), M11 (batch validate)

**Files:** `backend/src/routers/todo.py`

- [ ] **Step 1: Read current todo.py and apply all changes**

Key changes to `backend/src/routers/todo.py`:

**C3 — validate parent_id/folder_id ownership**: In create and update, after receiving body:
```python
if body.folder_id is not None:
    folder = db.query(Folder).filter(Folder.id == body.folder_id, Folder.user_id == current_user.id).first()
    if not folder:
        raise BadRequestError("Folder not found")
if body.parent_id is not None:
    parent = db.query(Todo).filter(Todo.id == body.parent_id, Todo.user_id == current_user.id).first()
    if not parent:
        raise BadRequestError("Parent todo not found")
```

**I6 — search note field**: Change line ~71:
```python
if search:
    pattern = f"%{search}%"
    q = q.filter(Todo.title.ilike(pattern) | Todo.note.ilike(pattern))
```

**I7 — paginated response**: Change list endpoint return:
```python
total = q.count()
todos = q.offset(skip).limit(limit).all()
items = [_build_todo_out(t) for t in todos]
return TodoListResponse(items=items, total=total, skip=skip, limit=limit)
```

**M4 — eager load**: Add options to the query:
```python
from sqlalchemy.orm import selectinload

todos = (
    q.options(
        selectinload(Todo.children).selectinload(Todo.children),
        selectinload(Todo.tags),
        selectinload(Todo.recurrence_rules),
    )
    .offset(skip).limit(limit).all()
)
```

**I2 — normalize single reorder**: In `PATCH /todos/{id}/reorder`:
```python
todo.sort_order = body.target_index
db.flush()
# Renumber siblings
siblings = db.query(Todo).filter(
    Todo.user_id == current_user.id,
    Todo.parent_id == todo.parent_id,
    Todo.id != todo_id,
).order_by(Todo.sort_order, Todo.id).all()
for i, sib in enumerate(siblings):
    sib.sort_order = i if i < body.target_index else i + 1
db.commit()
```

**M11 — batch reorder validate same parent**: In `POST /todos/reorder`:
```python
ids = [item.id for item in body.items]
ref_todos = db.query(Todo).filter(Todo.id.in_(ids), Todo.user_id == current_user.id).all()
parent_ids = {t.parent_id for t in ref_todos}
if len(parent_ids) > 1:
    raise BadRequestError("Cannot reorder todos from different parent groups")
```

**M8 — normalize after delete**: In `DELETE /todos/{id}`:
```python
parent_id = todo.parent_id
db.delete(todo)
db.flush()
# Renumber siblings
siblings = db.query(Todo).filter(
    Todo.user_id == current_user.id,
    Todo.parent_id == parent_id,
).order_by(Todo.sort_order, Todo.id).all()
for i, sib in enumerate(siblings):
    sib.sort_order = i
db.commit()
```

**M3 — complete_children toggle**: In `PATCH /todos/{id}/toggle`, add optional body param:
```python
class ToggleRequest(BaseModel):
    complete_children: bool = False
```

If `body.complete_children`:
```python
def _complete_children(t: Todo):
    for child in t.children:
        child.is_completed = True
        child.completed_at = datetime.now(timezone.utc)
        _complete_children(child)
_complete_children(todo)
```

**C5 — recurring subtask parent**: In toggle recurrence logic, after creating new instance:
```python
if todo.parent_id:
    parent_todo = db.query(Todo).filter(Todo.id == todo.parent_id).first()
    if parent_todo and parent_todo.is_completed:
        new_todo.parent_id = None
```

**I10 — bulk endpoint**:
```python
@router.post("/bulk", status_code=200)
def bulk_action(body: BulkTodoRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    todos = db.query(Todo).filter(Todo.id.in_(body.ids), Todo.user_id == current_user.id).all()
    if len(todos) != len(body.ids):
        raise BadRequestError("Some todos not found")
    if body.action == BulkAction.complete:
        for t in todos:
            t.is_completed = True
            t.completed_at = datetime.now(timezone.utc)
    elif body.action == BulkAction.delete:
        for t in todos:
            db.delete(t)
    elif body.action == BulkAction.move:
        if body.folder_id is not None:
            folder = db.query(Folder).filter(Folder.id == body.folder_id, Folder.user_id == current_user.id).first()
            if not folder:
                raise BadRequestError("Folder not found")
        for t in todos:
            t.folder_id = body.folder_id
    db.commit()
    return {"code": 0, "message": "ok"}
```

- [ ] **Step 2: Run all tests**

```bash
cd backend && .venv/Scripts/python.exe -m pytest tests/ -v
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routers/todo.py
git commit -m "feat: ownership validation, search notes, paginated, bulk, normalize, eager load, complete children, recurring subtask fix"
```

---

### Task 4: Backend folder router — M4 (eager load)

**Files:** `backend/src/routers/folder.py`

- [ ] **Step 1: Add selectinload to GET /folders**

```python
from sqlalchemy.orm import selectinload

folders = (
    db.query(Folder)
    .filter(Folder.user_id == current_user.id, Folder.parent_id == parent_id)
    .options(selectinload(Folder.children))
    .order_by(Folder.sort_order, Folder.id)
    .offset(skip).limit(limit).all()
)
```

- [ ] **Step 2: Verify and commit**

```bash
cd backend && .venv/Scripts/python.exe -m pytest tests/ -v
git add backend/src/routers/folder.py
git commit -m "perf: eager load folder children to fix N+1 query"
```

---

### Task 5: i18n — C1 (recurrence keys), I4 (tag.add), task detail keys

**Files:** `frontend/src/locales/zh.json`, `frontend/src/locales/en.json`

- [ ] **Step 1: Add recurrence namespace**

In zh.json, add after the `priority` section:
```json
"recurrence": {
  "daily": "每天",
  "weekly": "每周",
  "weekdays": "工作日",
  "weekends": "周末",
  "monthly": "每月同一天",
  "enable": "启用重复",
  "custom": "自定义",
  "addRule": "添加规则"
}
```

In en.json:
```json
"recurrence": {
  "daily": "Daily",
  "weekly": "Weekly",
  "weekdays": "Weekdays",
  "weekends": "Weekends",
  "monthly": "Monthly",
  "enable": "Enable recurrence",
  "custom": "Custom",
  "addRule": "Add rule"
}
```

- [ ] **Step 2: Add tag.add key**

zh.json tag section: `"add": "添加标签"`, en.json: `"add": "Add tag"`

- [ ] **Step 3: Add task detail keys in auth section**

zh.json auth section: `"taskDetail": "任务详情"`, `"status": "状态"`, `"parentTask": "父任务"`, `"createdTime": "创建时间"`, `"updatedTime": "更新时间"`, `"completedTime": "完成时间"`, `"subtasks": "子任务"`, `"noNote": "无备注"`

en.json: same keys with English values.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/locales/zh.json frontend/src/locales/en.json
git commit -m "feat: add recurrence, tag.add, and task detail i18n keys"
```

---

### Task 6: Frontend hooks — C4 (recursive toggle), I5 (recursive reorder), M1 (toast errors)

**Files:** `frontend/src/hooks/useTodos.ts`, `frontend/src/hooks/useFolders.ts`

- [ ] **Step 1: Add recursive update helper in useTodos.ts**

```typescript
function updateNestedTodo(todos: Todo[], id: number, updater: (t: Todo) => Todo): Todo[] {
  return todos.map(t => {
    if (t.id === id) return updater(t)
    if (t.children && t.children.length > 0) {
      return { ...t, children: updateNestedTodo(t.children, id, updater) }
    }
    return t
  })
}
```

Update `toggleTodo`:
```typescript
setTodos(prev => updateNestedTodo(prev, id, t => ({ ...t, is_completed: !t.is_completed })))
```

Update `reorderTodos` optimistic update to use same recursive pattern.

- [ ] **Step 2: Add toast error handling**

Get toast context (check if there's a `useToast` hook or ToastContext):
```typescript
// Import toast utility
import { useErrorDisplay } from './useErrorDisplay'
import { toast } from '../components/common/Toast' // adjust path as needed

// In each CRUD function's catch block:
catch (err) {
  toast.error(displayError(err))
  fetchTodos()
}
```

Apply to: createTodo, updateTodo, deleteTodo (in addition to toggleTodo/reorderTodos existing fetchTodos fallbacks).

- [ ] **Step 3: Same toast pattern for useFolders.ts**

Add toast error handling to create, update, delete, reorder in `useFolders.ts`.

- [ ] **Step 4: Verify TS and commit**

```bash
cd frontend && npx tsc --noEmit 2>&1
git add frontend/src/hooks/useTodos.ts frontend/src/hooks/useFolders.ts
git commit -m "fix: recursive optimistic update for subtasks, toast error handling in hooks"
```

---

### Task 7: Frontend TodoItem — C1 (i18n swipe), I1 (locale date), M2 (confirm delete), M9 (expand), M12 (drag), detail trigger

**Files:** `frontend/src/components/todo/TodoItem.tsx`, `frontend/src/components/todo/TodoList.tsx`

- [ ] **Step 1: Fix hardcoded Chinese in swipe buttons**

Replace:
```tsx
<button className="swipe-btn swipe-edit" ...>编辑</button>
<button className="swipe-btn swipe-delete" ...>删除</button>
```
With:
```tsx
<button className="swipe-btn swipe-edit" ...>{t('app.edit')}</button>
<button className="swipe-btn swipe-delete" ...>{t('app.delete')}</button>
```

- [ ] **Step 2: Locale-aware date formatting I1**

Replace `formatDate` helper:
```typescript
const { locale } = useLocale()

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  // ... existing today/yesterday/tomorrow logic ...
  // Fallback: use locale-aware format
  return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })
}
```

- [ ] **Step 3: Delete confirmation M2**

Add state: `const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)`

Change delete handler:
```typescript
const handleDelete = (e: React.MouseEvent) => {
  e.stopPropagation()
  setShowDeleteConfirm(true)
}
```

Render confirmation inline or as a small popover replacing the action buttons when `showDeleteConfirm` is true:
```tsx
{showDeleteConfirm && (
  <div className="delete-confirm">
    <span>{t('app.confirmDelete')}</span>
    <button onClick={() => { onDelete(todo.id); setShowDeleteConfirm(false) }}>{t('app.confirm')}</button>
    <button onClick={() => setShowDeleteConfirm(false)}>{t('app.cancel')}</button>
  </div>
)}
```

- [ ] **Step 4: Expand/collapse M9**

Replace hardcoded `'▾'` / `'▸'` with text labels:
```tsx
<span className="subtask-toggle">{expanded ? '▾' : '▸'}</span>
<span>{expanded ? t('todo.collapse') : t('todo.expand')} ({completedCount}/{total})</span>
```

- [ ] **Step 5: Add "?" detail trigger icon**

Add between sub-task and delete buttons:
```tsx
<button className="todo-action-btn" onClick={(e) => { e.stopPropagation(); onDetail(todo) }} title={t('auth.taskDetail')}>?</button>
```

TodoItem props: add `onDetail: (todo: Todo) => void`.

- [ ] **Step 6: Drag activation distance M12**

In `TodoList.tsx` and `SubTaskList.tsx`, change:
```typescript
activationConstraint: { distance: 8 }  // was 5
```

- [ ] **Step 7: Verify TS and commit**

```bash
cd frontend && npx tsc --noEmit 2>&1
git add frontend/src/components/todo/TodoItem.tsx frontend/src/components/todo/TodoList.tsx frontend/src/components/todo/SubTaskList.tsx
git commit -m "fix: i18n swipe buttons, locale dates, delete confirm, detail trigger, drag distance"
```

---

### Task 8: Frontend TodoForm — C1 (i18n recurrence), M15 (TodoFormData type)

**Files:** `frontend/src/components/todo/TodoForm.tsx`

- [ ] **Step 1: Replace hardcoded recurrence labels with i18n**

Replace the `PRESETS` array:
```typescript
const RECURRENCE_PRESETS = [
  { label: t('recurrence.daily'), value: 'FREQ=DAILY' },
  { label: t('recurrence.weekly'), value: 'FREQ=WEEKLY' },
  { label: t('recurrence.weekdays'), value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
  { label: t('recurrence.weekends'), value: 'FREQ=WEEKLY;BYDAY=SA,SU' },
  { label: t('recurrence.monthly'), value: 'FREQ=MONTHLY' },
]
```

Replace hardcoded labels:
- `'🔁 启用重复'` → `{t('recurrence.enable')}`
- `<option value="">自定义</option>` → `<option value="">{t('recurrence.custom')}</option>`
- `'＋ 添加规则'` → `＋ {t('recurrence.addRule')}`

- [ ] **Step 2: Define TodoFormData type M15**

At top of file:
```typescript
export interface TodoFormData {
  title: string
  folder_id: number | null
  parent_id: number | null
  priority: number
  note: string
  due_date: string | null
  tag_ids: number[]
  recurrence_rules: string[]
}
```

In `App.tsx`, change `data as any` to `data as TodoFormData` when calling `updateTodo`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/todo/TodoForm.tsx frontend/src/App.tsx
git commit -m "fix: i18n recurrence labels, TodoFormData type replaces as any cast"
```

---

### Task 9: Frontend Sidebar — I9 (folder rename), C2 (delete confirm with count), I4 (fix tag.add)

**Files:** `frontend/src/components/layout/Sidebar.tsx`, `frontend/src/components/todo/TagInput.tsx`

- [ ] **Step 1: Folder rename I9**

Add edit icon button on folder hover (alongside existing delete button). On click, replace folder name text with an inline `<input>` pre-filled with current name. Enter/blur calls `PUT /folders/{id}` with new name. Escape cancels.

New state per folder: `editingFolderId: number | null`, `editName: string`.

- [ ] **Step 2: Folder delete confirmation C2**

Before calling onDeleteFolder, show confirmation that includes:
```tsx
{`确定删除文件夹 '${folder.name}'? 该文件夹包含 ${folder.todo_count} 个任务${folder.children?.length ? `和 ${folder.children.length} 个子文件夹` : ''}, 删除后不可恢复.`}
```

- [ ] **Step 3: TagInput debounce M6**

Change `setTimeout(..., 150)` to `setTimeout(..., 300)`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/Sidebar.tsx frontend/src/components/todo/TagInput.tsx
git commit -m "feat: folder rename and delete confirmation with counts; fix tag debounce to 300ms"
```

---

### Task 10: App.tsx — I8 (URL sync filters), M13 (keyboard shortcuts)

**Files:** `frontend/src/App.tsx`

- [ ] **Step 1: URL-synced filters I8**

Import `useSearchParams` from `react-router-dom`:
```typescript
import { useSearchParams } from 'react-router-dom'
const [searchParams, setSearchParams] = useSearchParams()
```

Initialize filter state from URL params on mount:
```typescript
const [activeFolderId, setActiveFolderId] = useState<number | null>(
  () => searchParams.get('folder_id') ? Number(searchParams.get('folder_id')) : null
)
// ... same pattern for search, statusFilter, priorityFilter, tagFilter
```

When any filter changes, update URL:
```typescript
useEffect(() => {
  const params = new URLSearchParams()
  if (activeFolderId) params.set('folder_id', String(activeFolderId))
  if (search) params.set('search', search)
  if (statusFilter) params.set('status', statusFilter)
  if (priorityFilter) params.set('priority', String(priorityFilter))
  if (tagFilter) params.set('tag_id', String(tagFilter))
  setSearchParams(params, { replace: true })
}, [activeFolderId, search, statusFilter, priorityFilter, tagFilter])
```

- [ ] **Step 2: Keyboard shortcuts M13**

```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); setShowForm(true); setFormParentId(null); setEditTodo(null) }
    if (e.key === '/') { e.preventDefault(); document.querySelector<HTMLInputElement>('.search-bar input')?.focus() }
    if (e.key === 'Escape') { setShowForm(false); setDetailTodo(null) }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [])
```

- [ ] **Step 3: Verify TS and build**

```bash
cd frontend && npx tsc --noEmit 2>&1 && npx vite build 2>&1 | tail -3
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: URL-synced filter state, keyboard shortcuts (N=new, /=search, Esc=close)"
```

---

### Task 11: TaskDetail modal component (D — new feature)

**Files:** Create `frontend/src/components/todo/TaskDetail.tsx`, Modify `frontend/src/App.tsx`, Modify `frontend/src/styles/index.css`

- [ ] **Step 1: Create describeRRule helper**

```typescript
function describeRRule(rrule: string, locale: string): string {
  const t = (zh: string, en: string) => locale === 'zh' ? zh : en
  if (rrule === 'FREQ=DAILY') return t('每天', 'Daily')
  if (rrule === 'FREQ=WEEKLY') return t('每周', 'Weekly')
  if (rrule === 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR') return t('每工作日', 'Every weekday')
  if (rrule === 'FREQ=WEEKLY;BYDAY=SA,SU') return t('每周末', 'Every weekend')
  if (rrule === 'FREQ=MONTHLY') return t('每月同一天', 'Monthly')
  const m = rrule.match(/FREQ=WEEKLY;BYDAY=([A-Z,]+)/)
  if (m) {
    const dayMap: Record<string, string> = locale === 'zh'
      ? { MO: '一', TU: '二', WE: '三', TH: '四', FR: '五', SA: '六', SU: '日' }
      : { MO: 'Mon', TU: 'Tue', WE: 'Wed', TH: 'Thu', FR: 'Fri', SA: 'Sat', SU: 'Sun' }
    const days = m[1].split(',').map(d => dayMap[d] || d)
    return locale === 'zh' ? `每${days.join('、')}` : `Every ${days.join(', ')}`
  }
  return rrule // fallback: raw string
}
```

- [ ] **Step 2: Create TaskDetail component**

```tsx
import React from 'react'
import { Todo } from '../../hooks/useTodos'
import { useLocale } from '../../i18n'
import PriorityTag from '../common/PriorityTag'

interface Props {
  todo: Todo
  onClose: () => void
  onEdit: (todo: Todo) => void
}

const TaskDetail: React.FC<Props> = ({ todo, onClose, onEdit }) => {
  const { t, locale } = useLocale()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal task-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="detail-header">
          <h2>{t('auth.taskDetail')}</h2>
          <button className="detail-close" onClick={onClose}>×</button>
        </div>

        <div className="detail-body">
          <div className="detail-field">
            <label>{t('todo.taskName')}</label>
            <span className="detail-title">{todo.title}</span>
          </div>

          <div className="detail-field">
            <label>{t('auth.status')}</label>
            <span>{todo.is_completed ? `✓ ${t('todo.completed')}` : `○ ${t('todo.active')}`}</span>
          </div>

          <div className="detail-field">
            <label>{t('todo.priority')}</label>
            <PriorityTag priority={todo.priority} />
          </div>

          {todo.folder_id && (
            <div className="detail-field">
              <label>{t('todo.folder')}</label>
              <span>{/* folder name from context or prop */}</span>
            </div>
          )}

          {todo.parent_id && (
            <div className="detail-field">
              <label>{t('auth.parentTask')}</label>
              <span>{/* parent title from context */}</span>
            </div>
          )}

          {todo.due_date && (
            <div className="detail-field">
              <label>{t('todo.dueDate')}</label>
              <span>{todo.due_date}</span>
            </div>
          )}

          {todo.tags && todo.tags.length > 0 && (
            <div className="detail-field">
              <label>{t('tag.tags')}</label>
              <div className="detail-tags">
                {todo.tags.map(tag => <span key={tag.id} className="tag-badge">{tag.name}</span>)}
              </div>
            </div>
          )}

          <div className="detail-section">
            <label>{t('todo.note')}</label>
            <div className="detail-note">{todo.note || t('auth.noNote')}</div>
          </div>

          {todo.recurrence_rules && todo.recurrence_rules.length > 0 && (
            <div className="detail-section">
              <label>🔁 {t('recurrence.enable')}</label>
              <ul className="detail-rrules">
                {todo.recurrence_rules.map((r, i) => (
                  <li key={i}>{describeRRule(r.rrule_string, locale)} <code>({r.rrule_string})</code></li>
                ))}
              </ul>
            </div>
          )}

          {todo.children && todo.children.length > 0 && (
            <div className="detail-section">
              <label>{t('auth.subtasks')} ({todo.children.filter(c => c.is_completed).length}/{todo.children.length})</label>
              <ul className="detail-subtasks">
                {todo.children.map(child => (
                  <li key={child.id} className={child.is_completed ? 'completed' : ''}>
                    {child.is_completed ? '✓' : '○'} {child.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="detail-meta">
            <div><label>{t('auth.createdTime')}</label> {new Date(todo.created_at).toLocaleString()}</div>
            <div><label>{t('auth.updatedTime')}</label> {new Date(todo.updated_at).toLocaleString()}</div>
            {todo.completed_at && <div><label>{t('auth.completedTime')}</label> {new Date(todo.completed_at).toLocaleString()}</div>}
          </div>
        </div>

        <div className="detail-footer">
          <button className="btn-submit" onClick={() => onEdit(todo)}>{t('app.edit')}</button>
          <button className="btn-cancel" onClick={onClose}>{t('app.close')}</button>
        </div>
      </div>
    </div>
  )
}

export default TaskDetail
```

- [ ] **Step 3: Integrate in App.tsx**

Add state: `const [detailTodo, setDetailTodo] = useState<Todo | null>(null)`

In TodoList props: `onDetail={setDetailTodo}`. In SubTaskList: pass through.

Render: `{detailTodo && <TaskDetail todo={detailTodo} onClose={() => setDetailTodo(null)} onEdit={(t) => { setDetailTodo(null); setEditTodo(t); setShowForm(true) }} />}`

- [ ] **Step 4: Add CSS**

```css
.task-detail-modal {
  max-width: 520px;
  max-height: 80vh;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.detail-close {
  font-size: 1.3rem;
  opacity: 0.6;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-field {
  display: flex;
  gap: 12px;
  align-items: center;
}

.detail-field label {
  width: 80px;
  flex-shrink: 0;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.detail-section {
  border-top: 1px solid var(--border);
  padding-top: 12px;
}

.detail-note {
  white-space: pre-wrap;
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.detail-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.detail-rrules { margin: 4px 0 0 16px; font-size: 0.85rem; }
.detail-rrules code { font-size: 0.75rem; color: var(--text-muted); }
.detail-subtasks { margin: 4px 0 0 16px; list-style: none; }
.detail-subtasks li.completed { text-decoration: line-through; color: var(--text-muted); }
.detail-meta { border-top: 1px solid var(--border); padding-top: 12px; font-size: 0.78rem; color: var(--text-muted); }
.detail-meta label { width: 80px; display: inline-block; }
.detail-footer { display: flex; gap: 8px; margin-top: 20px; justify-content: flex-end; }
```

- [ ] **Step 5: Verify TS and build, commit**

```bash
cd frontend && npx tsc --noEmit 2>&1 && npx vite build 2>&1 | tail -3
git add frontend/src/components/todo/TaskDetail.tsx frontend/src/App.tsx frontend/src/styles/index.css
git commit -m "feat: add task detail read-only modal with ? icon trigger"
```

---

### Task 12: Bulk operations UI (I10 — frontend)

**Files:** `frontend/src/components/todo/TodoList.tsx`, `frontend/src/App.tsx`, `frontend/src/styles/index.css`

- [ ] **Step 1: Add selection mode to TodoList**

New props: `selectMode: boolean`, `selectedIds: Set<number>`, `onToggleSelect: (id: number) => void`

When `selectMode` is true, each TodoItem renders a checkbox on the left:
```tsx
{selectMode && (
  <input type="checkbox" checked={selectedIds.has(todo.id)} onChange={() => onToggleSelect(todo.id)} className="bulk-checkbox" />
)}
```

- [ ] **Step 2: Add bulk action bar in App.tsx**

State: `const [selectMode, setSelectMode] = useState(false)`, `const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())`

Toolbar gains "Select" toggle button. When selectMode:
- Bottom bar appears: shows `{t('selected')}: {selectedIds.size}` + buttons "Complete" / "Delete" / "Move to folder"
- Clicking any action calls the bulk endpoint, then resets selectMode and refreshes

```typescript
const handleBulkAction = async (action: 'complete' | 'delete' | 'move', folderId?: number) => {
  try {
    await api.post('/todos/bulk', { ids: Array.from(selectedIds), action, folder_id: folderId })
    setSelectMode(false)
    setSelectedIds(new Set())
    fetchTodos()
  } catch (err) {
    toast.error(displayError(err))
  }
}
```

- [ ] **Step 3: Add CSS for bulk UI**

```css
.bulk-bar {
  position: fixed;
  bottom: 0;
  left: var(--sidebar-width);
  right: 0;
  background: var(--bg-card);
  border-top: 1px solid var(--border);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 50;
}

.bulk-checkbox {
  width: 18px;
  height: 18px;
  margin-right: 8px;
  accent-color: var(--accent);
}
```

- [ ] **Step 4: Verify and commit**

```bash
cd frontend && npx tsc --noEmit 2>&1 && npx vite build 2>&1 | tail -3
git add frontend/src/components/todo/TodoList.tsx frontend/src/App.tsx frontend/src/styles/index.css
git commit -m "feat: bulk select mode with complete/delete/move operations"
```

---

### Task 13: Update docs/todo.md

**Files:** `docs/todo.md`

- [ ] **Step 1: Read current todo.md and update**

Update sections:
1. Feature overview: add task detail modal, bulk operations, keyboard shortcuts, folder rename, URL-synced filters
2. Usage: add sections for task detail view, bulk operations, keyboard shortcuts, folder rename
3. API endpoints: add `POST /todos/bulk`, update GET /todos to show paginated response format
4. Backend files: update schemas/todo.py description (RRULE validation, BulkAction enum), routers/todo.py (bulk endpoint, paginated)
5. Frontend files: add TaskDetail.tsx, update descriptions for TodoItem (detail trigger) and TodoList (bulk select)
6. Add new i18n namespace: `recurrence.*` keys

- [ ] **Step 2: Commit**

```bash
git add docs/todo.md
git commit -m "docs: update todo.md with polish features and task detail view"
```

---

### Task 14: Final verification

- [ ] **Step 1: Run all backend tests**

```bash
cd backend && .venv/Scripts/python.exe -m pytest tests/ -v
```
Expected: all tests pass.

- [ ] **Step 2: Run frontend type check + build**

```bash
cd frontend && npx tsc --noEmit 2>&1 && npx vite build 2>&1 | tail -3
```
Expected: no TS errors, build succeeds.

- [ ] **Step 3: Verify all routes**

```bash
cd backend && .venv/Scripts/python.exe -c "from src.routers.todo import router; print(sorted([r.path for r in router.routes]))"
```
Expected: includes `/api/v1/todos/bulk`.
