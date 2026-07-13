"""
任务 CRUD 路由: /api/v1/todos
支持层级子任务、搜索过滤、完成切换、排序.
"""

from collections.abc import Callable
from datetime import UTC, date, datetime

from dateutil.relativedelta import relativedelta
from dateutil.rrule import rrulestr
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..middleware.auth import get_current_user
from ..models.tag import Tag
from ..models.todo import Folder, RecurrenceRule, Todo
from ..models.user import User
from ..schemas.tag import TagOut
from ..schemas.todo import (
    BulkAction,
    BulkTodoRequest,
    RecurrenceRuleOut,
    ReorderBatch,
    TodoCreate,
    TodoListResponse,
    TodoOut,
    TodoReorder,
    TodoUpdate,
)
from ..utils.errors import BadRequestError

router = APIRouter(prefix="/api/v1/todos", tags=["todos"])


def _build_todo_out(t: Todo) -> TodoOut:
    return TodoOut(
        id=t.id,
        folder_id=t.folder_id,
        sprint_id=t.sprint_id,
        column_id=t.column_id,
        parent_id=t.parent_id,
        title=t.title,
        note=t.note,
        priority=t.priority,
        due_date=t.due_date,
        due_time=t.due_time,
        is_completed=t.is_completed,
        completed_at=t.completed_at,
        sort_order=t.sort_order,
        created_at=t.created_at,
        updated_at=t.updated_at,
        children=[
            _build_todo_out(c)
            for c in sorted(
                t.children or [], key=lambda x: (x.sort_order, x.id)
            )
        ],
        tags=[TagOut(id=tag.id, name=tag.name) for tag in (t.tags or [])],
        recurrence_rules=[
            RecurrenceRuleOut(id=r.id, rrule_string=r.rrule_string)
            for r in (t.recurrence_rules or [])
        ],
    )


