"""
用户模型.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship

from .todo import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    is_admin = Column(Boolean, default=False)
    preferences = Column(JSON, default=lambda: {"theme": "system", "language": "zh", "default_status_filter": "active"})
    created_at = Column(DateTime, default=datetime.utcnow)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True, default=None)

    folders = relationship("Folder", back_populates="user", cascade="all, delete-orphan")
    todos = relationship("Todo", back_populates="user", cascade="all, delete-orphan")
    themes = relationship("UserTheme", back_populates="user", cascade="all, delete-orphan")
