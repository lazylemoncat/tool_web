"""
标签 CRUD API: 自由输入 + 自动补全.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..middleware.auth import get_current_user
from ..models.tag import Tag
from ..models.user import User
from ..schemas.tag import TagCreate, TagOut

router = APIRouter(prefix="/api/v1/tags", tags=["tags"])


@router.get("", response_model=list[TagOut])
def list_tags(
    search: str | None = Query(
        None, description="Search tags by name for autocomplete"
    ),
    folder_id: int | None = Query(
        None, description="Filter tags to those used by tasks in a folder"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from ..models.tag import todo_tags
    from ..models.todo import Todo

    q = db.query(Tag).filter(Tag.user_id == current_user.id)

    if folder_id is not None:
        q = (
            q.join(todo_tags, Tag.id == todo_tags.c.tag_id)
            .join(Todo, Todo.id == todo_tags.c.todo_id)
            .filter(Todo.folder_id == folder_id)
            .distinct()
        )

    if search:
        q = q.filter(Tag.name.ilike(f"%{search}%"))
    return q.order_by(Tag.name).all()


@router.post("", response_model=TagOut, status_code=status.HTTP_201_CREATED)
def create_tag(
    body: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Idempotent: return existing tag if same name for this user
    existing = (
        db.query(Tag)
        .filter(Tag.user_id == current_user.id, Tag.name == body.name.strip())
        .first()
    )
    if existing:
        return existing
    tag = Tag(user_id=current_user.id, name=body.name.strip())
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tag = (
        db.query(Tag)
        .filter(Tag.id == tag_id, Tag.user_id == current_user.id)
        .first()
    )
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    db.delete(tag)
    db.commit()
    return None
