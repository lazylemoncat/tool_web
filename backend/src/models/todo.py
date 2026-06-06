"""
数据库模型: Folder 文件夹, Todo 任务 (含层级子任务自引用).
"""

from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING
from sqlalchemy import (
    Boolean, Date, DateTime, ForeignKey, Index, Integer, String, Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .tag import Tag
    from .user import User


class Base(DeclarativeBase):
    pass


class Folder(Base):
    __tablename__ = "folders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    parent_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("folders.id", ondelete="CASCADE"), nullable=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    color: Mapped[str] = mapped_column(String(9), default="#6366f1", nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    user: Mapped["User"] = relationship("User")
    parent: Mapped[Folder | None] = relationship("Folder", remote_side=[id], back_populates="children")
    children: Mapped[list[Folder]] = relationship("Folder", back_populates="parent", cascade="all, delete-orphan")
    todos: Mapped[list[Todo]] = relationship("Todo", back_populates="folder", cascade="all, delete-orphan")


class Todo(Base):
    __tablename__ = "todos"
    __table_args__ = (
        Index("idx_todos_user_parent", "user_id", "parent_id"),
        Index("idx_todos_user_folder_status", "user_id", "folder_id", "is_completed"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    folder_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("folders.id", ondelete="CASCADE"), nullable=True)
    parent_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("todos.id", ondelete="CASCADE"), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[int] = mapped_column(Integer, default=2, nullable=True)  # 1=高 2=中 3=低
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    user: Mapped["User"] = relationship("User")
    folder: Mapped[Folder | None] = relationship("Folder", back_populates="todos")
    parent: Mapped[Todo | None] = relationship("Todo", remote_side=[id], back_populates="children")
    children: Mapped[list[Todo]] = relationship("Todo", back_populates="parent", cascade="all, delete-orphan")
    tags: Mapped[list["Tag"]] = relationship("Tag", secondary="todo_tags", back_populates="todos")
    recurrence_rules: Mapped[list[RecurrenceRule]] = relationship(
        "RecurrenceRule", back_populates="todo", cascade="all, delete-orphan"
    )


class RecurrenceRule(Base):
    __tablename__ = "recurrence_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    todo_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("todos.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rrule_string: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=True)

    todo: Mapped[Todo] = relationship("Todo", back_populates="recurrence_rules")
