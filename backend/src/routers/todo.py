"""
任务 CRUD 路由: /api/v1/todos
支持层级子任务、搜索过滤、完成切换、排序.
"""

from datetime import datetime, timezone
from datetime import date as dt_date
from dateutil.rrule import rrulestr
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..middleware.auth import get_current_user
from ..models.todo import Todo, RecurrenceRule, Folder
from ..models.tag import Tag
from ..models.user import User
from ..schemas.todo import (
    TodoCreate, TodoUpdate, TodoOut, TodoReorder, ReorderBatch,
    RecurrenceRuleOut, TodoListResponse, BulkTodoRequest, BulkAction,
)
from ..schemas.tag import TagOut
from ..utils.errors import BadRequestError

router = APIRouter(prefix="/api/v1/todos", tags=["todos"])


def _build_todo_out(t: Todo) -> TodoOut:
    return TodoOut(
        id=t.id,
        folder_id=t.folder_id,
        parent_id=t.parent_id,
        title=t.title,
        note=t.note,
        priority=t.priority,
        due_date=t.due_date,
        is_completed=t.is_completed,
        completed_at=t.completed_at,
        sort_order=t.sort_order,
        created_at=t.created_at,
        updated_at=t.updated_at,
        children=[_build_todo_out(c) for c in sorted(t.children or [], key=lambda x: (x.sort_order, x.id))],
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
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Todo).filter(
        Todo.parent_id == None, Todo.user_id == current_user.id
    )

    if folder_id is not None:
        q = q.filter(Todo.folder_id == folder_id)
    if priority is not None:
        q = q.filter(Todo.priority == priority)
    if status == "completed":
        q = q.filter(Todo.is_completed == True)
    elif status == "active":
        q = q.filter(Todo.is_completed == False)
    if search:
        pattern = f"%{search}%"
        q = q.filter(or_(Todo.title.ilike(pattern), Todo.note.ilike(pattern)))
    if tag_id is not None:
        q = q.filter(Todo.tags.any(Tag.id == tag_id))

    total = q.count()
    todos = (
        q.options(
            selectinload(Todo.children).selectinload(Todo.children),
            selectinload(Todo.tags),
            selectinload(Todo.recurrence_rules),
        )
        .order_by(Todo.sort_order, Todo.id)
        .offset(skip).limit(limit).all()
    )
    items = [_build_todo_out(t) for t in todos]
    return TodoListResponse(items=items, total=total, skip=skip, limit=limit)


@router.post("", response_model=TodoOut, status_code=201)
def create_todo(body: TodoCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if body.folder_id is not None:
        folder = db.query(Folder).filter(
            Folder.id == body.folder_id, Folder.user_id == current_user.id
        ).first()
        if not folder:
            raise BadRequestError("Folder not found")
    if body.parent_id is not None:
        parent = db.query(Todo).filter(
            Todo.id == body.parent_id, Todo.user_id == current_user.id
        ).first()
        if not parent:
            raise BadRequestError("Parent todo not found")

    data = body.model_dump()
    tag_ids = data.pop("tag_ids", [])
    rrule_strings = data.pop("recurrence_rules", [])
    todo = Todo(**data, user_id=current_user.id)
    if tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(tag_ids), Tag.user_id == current_user.id).all()
        todo.tags = tags
    for rrule_str in rrule_strings:
        todo.recurrence_rules.append(RecurrenceRule(rrule_string=rrule_str))
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return _build_todo_out(todo)


