"""KanbanTask 独立模型 — 与 Todo 表分离."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .kanban import KanbanColumn, Sprint
    from .todo import Folder
    from .user import User

from .todo import Base


class KanbanTask(Base):
    __tablename__ = "kanban_tasks"
    __table_args__ = (
        Index(
            "idx_kt_board",
            "user_id",
            "folder_id",
            "sprint_id",
            "column_id",
            "sort_order",
        ),
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
    folder_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("folders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sprint_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True
    )
    column_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("kanban_columns.id", ondelete="SET NULL"),
        nullable=True,
    )

    # System fields (mapped to real columns)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    version: Mapped[str | None] = mapped_column(String(100), nullable=True)
    task_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    priority: Mapped[str | None] = mapped_column(
        String(10), nullable=True
    )  # P0/P1/P2/P3
    requirement_desc: Mapped[str | None] = mapped_column(Text, nullable=True)
    technical_desc: Mapped[str | None] = mapped_column(Text, nullable=True)
    acceptance_criteria: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    # Custom fields (user-defined)
    custom_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    sort_order: Mapped[int | None] = mapped_column(
        Integer, default=0, nullable=True
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
    folder: Mapped[Folder] = relationship(
        "Folder", back_populates="kanban_tasks"
    )
    sprint: Mapped[Sprint | None] = relationship("Sprint")
    kanban_column: Mapped[KanbanColumn | None] = relationship(
        "KanbanColumn", back_populates="kanban_tasks"
    )
