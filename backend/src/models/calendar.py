"""
Calendar data models: persisted user-created calendar events.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .todo import Base

if TYPE_CHECKING:
    from .user import User


class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    __table_args__ = (
        Index("idx_calendar_events_user_start", "user_id", "start_at"),
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
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    all_day: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    source_id: Mapped[str] = mapped_column(
        String(50), default="src-manual", nullable=False
    )
    source_type: Mapped[str] = mapped_column(
        String(32), default="manual", nullable=False
    )
    color: Mapped[str] = mapped_column(
        String(9), default="#6C5CE7", nullable=True
    )
    icon: Mapped[str] = mapped_column(
        String(32), default="calendar", nullable=True
    )
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    repeat_rule: Mapped[str] = mapped_column(
        String(16), default="none", nullable=False
    )
    reminder: Mapped[str] = mapped_column(
        String(16), default="none", nullable=False
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