@router.put("/{todo_id}", response_model=TodoOut)
def update_todo(todo_id: int, body: TodoUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    todo = db.query(Todo).filter(
        Todo.id == todo_id, Todo.user_id == current_user.id
    ).first()
    if not todo:
        raise HTTPException(404, "任务不存在")

    if body.folder_id is not None:
        folder = db.query(Folder).filter(
            Folder.id == body.folder_id, Folder.user_id == current_user.id
        ).first()
        if not folder:
            raise BadRequestError("Folder not found")
    if body.parent_id is not None:
        parent = db.query(Todo).filter(
            Todo.id == body.parent_id, Todo.user_id == current_user.id
        ).first()
        if not parent:
            raise BadRequestError("Parent todo not found")

    data = body.model_dump(exclude_unset=True)
    tag_ids = data.pop("tag_ids", None)
    rrule_strings = data.pop("recurrence_rules", None)
    for key, val in data.items():
        setattr(todo, key, val)
    if tag_ids is not None:
        tags = db.query(Tag).filter(Tag.id.in_(tag_ids), Tag.user_id == current_user.id).all()
        todo.tags = tags
    if rrule_strings is not None:
        todo.recurrence_rules.clear()
        for rrule_str in rrule_strings:
            todo.recurrence_rules.append(RecurrenceRule(rrule_string=rrule_str))
    db.commit()
    db.refresh(todo)
    return _build_todo_out(todo)


@router.delete("/{todo_id}", status_code=204)
def delete_todo(todo_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    todo = db.query(Todo).filter(
        Todo.id == todo_id, Todo.user_id == current_user.id
    ).first()
    if not todo:
        raise HTTPException(404, "任务不存在")

    parent_id = todo.parent_id
    db.delete(todo)
    db.flush()

    # Renumber remaining siblings
    siblings = db.query(Todo).filter(
        Todo.user_id == current_user.id,
        Todo.parent_id == parent_id,
    ).order_by(Todo.sort_order, Todo.id).all()
    for i, sib in enumerate(siblings):
        sib.sort_order = i
    db.commit()


class ToggleBody(BaseModel):
    complete_children: bool = False


@router.patch("/{todo_id}/toggle", status_code=200)
def toggle_todo(
    todo_id: int,
    body: ToggleBody = ToggleBody(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    todo = db.query(Todo).filter(
        Todo.id == todo_id, Todo.user_id == current_user.id
    ).first()
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
                child.completed_at = datetime.now(timezone.utc)
                _complete_children(child)
        _complete_children(todo)

    # Recurring task: generate next instance when marking complete (active -> completed)
    new_todo = None
    if todo.is_completed and not was_already_completed and todo.recurrence_rules:
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        next_dates = []
        for rule in todo.recurrence_rules:
            try:
                rr = rrulestr(rule.rrule_string, dtstart=today)
                next_dt = rr.after(today, inc=False)
                if next_dt:
                    next_dates.append(next_dt.date())
            except (ValueError, TypeError):
                continue  # skip invalid RRULE strings

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
                sort_order=todo.sort_order,
            )
            # Detach from completed parent if parent is completed
            if todo.parent_id:
                parent_todo = db.query(Todo).filter(Todo.id == todo.parent_id).first()
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
    todo = db.query(Todo).filter(
        Todo.id == todo_id, Todo.user_id == current_user.id
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="任务不存在")

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
    return _build_todo_out(todo)


@router.post("/reorder", status_code=204)
def batch_reorder(
    body: ReorderBatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ids = [item.id for item in body.items]
    ref_todos = db.query(Todo).filter(
        Todo.id.in_(ids), Todo.user_id == current_user.id
    ).all()

    # Validate all items share the same parent_id
    parent_ids = {t.parent_id for t in ref_todos}
    if len(parent_ids) > 1:
        raise BadRequestError("Cannot reorder todos from different parent groups")

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
    todos = db.query(Todo).filter(
        Todo.id.in_(body.ids), Todo.user_id == current_user.id
    ).all()
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
            folder = db.query(Folder).filter(
                Folder.id == body.folder_id, Folder.user_id == current_user.id
            ).first()
            if not folder:
                raise BadRequestError("Folder not found")
        for t in todos:
            t.folder_id = body.folder_id
    db.commit()
    return {"code": 0, "message": "ok"}
