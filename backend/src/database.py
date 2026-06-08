"""
Database connection, metadata registration, Alembic migration, and auth
seeding.
"""

import logging
import os
import secrets
from pathlib import Path

from alembic import command
from alembic.config import Config
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
from .models.kanban import KanbanColumn, Sprint  # noqa: F401
from .models.kanban_task import KanbanTask  # noqa: F401
from .models.tag import Tag  # noqa: F401
from .models.theme import UserTheme  # noqa: F401
from .models.todo import Base  # noqa: F401
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


def init_db() -> None:
    _run_migrations()
    _seed_admin()


def _run_migrations() -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    alembic_cfg = Config(str(backend_dir / "alembic.ini"))
    alembic_cfg.set_main_option(
        "script_location", str(backend_dir / "migrations")
    )
    alembic_cfg.set_main_option("sqlalchemy.url", DATABASE_URL)
    command.upgrade(alembic_cfg, "head")


def _seed_admin() -> None:
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
