"""
数据库模型: Folder 文件夹, Todo 任务 (含层级子任务自引用).
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Date, DateTime, ForeignKey, Index,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    parent_id = Column(Integer, ForeignKey("folders.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(50), nullable=False)
    color = Column(String(9), default="#6366f1")
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
    parent = relationship("Folder", remote_side=[id], back_populates="children")
    children = relationship("Folder", back_populates="parent", cascade="all, delete-orphan")
    todos = relationship("Todo", back_populates="folder", cascade="all, delete-orphan")


class Todo(Base):
    __tablename__ = "todos"
    __table_args__ = (
        Index("idx_todos_user_parent", "user_id", "parent_id"),
        Index("idx_todos_user_folder_status", "user_id", "folder_id", "is_completed"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    folder_id = Column(Integer, ForeignKey("folders.id", ondelete="CASCADE"), nullable=True)
    parent_id = Column(Integer, ForeignKey("todos.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(500), nullable=False)
    note = Column(Text, nullable=True)
    priority = Column(Integer, default=2)  # 1=高 2=中 3=低
    due_date = Column(Date, nullable=True)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
    folder = relationship("Folder", back_populates="todos")
    parent = relationship("Todo", remote_side=[id], back_populates="children")
    children = relationship("Todo", back_populates="parent", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary="todo_tags", back_populates="todos")
    recurrence_rules = relationship(
        "RecurrenceRule", back_populates="todo", cascade="all, delete-orphan"
    )


class RecurrenceRule(Base):
    __tablename__ = "recurrence_rules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    todo_id = Column(
        Integer, ForeignKey("todos.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rrule_string = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    todo = relationship("Todo", back_populates="recurrence_rules")
