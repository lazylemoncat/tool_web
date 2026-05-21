"""
标签模型: 多对多关联 Todo.
"""

from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, Table
from sqlalchemy.orm import relationship

from .todo import Base

todo_tags = Table(
    "todo_tags",
    Base.metadata,
    Column("todo_id", Integer, ForeignKey("todos.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    __tablename__ = "tags"
    __table_args__ = (UniqueConstraint("user_id", "name"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = Column(String(50), nullable=False)

    todos = relationship("Todo", secondary=todo_tags, back_populates="tags")
