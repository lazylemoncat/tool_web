"""
Sprint CRUD 路由: /api/v1/sprints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..middleware.auth import get_current_user
from ..models.kanban import KanbanColumn, Sprint
from ..models.kanban_task import KanbanTask
from ..models.todo import Folder, Todo
from ..models.user import User
from ..schemas.kanban import SprintCreate, SprintOut, SprintUpdate
from ..utils.errors import BadRequestError

router = APIRouter(prefix="/api/v1/sprints", tags=["sprints"])

DEFAULT_COLUMNS = [
    ("Backlog", "#6750A4", None),
    ("Ready", "#0288D1", None),
    ("Doing", "#F57C00", None),
    ("Testing", "#7B1FA2", None),
    ("Ready to Release", "#388E3C", None),
    ("Released", "#1B5E20", None),
    ("Archived", "#616161", None),
]


def _build_sprint_out(sprint: Sprint) -> SprintOut:
    return SprintOut(
        id=sprint.id,
        folder_id=sprint.folder_id,
        name=sprint.name,
        goal=sprint.goal,
        start_date=sprint.start_date,
        end_date=sprint.end_date,
        status=sprint.status,
        sort_order=sprint.sort_order or 0,
        created_at=sprint.created_at,
        updated_at=sprint.updated_at,
    )


@router.get("", response_model=list[SprintOut])
def list_sprints(
    folder_id: int = Query(..., description="Folder ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprints = (
        db.query(Sprint)
        .filter(
            Sprint.folder_id == folder_id,
            Sprint.user_id == current_user.id,
        )
        .order_by(Sprint.sort_order, Sprint.id)
        .all()
    )
    return [_build_sprint_out(s) for s in sprints]


@router.post("", response_model=SprintOut, status_code=201)
def create_sprint(
    body: SprintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate folder
    folder = (
        db.query(Folder)
        .filter(Folder.id == body.folder_id, Folder.user_id == current_user.id)
        .first()
    )
    if not folder:
        raise BadRequestError("Folder not found")

    sprint = Sprint(
        folder_id=body.folder_id,
        user_id=current_user.id,
        name=body.name,
        goal=body.goal,
        start_date=body.start_date,
        end_date=body.end_date,
        status=body.status,
        sort_order=body.sort_order,
    )
    db.add(sprint)
    db.flush()

    # Create default 7 columns
    for i, (col_name, col_color, col_cap) in enumerate(DEFAULT_COLUMNS):
        col = KanbanColumn(
            sprint_id=sprint.id,
            user_id=current_user.id,
            name=col_name,
            color=col_color,
            capacity=col_cap,
            sort_order=i,
            is_archived=False,
        )
        db.add(col)

    db.commit()
    db.refresh(sprint)
    return _build_sprint_out(sprint)


@router.put("/{sprint_id}", response_model=SprintOut)
def update_sprint(
    sprint_id: int,
    body: SprintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = (
        db.query(Sprint)
        .filter(Sprint.id == sprint_id, Sprint.user_id == current_user.id)
        .first()
    )
    if not sprint:
        raise HTTPException(404, "Sprint not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(sprint, key, val)
    db.commit()
    db.refresh(sprint)
    return _build_sprint_out(sprint)


@router.delete("/{sprint_id}", status_code=204)
def delete_sprint(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = (
        db.query(Sprint)
        .filter(Sprint.id == sprint_id, Sprint.user_id == current_user.id)
        .first()
    )
    if not sprint:
        raise HTTPException(404, "Sprint not found")

    # Delete all todos in this sprint first (FK uses SET NULL, not CASCADE)
    todos = (
        db.query(Todo)
        .filter(Todo.sprint_id == sprint_id, Todo.user_id == current_user.id)
        .all()
    )
    for t in todos:
        db.delete(t)

    # KanbanTask 的 FK 同为 SET NULL, 不显式删除会遗留
    # sprint_id/column_id 为空, 任何列表都查不到的孤儿看板任务
    kanban_tasks = (
        db.query(KanbanTask)
        .filter(
            KanbanTask.sprint_id == sprint_id,
            KanbanTask.user_id == current_user.id,
        )
        .all()
    )
    for kt in kanban_tasks:
        db.delete(kt)

    # Columns cascade-deleted via relationship, sprint deleted
    db.delete(sprint)
    db.commit()
