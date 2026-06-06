"""
文件夹 CRUD 路由: /api/v1/folders
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..middleware.auth import get_current_user
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
    folders = (
        db.query(Folder)
        .filter(Folder.id.in_(ids), Folder.user_id == current_user.id)
        .all()
    )
    folder_map = {f.id: f for f in folders}
    for item in body.items:
        if item.id in folder_map:
            folder_map[item.id].sort_order = item.sort_order
    db.commit()
