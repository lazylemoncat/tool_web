"""
Database connection, metadata registration, and development auth seeding.
"""

import logging
import os
import secrets

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .auth.adapters.stores import AuthStore
from .auth.core.password import PasswordHasher
from .models.finance import (  # noqa: F401
    Account,
    Attachment,
    Budget,
    Event,
    FinanceCategory,
    FinanceTag,
    Ledger,
    ResourceRelation,
    SplitItem,
    Transaction,
)
from .models.tag import Tag  # noqa: F401
from .models.theme import UserTheme  # noqa: F401
from .models.todo import Base
from .models.user import (
    User,  # noqa: F401  register auth tables with Base.metadata
)

logger = logging.getLogger("tool_web.database")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/tool_web.db")

if DATABASE_URL.startswith("sqlite:///"):
    db_path = DATABASE_URL.removeprefix("sqlite:///")
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)
    _seed_admin()


def _seed_admin():
    db = SessionLocal()
    try:
        store = AuthStore(db)
        admin = store.get_user_by_username("admin")
        admin_password = os.getenv("ADMIN_PASSWORD")
        hasher = PasswordHasher()

        if admin is None:
            if not admin_password:
                admin_password = secrets.token_urlsafe(16)
                logger.warning(
                    (
                        "ADMIN_PASSWORD not set. "
                        "Generated random admin password: %s"
                    ),
                    admin_password,
                )
            store.create_user(
                username="admin",
                password_hash=hasher.hash(admin_password),
                is_admin=True,
            )
            db.commit()
            logger.info("Admin user created")
        elif admin_password and not hasher.verify(
            admin_password, admin.password_hash
        ):
            admin.password_hash = hasher.hash(admin_password)
            db.commit()
            logger.info("Admin password synced from ADMIN_PASSWORD")
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
