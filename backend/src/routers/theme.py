"""
自定义主题 CRUD API.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..middleware.auth import get_current_user
from ..models.theme import UserTheme
from ..models.user import User
from ..schemas.theme import ThemeCreate, ThemeFullOut, ThemeOut, ThemeUpdate

router = APIRouter(prefix="/api/v1/themes", tags=["themes"])


@router.get("", response_model=list[ThemeOut])
def list_themes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(UserTheme)
        .filter(UserTheme.user_id == current_user.id)
        .order_by(UserTheme.updated_at.desc())
        .all()
    )


@router.post(
    "", response_model=ThemeFullOut, status_code=status.HTTP_201_CREATED
)
def create_theme(
    body: ThemeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    theme = UserTheme(
        user_id=current_user.id,
        name=body.name,
        config_json=body.config_json,
    )
    db.add(theme)
    db.commit()
    db.refresh(theme)
    return theme


@router.get("/{theme_id}", response_model=ThemeFullOut)
def get_theme(
    theme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    theme = (
        db.query(UserTheme)
        .filter(UserTheme.id == theme_id, UserTheme.user_id == current_user.id)
        .first()
    )
    if not theme:
        raise HTTPException(status_code=404, detail="Theme not found")
    return theme


@router.put("/{theme_id}", response_model=ThemeFullOut)
def update_theme(
    theme_id: int,
    body: ThemeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    theme = (
        db.query(UserTheme)
        .filter(UserTheme.id == theme_id, UserTheme.user_id == current_user.id)
        .first()
    )
    if not theme:
        raise HTTPException(status_code=404, detail="Theme not found")
    if body.name is not None:
        theme.name = body.name
    if body.config_json is not None:
        theme.config_json = body.config_json
    db.commit()
    db.refresh(theme)
    return theme


@router.delete("/{theme_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_theme(
    theme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    theme = (
        db.query(UserTheme)
        .filter(UserTheme.id == theme_id, UserTheme.user_id == current_user.id)
        .first()
    )
    if not theme:
        raise HTTPException(status_code=404, detail="Theme not found")
    db.delete(theme)
    db.commit()
    return None
