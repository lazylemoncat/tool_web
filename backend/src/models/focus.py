"""
Focus timer data models: module-owned folders, tags, and persisted sessions.
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
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .todo import Base

if TYPE_CHECKING:
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
        ForeignKey("focus_tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class FocusFolder(Base):
    __tablename__ = "focus_folders"
    __table_args__ = (
        Index("idx_focus_folders_user_parent", "user_id", "parent_id"),
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
    parent_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("focus_folders.id", ondelete="CASCADE"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    color: Mapped[str] = mapped_column(
        String(9), default="#6366f1", nullable=True
    )
    icon_type: Mapped[str] = mapped_column(
        String(10), default="color", nullable=True
    )
    icon_value: Mapped[str] = mapped_column(
        String(20), default="#6366f1", nullable=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
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
    parent: Mapped["FocusFolder | None"] = relationship(
        "FocusFolder", remote_side=[id], back_populates="children"
    )
    children: Mapped[list["FocusFolder"]] = relationship(
        "FocusFolder", back_populates="parent", cascade="all, delete-orphan"
    )
    sessions: Mapped[list["FocusSession"]] = relationship(
        "FocusSession", back_populates="folder"
    )


class FocusTag(Base):
    __tablename__ = "focus_tags"
    __table_args__ = (UniqueConstraint("user_id", "name"),)

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("auth_users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)

    user: Mapped[User] = relationship("User")
    sessions: Mapped[list["FocusSession"]] = relationship(
        "FocusSession",
        secondary=focus_session_tags,
        back_populates="tags",
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
        Integer,
        ForeignKey("focus_folders.id", ondelete="SET NULL"),
        nullable=True,
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
    folder: Mapped[FocusFolder | None] = relationship(
        "FocusFolder", back_populates="sessions"
    )
    tags: Mapped[list[FocusTag]] = relationship(
        "FocusTag",
        secondary=focus_session_tags,
        back_populates="sessions",
    )