@router.get("", response_model=TodoListResponse)
def list_todos(
    folder_id: int | None = Query(None),
    search: str | None = Query(None),
    priority: int | None = Query(None),
    status: str | None = Query(None),
    tag_id: int | None = Query(None),
    due_from: date | None = Query(None),
    due_to: date | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Todo).filter(
        Todo.parent_id.is_(None), Todo.user_id == current_user.id
    )

    if folder_id is not None:
        q = q.filter(Todo.folder_id == folder_id)
    if priority is not None:
        q = q.filter(Todo.priority == priority)
    if status == "completed":
        q = q.filter(Todo.is_completed.is_(True))
    elif status == "active":
        q = q.filter(Todo.is_completed.is_(False))
    if search:
        pattern = f"%{search}%"
        q = q.filter(or_(Todo.title.ilike(pattern), Todo.note.ilike(pattern)))
    if tag_id is not None:
        q = q.filter(Todo.tags.any(Tag.id == tag_id))
    if due_from is not None:
        q = q.filter(Todo.due_date >= due_from)
    if due_to is not None:
        q = q.filter(Todo.due_date <= due_to)

    total = q.count()
    todos = (
        q.options(
            selectinload(Todo.children).selectinload(Todo.children),
            selectinload(Todo.tags),
            selectinload(Todo.recurrence_rules),
        )
        .order_by(Todo.sort_order, Todo.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    items = [_build_todo_out(t) for t in todos]
    return TodoListResponse(items=items, total=total, skip=skip, limit=limit)


@router.post("", response_model=TodoOut, status_code=201)
def create_todo(
    body: TodoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.folder_id is not None:
        folder = (
            db.query(Folder)
            .filter(
                Folder.id == body.folder_id, Folder.user_id == current_user.id
            )
            .first()
        )
        if not folder:
            raise BadRequestError("Folder not found")
    if body.parent_id is not None:
        parent = (
            db.query(Todo)
            .filter(Todo.id == body.parent_id, Todo.user_id == current_user.id)
            .first()
        )
        if not parent:
            raise BadRequestError("Parent todo not found")

    data = body.model_dump()
    tag_ids = data.pop("tag_ids", [])
    rrule_strings = data.pop("recurrence_rules", [])
    todo = Todo(**data, user_id=current_user.id)
    if tag_ids:
        tags = (
            db.query(Tag)
            .filter(Tag.id.in_(tag_ids), Tag.user_id == current_user.id)
            .all()
        )
        todo.tags = tags
    for rrule_str in rrule_strings:
        todo.recurrence_rules.append(RecurrenceRule(rrule_string=rrule_str))
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return _build_todo_out(todo)


@router.put("/{todo_id}", response_model=TodoOut)
def update_todo(
    todo_id: int,
    body: TodoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    todo = (
        db.query(Todo)
        .filter(Todo.id == todo_id, Todo.user_id == current_user.id)
        .first()
    )
    if not todo:
        raise HTTPException(404, "任务不存在")

    if body.folder_id is not None:
        folder = (
            db.query(Folder)
            .filter(
                Folder.id == body.folder_id, Folder.user_id == current_user.id
            )
            .first()
        )
        if not folder:
            raise BadRequestError("Folder not found")
    if body.parent_id is not None:
        parent = (
            db.query(Todo)
            .filter(Todo.id == body.parent_id, Todo.user_id == current_user.id)
            .first()
        )
        if not parent:
            raise BadRequestError("Parent todo not found")

    data = body.model_dump(exclude_unset=True)
    tag_ids = data.pop("tag_ids", None)
    rrule_strings = data.pop("recurrence_rules", None)
    for key, val in data.items():
        setattr(todo, key, val)
    if tag_ids is not None:
        tags = (
            db.query(Tag)
            .filter(Tag.id.in_(tag_ids), Tag.user_id == current_user.id)
            .all()
        )
        todo.tags = tags
    if rrule_strings is not None:
        todo.recurrence_rules.clear()
        for rrule_str in rrule_strings:
            todo.recurrence_rules.append(
                RecurrenceRule(rrule_string=rrule_str)
            )
    db.commit()
    db.refresh(todo)
    return _build_todo_out(todo)


@router.delete("/{todo_id}", status_code=204)
def delete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    todo = (
        db.query(Todo)
        .filter(Todo.id == todo_id, Todo.user_id == current_user.id)
        .first()
    )
    if not todo:
        raise HTTPException(404, "任务不存在")

    parent_id = todo.parent_id
    db.delete(todo)
    db.flush()

    # Renumber remaining siblings
    siblings = (
        db.query(Todo)
        .filter(
            Todo.user_id == current_user.id,
            Todo.parent_id == parent_id,
        )
        .order_by(Todo.sort_order, Todo.id)
        .all()
    )
    for i, sib in enumerate(siblings):
        sib.sort_order = i
    db.commit()


class ToggleBody(BaseModel):
    complete_children: bool = False


_SIMPLE_FREQ_STEPS: dict[str, Callable[[int], relativedelta]] = {
    "FREQ=DAILY": lambda k: relativedelta(days=k),
    "FREQ=WEEKLY": lambda k: relativedelta(weeks=k),
    "FREQ=MONTHLY": lambda k: relativedelta(months=k),
    "FREQ=YEARLY": lambda k: relativedelta(years=k),
}
_MAX_SIMPLE_STEPS = 20000


def _next_occurrence(
    rrule_string: str, anchor: datetime, after: datetime
) -> date | None:
    """按重复规则求 after 之后的下一次到期日.

    锚点为任务原到期日, 避免"每周一/每月 5 号"因完成日不同而漂移.
    预设的简单 FREQ 规则用 relativedelta 从锚点按倍数推算,
    月末日期在短月裁剪到月末 (rrule 的 FREQ=MONTHLY 会直接跳过
    没有对应日期的月份, 如 1 月 31 日的下一次会漏掉 2 月).
    """
    rule = rrule_string.strip().upper().removeprefix("RRULE:")
    make_step = _SIMPLE_FREQ_STEPS.get(rule)
    if make_step:
        for step in range(1, _MAX_SIMPLE_STEPS + 1):
            candidate = anchor + make_step(step)
            if candidate > after:
                return candidate.date()
        return None
    try:
        rr = rrulestr(rrule_string, dtstart=anchor)
        next_dt = rr.after(after, inc=False)
    except (ValueError, TypeError):
        return None
    return next_dt.date() if next_dt else None


def _copy_children_to(
    db: Session, source: Todo, target_parent: Todo, user_id: int
) -> None:
    """把重复任务的子任务树复制到新实例下, 复制为未完成且不带到期日."""
    for child in source.children:
        clone = Todo(
            user_id=user_id,
            folder_id=child.folder_id,
            parent_id=target_parent.id,
            title=child.title,
            note=child.note,
            priority=child.priority,
            sort_order=child.sort_order,
        )
        db.add(clone)
        db.flush()
        if child.tags:
            clone.tags = child.tags[:]
        _copy_children_to(db, child, clone, user_id)


@router.patch("/{todo_id}/toggle", status_code=200)
def toggle_todo(
    todo_id: int,
    body: ToggleBody = ToggleBody(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    todo = (
        db.query(Todo)
        .filter(Todo.id == todo_id, Todo.user_id == current_user.id)
        .first()
    )
    if not todo:
        raise HTTPException(404, "任务不存在")

    was_already_completed = todo.is_completed
    todo.is_completed = not todo.is_completed
    todo.completed_at = datetime.utcnow() if todo.is_completed else None

    # Complete children if requested
    if todo.is_completed and body.complete_children:

        def _complete_children(t: Todo):
            for child in t.children:
                child.is_completed = True
                child.completed_at = datetime.now(UTC)
                _complete_children(child)

        _complete_children(todo)

    # Recurring task: generate next instance when marking complete.
    new_todo = None
    if (
        todo.is_completed
        and not was_already_completed
        and todo.recurrence_rules
    ):
        today = datetime.utcnow().replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        # 锚定在原到期日; 提前完成时从原到期日之后推算, 避免生成同日重复实例
        anchor = (
            datetime.combine(todo.due_date, datetime.min.time())
            if todo.due_date
            else today
        )
        after = max(today, anchor)
        next_dates = []
        for rule in todo.recurrence_rules:
            next_date = _next_occurrence(rule.rrule_string, anchor, after)
            if next_date:
                next_dates.append(next_date)

        if next_dates:
            next_due = min(next_dates)
            new_todo = Todo(
                user_id=current_user.id,
                folder_id=todo.folder_id,
                parent_id=todo.parent_id,
                title=todo.title,
                note=todo.note,
                priority=todo.priority,
                due_date=next_due,
                due_time=todo.due_time,
                sort_order=todo.sort_order,
            )
            # Detach from completed parent if parent is completed
            if todo.parent_id:
                parent_todo = (
                    db.query(Todo).filter(Todo.id == todo.parent_id).first()
                )
                if parent_todo and parent_todo.is_completed:
                    new_todo.parent_id = None
            db.add(new_todo)
            db.flush()  # get new_todo.id for relationship assignment
            # Copy tags
            if todo.tags:
                new_todo.tags = todo.tags[:]
            # Copy recurrence rules to the new instance
            for rule in todo.recurrence_rules:
                new_todo.recurrence_rules.append(
                    RecurrenceRule(rrule_string=rule.rrule_string)
                )
            # 复制子任务树 (未完成, 不带到期日)
            _copy_children_to(db, todo, new_todo, current_user.id)
            # 重复链交由新实例延续; 清空本实例的规则,
            # 防止"完成→取消→再完成"重复生成下一次实例
            todo.recurrence_rules.clear()

    db.commit()
    db.refresh(todo)
    if new_todo:
        db.refresh(new_todo)

    return _build_todo_out(todo)


@router.patch("/{todo_id}/reorder", status_code=200)
def reorder_todo(
    todo_id: int,
    body: TodoReorder,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    todo = (
        db.query(Todo)
        .filter(Todo.id == todo_id, Todo.user_id == current_user.id)
        .first()
    )
    if not todo:
        raise HTTPException(status_code=404, detail="任务不存在")

    todo.sort_order = body.target_index
    db.flush()

    # Renumber siblings
    siblings = (
        db.query(Todo)
        .filter(
            Todo.user_id == current_user.id,
            Todo.parent_id == todo.parent_id,
            Todo.id != todo_id,
        )
        .order_by(Todo.sort_order, Todo.id)
        .all()
    )
    for i, sib in enumerate(siblings):
        sib.sort_order = i if i < body.target_index else i + 1
    db.commit()
    return _build_todo_out(todo)


@router.post("/reorder", status_code=204)
def batch_reorder(
    body: ReorderBatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ids = [item.id for item in body.items]
    ref_todos = (
        db.query(Todo)
        .filter(Todo.id.in_(ids), Todo.user_id == current_user.id)
        .all()
    )

    # Validate all items share the same parent_id
    parent_ids = {t.parent_id for t in ref_todos}
    if len(parent_ids) > 1:
        raise BadRequestError(
            "Cannot reorder todos from different parent groups"
        )

    order_map = {item.id: item.sort_order for item in body.items}
    for t in ref_todos:
        if t.id in order_map:
            t.sort_order = order_map[t.id]
    db.commit()


@router.post("/bulk", status_code=200)
def bulk_action(
    body: BulkTodoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    todos = (
        db.query(Todo)
        .filter(Todo.id.in_(body.ids), Todo.user_id == current_user.id)
        .all()
    )
    if len(todos) != len(body.ids):
        raise BadRequestError("Some todos not found")

    if body.action == BulkAction.complete:
        for t in todos:
            t.is_completed = True
            t.completed_at = datetime.now(UTC)
    elif body.action == BulkAction.delete:
        for t in todos:
            db.delete(t)
    elif body.action == BulkAction.move:
        if body.folder_id is not None:
            folder = (
                db.query(Folder)
                .filter(
                    Folder.id == body.folder_id,
                    Folder.user_id == current_user.id,
                )
                .first()
            )
            if not folder:
                raise BadRequestError("Folder not found")
        for t in todos:
            t.folder_id = body.folder_id
    db.commit()
    return {"code": 0, "message": "ok"}


