"""
文件夹 CRUD 路由: /api/v1/folders
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..middleware.auth import get_current_user
from ..models.kanban import KanbanColumn, Sprint
from ..models.todo import Folder, Todo
from ..models.user import User
from ..schemas.todo import (
    FolderCreate,
    FolderOut,
    FolderUpdate,
    ReorderBatch,
)

router = APIRouter(prefix="/api/v1/folders", tags=["folders"])


def _count_folder_todos(folder: Folder, db: Session) -> int:
    return (
        db.query(func.count(Todo.id))
        .filter(
            Todo.folder_id == folder.id,
            Todo.parent_id.is_(None),
            Todo.user_id == folder.user_id,
        )
        .scalar()
    )


def _build_folder_out(folder: Folder, db: Session) -> FolderOut:
    children = sorted(
        folder.children or [], key=lambda x: (x.sort_order, x.id)
    )
    return FolderOut(
        id=folder.id,
        parent_id=folder.parent_id,
        name=folder.name,
        color=folder.color,
        icon_type=folder.icon_type,
        icon_value=folder.icon_value,
        mode=folder.mode or "todo",
        kanban_config=folder.kanban_config,
        sort_order=folder.sort_order,
        created_at=folder.created_at,
        updated_at=folder.updated_at,
        todo_count=_count_folder_todos(folder, db),
        children=[_build_folder_out(c, db) for c in children],
    )


@router.get("", response_model=list[FolderOut])
def list_folders(
    parent_id: int | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Folder).filter(Folder.user_id == current_user.id)
    if parent_id is not None:
        q = q.filter(Folder.parent_id == parent_id)
    else:
        q = q.filter(Folder.parent_id.is_(None))
    folders = (
        q.order_by(Folder.sort_order, Folder.id)
        .options(selectinload(Folder.children))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_build_folder_out(f, db) for f in folders]


@router.post("", response_model=FolderOut, status_code=201)
def create_folder(
    body: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = Folder(**body.model_dump(), user_id=current_user.id)
    db.add(folder)
    db.flush()  # get folder.id

    # If kanban mode, create default sprint + 7 columns in same transaction
    if body.mode == "kanban":
        sprint = Sprint(
            folder_id=folder.id,
            user_id=current_user.id,
            name="Sprint 1",
            goal="",
            status="active",
            sort_order=0,
        )
        db.add(sprint)
        db.flush()

        default_cols = [
            ("Backlog", "#6750A4", None),
            ("Ready", "#0288D1", None),
            ("Doing", "#F57C00", None),
            ("Testing", "#7B1FA2", None),
            ("Ready to Release", "#388E3C", None),
            ("Released", "#1B5E20", None),
            ("Archived", "#616161", None),
        ]
        for i, (name, color, capacity) in enumerate(default_cols):
            col = KanbanColumn(
                sprint_id=sprint.id,
                user_id=current_user.id,
                name=name,
                color=color,
                capacity=capacity,
                sort_order=i,
                is_archived=False,
            )
            db.add(col)

        folder.kanban_config = {
            "kanban_template": {
                "fields": [
                    {
                        "key": "title",
                        "label": "任务名称",
                        "type": "text",
                        "show_on_card": True,
                        "show_in_detail": True,
                        "required": True,
                        "order": 1,
                        "system": True,
                        "editable": True,
                        "default_value": "",
                    },
                    {
                        "key": "version",
                        "label": "所属版本",
                        "type": "text",
                        "show_on_card": True,
                        "show_in_detail": True,
                        "required": False,
                        "order": 2,
                        "system": True,
                        "editable": True,
                        "default_value": "",
                    },
                    {
                        "key": "task_type",
                        "label": "任务类型",
                        "type": "select",
                        "show_on_card": True,
                        "show_in_detail": True,
                        "required": True,
                        "order": 3,
                        "system": True,
                        "editable": True,
                        "default_value": "feature",
                        "options": [
                            "feature",
                            "bug",
                            "chore",
                            "refactor",
                            "docs",
                            "test",
                        ],
                    },
                    {
                        "key": "priority",
                        "label": "优先级",
                        "type": "select",
                        "show_on_card": True,
                        "show_in_detail": True,
                        "required": True,
                        "order": 4,
                        "system": True,
                        "editable": True,
                        "default_value": "P2",
                        "options": ["P0", "P1", "P2", "P3"],
                    },
                    {
                        "key": "requirement_desc",
                        "label": "需求说明",
                        "type": "textarea",
                        "show_on_card": False,
                        "show_in_detail": True,
                        "required": False,
                        "order": 5,
                        "system": True,
                        "editable": True,
                        "default_value": "",
                    },
                    {
                        "key": "technical_desc",
                        "label": "技术说明",
                        "type": "textarea",
                        "show_on_card": False,
                        "show_in_detail": True,
                        "required": False,
                        "order": 6,
                        "system": True,
                        "editable": True,
                        "default_value": "",
                    },
                    {
                        "key": "acceptance_criteria",
                        "label": "验收标准",
                        "type": "textarea",
                        "show_on_card": False,
                        "show_in_detail": True,
                        "required": False,
                        "order": 7,
                        "system": True,
                        "editable": True,
                        "default_value": "",
                    },
                ]
            }
        }

    db.commit()
    db.refresh(folder)
    return _build_folder_out(folder, db)


@router.put("/{folder_id}", response_model=FolderOut)
def update_folder(
    folder_id: int,
    body: FolderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = (
        db.query(Folder)
        .filter(Folder.id == folder_id, Folder.user_id == current_user.id)
        .first()
    )
    if not folder:
        raise HTTPException(404, "文件夹不存在")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(folder, key, val)
    db.commit()
    db.refresh(folder)
    return _build_folder_out(folder, db)


@router.delete("/{folder_id}", status_code=204)
def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = (
        db.query(Folder)
        .filter(Folder.id == folder_id, Folder.user_id == current_user.id)
        .first()
    )
    if not folder:
        raise HTTPException(404, "文件夹不存在")
    db.delete(folder)
    db.commit()


@router.post("/reorder", status_code=204)
def batch_reorder(
    body: ReorderBatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ids = [item.id for item in body.items]
    if not ids:
        return
    folders = (
        db.query(Folder)
        .filter(Folder.id.in_(ids), Folder.user_id == current_user.id)
        .all()
    )
    if len(folders) != len(set(ids)):
        raise HTTPException(404, "Folder not found")
    parent_ids = {folder.parent_id for folder in folders}
    if len(parent_ids) > 1:
        raise HTTPException(
            400,
            "Folders can only be reordered within the same parent",
        )
    folder_map = {f.id: f for f in folders}
    for item in body.items:
        if item.id in folder_map:
            folder_map[item.id].sort_order = item.sort_order
    db.commit()
