"""Sprint 和 KanbanColumn 模型."""

from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .kanban_task import KanbanTask
    from .todo import Folder, Todo
    from .user import User

from .todo import Base


class Sprint(Base):
    __tablename__ = "sprints"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    folder_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("folders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("auth_users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    goal: Mapped[str | None] = mapped_column(String(500), nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    # active | planned | completed
    status: Mapped[str] = mapped_column(String(20), default="active")
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
    folder: Mapped[Folder] = relationship("Folder", back_populates="sprints")
    columns: Mapped[list[KanbanColumn]] = relationship(
        "KanbanColumn",
        back_populates="sprint",
        cascade="all, delete-orphan",
        order_by="KanbanColumn.sort_order",
    )


class KanbanColumn(Base):
    __tablename__ = "kanban_columns"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    sprint_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("sprints.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("auth_users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    color: Mapped[str | None] = mapped_column(String(9), nullable=True)
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    is_archived: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=True
    )
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
    sprint: Mapped[Sprint] = relationship("Sprint", back_populates="columns")
    todos: Mapped[list[Todo]] = relationship(
        "Todo", back_populates="kanban_column"
    )
    kanban_tasks: Mapped[list[KanbanTask]] = relationship(
        "KanbanTask", back_populates="kanban_column"
    )
