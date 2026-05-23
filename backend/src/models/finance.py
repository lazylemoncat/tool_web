"""
Finance 模块数据模型: Ledger, Account, Category, Tag, Transaction, SplitItem, Event, Budget, Attachment, ResourceRelation.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index,
    UniqueConstraint, Table, Enum as SAEnum, Numeric, JSON,
)
from sqlalchemy.orm import relationship
import enum

from .todo import Base


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

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = Column(String(50), nullable=False)
    icon = Column(String(10), default="\U0001f4b0")
    currency = Column(String(10), default="CNY")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="ledgers")
    accounts = relationship("Account", back_populates="ledger", cascade="all, delete-orphan")
    categories = relationship("FinanceCategory", back_populates="ledger", cascade="all, delete-orphan")
    tags = relationship("FinanceTag", back_populates="ledger", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="ledger", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="ledger", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="ledger", cascade="all, delete-orphan")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ledger_id = Column(Integer, ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(50), nullable=False)
    type = Column(String(50), nullable=False, default="cash")
    currency = Column(String(10), default="CNY")
    initial_balance = Column(Numeric(12, 2), default=0)
    archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="accounts")
    ledger = relationship("Ledger", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")


class FinanceCategory(Base):
    __tablename__ = "finance_categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ledger_id = Column(Integer, ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("finance_categories.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(50), nullable=False)
    icon = Column(String(10), default="\U0001f4c2")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="finance_categories")
    ledger = relationship("Ledger", back_populates="categories")
    parent = relationship("FinanceCategory", remote_side=[id], back_populates="children")
    children = relationship("FinanceCategory", back_populates="parent", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="category")
    split_items = relationship("SplitItem", back_populates="category")


class FinanceTag(Base):
    __tablename__ = "finance_tags"
    __table_args__ = (UniqueConstraint("ledger_id", "name"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ledger_id = Column(Integer, ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(50), nullable=False)

    user = relationship("User", back_populates="finance_tags")
    ledger = relationship("Ledger", back_populates="tags")
    transactions = relationship("Transaction", secondary=transaction_tags, back_populates="tags")


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        Index("idx_tx_user_ledger_date", "user_id", "ledger_id", "occurred_at"),
        Index("idx_tx_user_account", "user_id", "account_id"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ledger_id = Column(Integer, ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(SAEnum(TransactionType), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="CNY")
    occurred_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    recorded_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    category_id = Column(Integer, ForeignKey("finance_categories.id", ondelete="SET NULL"), nullable=True)
    note = Column(Text, nullable=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    parent_transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="transactions")
    ledger = relationship("Ledger", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")
    category = relationship("FinanceCategory", back_populates="transactions")
    event = relationship("Event", back_populates="transactions")
    parent = relationship("Transaction", remote_side=[id], back_populates="children")
    children = relationship("Transaction", back_populates="parent", cascade="all, delete-orphan")
    tags = relationship("FinanceTag", secondary=transaction_tags, back_populates="transactions")
    split_items = relationship("SplitItem", back_populates="transaction", cascade="all, delete-orphan")
    attachments = relationship("Attachment", secondary=transaction_attachments, back_populates="transactions")


class SplitItem(Base):
    __tablename__ = "split_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(
        Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    amount = Column(Numeric(12, 2), nullable=False)
    category_id = Column(Integer, ForeignKey("finance_categories.id", ondelete="SET NULL"), nullable=True)
    note = Column(Text, nullable=True)

    transaction = relationship("Transaction", back_populates="split_items")
    category = relationship("FinanceCategory", back_populates="split_items")


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (
        Index("idx_events_user_ledger", "user_id", "ledger_id"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ledger_id = Column(Integer, ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    start_at = Column(DateTime, nullable=True)
    end_at = Column(DateTime, nullable=True)
    color = Column(String(9), default="#6366f1")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="events")
    ledger = relationship("Ledger", back_populates="events")
    transactions = relationship("Transaction", back_populates="event")
    relations_as_from = relationship(
        "ResourceRelation",
        foreign_keys="ResourceRelation.from_id",
        primaryjoin="and_(Event.id==foreign(ResourceRelation.from_id), ResourceRelation.from_type=='event')",
        cascade="all, delete-orphan",
    )
    relations_as_to = relationship(
        "ResourceRelation",
        foreign_keys="ResourceRelation.to_id",
        primaryjoin="and_(Event.id==foreign(ResourceRelation.to_id), ResourceRelation.to_type=='event')",
        cascade="all, delete-orphan",
    )


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ledger_id = Column(Integer, ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="CNY")
    rrule = Column(Text, nullable=True)
    filters = Column(JSON, nullable=True)
    rollover = Column(Boolean, default=False)
    alert_threshold = Column(Integer, default=80)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="budgets")
    ledger = relationship("Ledger", back_populates="budgets")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="attachments")
    transactions = relationship("Transaction", secondary=transaction_attachments, back_populates="attachments")


class ResourceRelation(Base):
    __tablename__ = "resource_relations"
    __table_args__ = (
        Index("idx_rr_from", "from_type", "from_id"),
        Index("idx_rr_to", "to_type", "to_id"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    from_type = Column(String(50), nullable=False)
    from_id = Column(Integer, nullable=False)
    relation_type = Column(String(50), nullable=False)
    to_type = Column(String(50), nullable=False)
    to_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
