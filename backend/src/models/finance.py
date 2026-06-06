"""
Finance 模块数据模型: Ledger, Account, Category, Tag, Transaction, SplitItem, Event, Budget, Attachment, ResourceRelation.
"""

from __future__ import annotations

import enum
from datetime import datetime
from decimal import Decimal
from typing import Any, TYPE_CHECKING
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index,
    UniqueConstraint, Table, Enum as SAEnum, Numeric, JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .todo import Base

if TYPE_CHECKING:
    from .user import User


class TransactionType(str, enum.Enum):
    expense = "expense"
    income = "income"
    transfer = "transfer"


class AccountType(str, enum.Enum):
    cash = "cash"
    debit_card = "debit_card"
    credit_card = "credit_card"
    e_wallet = "e_wallet"
    virtual = "virtual"


transaction_tags = Table(
    "transaction_tags",
    Base.metadata,
    Column("transaction_id", Integer, ForeignKey("transactions.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("finance_tags.id", ondelete="CASCADE"), primary_key=True),
)


transaction_attachments = Table(
    "transaction_attachments",
    Base.metadata,
    Column("transaction_id", Integer, ForeignKey("transactions.id", ondelete="CASCADE"), primary_key=True),
    Column("attachment_id", Integer, ForeignKey("attachments.id", ondelete="CASCADE"), primary_key=True),
)


class Ledger(Base):
    __tablename__ = "ledgers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    icon: Mapped[str] = mapped_column(String(10), default="\U0001f4b0", nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="CNY", nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=True)

    user: Mapped["User"] = relationship("User")
    accounts: Mapped[list[Account]] = relationship("Account", back_populates="ledger", cascade="all, delete-orphan")
    categories: Mapped[list[FinanceCategory]] = relationship("FinanceCategory", back_populates="ledger", cascade="all, delete-orphan")
    tags: Mapped[list[FinanceTag]] = relationship("FinanceTag", back_populates="ledger", cascade="all, delete-orphan")
    transactions: Mapped[list[Transaction]] = relationship("Transaction", back_populates="ledger", cascade="all, delete-orphan")
    events: Mapped[list[Event]] = relationship("Event", back_populates="ledger", cascade="all, delete-orphan")
    budgets: Mapped[list[Budget]] = relationship("Budget", back_populates="ledger", cascade="all, delete-orphan")


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ledger_id: Mapped[int] = mapped_column(Integer, ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False, default="cash")
    currency: Mapped[str] = mapped_column(String(10), default="CNY", nullable=True)
    initial_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=True)
    archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    user: Mapped["User"] = relationship("User")
    ledger: Mapped[Ledger] = relationship("Ledger", back_populates="accounts")
    transactions: Mapped[list[Transaction]] = relationship("Transaction", back_populates="account")


class FinanceCategory(Base):
    __tablename__ = "finance_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ledger_id: Mapped[int] = mapped_column(Integer, ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("finance_categories.id", ondelete="CASCADE"), nullable=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    icon: Mapped[str] = mapped_column(String(10), default="\U0001f4c2", nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=True)

    user: Mapped["User"] = relationship("User")
    ledger: Mapped[Ledger] = relationship("Ledger", back_populates="categories")
    parent: Mapped[FinanceCategory | None] = relationship("FinanceCategory", remote_side=[id], back_populates="children")
    children: Mapped[list[FinanceCategory]] = relationship("FinanceCategory", back_populates="parent", cascade="all, delete-orphan")
    transactions: Mapped[list[Transaction]] = relationship("Transaction", back_populates="category")
    split_items: Mapped[list[SplitItem]] = relationship("SplitItem", back_populates="category")


class FinanceTag(Base):
    __tablename__ = "finance_tags"
    __table_args__ = (UniqueConstraint("ledger_id", "name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ledger_id: Mapped[int] = mapped_column(Integer, ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)

    user: Mapped["User"] = relationship("User")
    ledger: Mapped[Ledger] = relationship("Ledger", back_populates="tags")
    transactions: Mapped[list[Transaction]] = relationship("Transaction", secondary=transaction_tags, back_populates="tags")


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        Index("idx_tx_user_ledger_date", "user_id", "ledger_id", "occurred_at"),
        Index("idx_tx_user_account", "user_id", "account_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ledger_id: Mapped[int] = mapped_column(Integer, ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id: Mapped[int] = mapped_column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    type: Mapped[TransactionType] = mapped_column(SAEnum(TransactionType), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="CNY", nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    category_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("finance_categories.id", ondelete="SET NULL"), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    parent_transaction_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    user: Mapped["User"] = relationship("User")
    ledger: Mapped[Ledger] = relationship("Ledger", back_populates="transactions")
    account: Mapped[Account] = relationship("Account", back_populates="transactions")
    category: Mapped[FinanceCategory | None] = relationship("FinanceCategory", back_populates="transactions")
    event: Mapped[Event | None] = relationship("Event", back_populates="transactions")
    parent: Mapped[Transaction | None] = relationship("Transaction", remote_side=[id], back_populates="children")
    children: Mapped[list[Transaction]] = relationship("Transaction", back_populates="parent", cascade="all, delete-orphan")
    tags: Mapped[list[FinanceTag]] = relationship("FinanceTag", secondary=transaction_tags, back_populates="transactions")
    split_items: Mapped[list[SplitItem]] = relationship("SplitItem", back_populates="transaction", cascade="all, delete-orphan")
    attachments: Mapped[list[Attachment]] = relationship("Attachment", secondary=transaction_attachments, back_populates="transactions")


class SplitItem(Base):
    __tablename__ = "split_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    transaction_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    category_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("finance_categories.id", ondelete="SET NULL"), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    transaction: Mapped[Transaction] = relationship("Transaction", back_populates="split_items")
    category: Mapped[FinanceCategory | None] = relationship("FinanceCategory", back_populates="split_items")


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (
        Index("idx_events_user_ledger", "user_id", "ledger_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ledger_id: Mapped[int] = mapped_column(Integer, ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    end_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    color: Mapped[str] = mapped_column(String(9), default="#6366f1", nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    user: Mapped["User"] = relationship("User")
    ledger: Mapped[Ledger] = relationship("Ledger", back_populates="events")
    transactions: Mapped[list[Transaction]] = relationship("Transaction", back_populates="event")
    relations_as_from: Mapped[list[ResourceRelation]] = relationship(
        "ResourceRelation",
        foreign_keys="ResourceRelation.from_id",
        primaryjoin="and_(Event.id==foreign(ResourceRelation.from_id), ResourceRelation.from_type=='event')",
        cascade="all, delete-orphan",
    )
    relations_as_to: Mapped[list[ResourceRelation]] = relationship(
        "ResourceRelation",
        foreign_keys="ResourceRelation.to_id",
        primaryjoin="and_(Event.id==foreign(ResourceRelation.to_id), ResourceRelation.to_type=='event')",
        cascade="all, delete-orphan",
    )


class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ledger_id: Mapped[int] = mapped_column(Integer, ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="CNY", nullable=True)
    rrule: Mapped[str | None] = mapped_column(Text, nullable=True)
    filters: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    rollover: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    alert_threshold: Mapped[int] = mapped_column(Integer, default=80, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    user: Mapped["User"] = relationship("User")
    ledger: Mapped[Ledger] = relationship("Ledger", back_populates="budgets")


class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=True)

    user: Mapped["User"] = relationship("User")
    transactions: Mapped[list[Transaction]] = relationship("Transaction", secondary=transaction_attachments, back_populates="attachments")


class ResourceRelation(Base):
    __tablename__ = "resource_relations"
    __table_args__ = (
        Index("idx_rr_from", "from_type", "from_id"),
        Index("idx_rr_to", "to_type", "to_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    from_type: Mapped[str] = mapped_column(String(50), nullable=False)
    from_id: Mapped[int] = mapped_column(Integer, nullable=False)
    relation_type: Mapped[str] = mapped_column(String(50), nullable=False)
    to_type: Mapped[str] = mapped_column(String(50), nullable=False)
    to_id: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=True)
