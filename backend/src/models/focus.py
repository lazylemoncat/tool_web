"""
Focus timer data models: persisted Pomodoro/free timer sessions and their
shared Todo tag associations.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .todo import Base

if TYPE_CHECKING:
    from .tag import Tag
    from .todo import Folder
    from .user import User


focus_session_tags = Table(
    "focus_session_tags",
    Base.metadata,
    Column(
        "focus_session_id",
        Integer,
        ForeignKey("focus_sessions.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        Integer,
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class FocusSession(Base):
    __tablename__ = "focus_sessions"
    __table_args__ = (
        Index("idx_focus_sessions_user_started", "user_id", "started_at"),
        Index("idx_focus_sessions_user_folder", "user_id", "folder_id"),
        Index("idx_focus_sessions_user_abandoned", "user_id", "abandoned"),
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("auth_users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    folder_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("folders.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    mode: Mapped[str] = mapped_column(
        String(20), default="pomodoro", nullable=False
    )
    planned_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    focus_seconds: Mapped[int] = mapped_column(Integer, default=0)
    pause_count: Mapped[int] = mapped_column(Integer, default=0)
    pause_seconds: Mapped[int] = mapped_column(Integer, default=0)
    rest_seconds: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    abandoned: Mapped[bool] = mapped_column(Boolean, default=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=True,
    )

    user: Mapped[User] = relationship("User")
    folder: Mapped[Folder | None] = relationship("Folder")
    tags: Mapped[list[Tag]] = relationship("Tag", secondary=focus_session_tags)
