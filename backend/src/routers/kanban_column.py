"""
KanbanColumn CRUD 路由: /api/v1/kanban-columns
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..middleware.auth import get_current_user
from ..models.kanban import KanbanColumn, Sprint
from ..models.kanban_task import KanbanTask
from ..models.user import User
from ..schemas.kanban import (
    KanbanColumnCreate,
    KanbanColumnOut,
    KanbanColumnUpdate,
)
from ..schemas.todo import ReorderBatch
from ..utils.errors import BadRequestError

router = APIRouter(prefix="/api/v1/kanban-columns", tags=["kanban-columns"])


def _build_column_out(col: KanbanColumn, db: Session) -> KanbanColumnOut:
    task_count = (
        db.query(func.count(KanbanTask.id))
        .filter(
            KanbanTask.column_id == col.id,
            KanbanTask.sprint_id == col.sprint_id,
            KanbanTask.user_id == col.user_id,
        )
        .scalar()
    )
    return KanbanColumnOut(
        id=col.id,
        sprint_id=col.sprint_id,
        name=col.name,
        color=col.color,
        capacity=col.capacity,
        sort_order=col.sort_order or 0,
        is_archived=col.is_archived or False,
        task_count=task_count,
        created_at=col.created_at,
        updated_at=col.updated_at,
    )


@router.get("", response_model=list[KanbanColumnOut])
def list_columns(
    sprint_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    columns = (
        db.query(KanbanColumn)
        .filter(
            KanbanColumn.sprint_id == sprint_id,
            KanbanColumn.user_id == current_user.id,
        )
        .order_by(KanbanColumn.sort_order, KanbanColumn.id)
        .all()
    )
    return [_build_column_out(c, db) for c in columns]


@router.post("", response_model=KanbanColumnOut, status_code=201)
def create_column(
    body: KanbanColumnCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = (
        db.query(Sprint)
        .filter(Sprint.id == body.sprint_id, Sprint.user_id == current_user.id)
        .first()
    )
    if not sprint:
        raise BadRequestError("Sprint not found")

    col = KanbanColumn(
        sprint_id=body.sprint_id,
        user_id=current_user.id,
        name=body.name,
        color=body.color,
        capacity=body.capacity,
        sort_order=body.sort_order,
        is_archived=body.is_archived,
    )
    db.add(col)
    db.commit()
    db.refresh(col)
    return _build_column_out(col, db)


@router.put("/{column_id}", response_model=KanbanColumnOut)
def update_column(
    column_id: int,
    body: KanbanColumnUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    col = (
        db.query(KanbanColumn)
        .filter(
            KanbanColumn.id == column_id,
            KanbanColumn.user_id == current_user.id,
        )
        .first()
    )
    if not col:
        raise HTTPException(404, "Column not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(col, key, val)
    db.commit()
    db.refresh(col)
    return _build_column_out(col, db)


@router.delete("/{column_id}", status_code=204)
def delete_column(
    column_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    col = (
        db.query(KanbanColumn)
        .filter(
            KanbanColumn.id == column_id,
            KanbanColumn.user_id == current_user.id,
        )
        .first()
    )
    if not col:
        raise HTTPException(404, "Column not found")

    # Migrate tasks to the first other column of the same sprint.
    tasks = (
        db.query(KanbanTask)
        .filter(
            KanbanTask.column_id == column_id,
            KanbanTask.user_id == current_user.id,
        )
        .all()
    )
    fallback = (
        db.query(KanbanColumn)
        .filter(
            KanbanColumn.sprint_id == col.sprint_id,
            KanbanColumn.user_id == current_user.id,
            KanbanColumn.id != column_id,
        )
        .order_by(KanbanColumn.sort_order)
        .first()
    )
    for task in tasks:
        task.column_id = fallback.id if fallback else None
        task.kanban_column = fallback

    db.delete(col)
    db.commit()


@router.post("/reorder", status_code=204)
def reorder_columns(
    body: ReorderBatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ids = [item.id for item in body.items]
    cols = (
        db.query(KanbanColumn)
        .filter(
            KanbanColumn.id.in_(ids),
            KanbanColumn.user_id == current_user.id,
        )
        .all()
    )
    col_map = {c.id: c for c in cols}
    for item in body.items:
        if item.id in col_map:
            col_map[item.id].sort_order = item.sort_order
    db.commit()
