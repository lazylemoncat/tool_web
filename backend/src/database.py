"""
数据库连接与 session 管理, 含 admin 种子用户.
"""

import logging
import os
import secrets

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from .models.todo import Base
from .models.user import User
from .models.theme import UserTheme  # noqa: F401  register with Base.metadata
from .models.tag import Tag  # noqa: F401  register with Base.metadata
from .utils.security import hash_password

logger = logging.getLogger("tool_web.database")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/tool_web.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    _migrate_schema()
    _seed_admin()


def _migrate_schema():
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        Base.metadata.create_all(bind=engine)
        return

    existing_tables = set(inspector.get_table_names())
    new_tables = {"user_themes", "tags", "todo_tags", "recurrence_rules"}
    if not new_tables.issubset(existing_tables):
        Base.metadata.create_all(bind=engine)

    columns = {c["name"] for c in inspector.get_columns("folders")}
    if "parent_id" not in columns:
        logger.info("Migrating schema: adding parent_id column to folders")
        with engine.connect() as conn:
            conn.execute(
                text(
                    "ALTER TABLE folders ADD COLUMN parent_id INTEGER REFERENCES folders(id)"
                )
            )
            conn.commit()

    if "user_id" not in columns:
        logger.info("Migrating schema: adding user_id columns to existing tables")
        with engine.connect() as conn:
            # SQLite supports ALTER TABLE ADD COLUMN
            conn.execute(
                text(
                    "ALTER TABLE folders ADD COLUMN user_id INTEGER REFERENCES users(id)"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE todos ADD COLUMN user_id INTEGER REFERENCES users(id)"
                )
            )
            admin = conn.execute(
                text(
                    "SELECT id FROM users WHERE username = 'admin'"
                )
            ).first()
            if admin:
                conn.execute(
                    text(
                        f"UPDATE folders SET user_id = {admin[0]}"
                    )
                )
                conn.execute(
                    text(
                        f"UPDATE todos SET user_id = {admin[0]}"
                    )
                )
            conn.commit()

    # Task 1: auth hardening — failed_login_attempts and locked_until columns
    user_columns = {c["name"] for c in inspector.get_columns("users")}
    if "failed_login_attempts" not in user_columns:
        logger.info("Migrating schema: adding failed_login_attempts column to users")
        with engine.connect() as conn:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0")
            )
            conn.commit()

    if "locked_until" not in user_columns:
        logger.info("Migrating schema: adding locked_until column to users")
        with engine.connect() as conn:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN locked_until DATETIME")
            )
            conn.commit()

    # Unique index on tags(user_id, name)
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='index' AND name='uq_tags_user_name'")
        ).first()
        if not result:
            logger.info("Migrating schema: adding unique constraint on tags(user_id, name)")
            conn.execute(
                text("CREATE UNIQUE INDEX uq_tags_user_name ON tags(user_id, name)")
            )
            conn.commit()

    # Composite indexes for todos
    with engine.connect() as conn:
        for idx_name, idx_sql in [
            ("idx_todos_user_parent", "CREATE INDEX idx_todos_user_parent ON todos(user_id, parent_id)"),
            ("idx_todos_user_folder_status", "CREATE INDEX idx_todos_user_folder_status ON todos(user_id, folder_id, is_completed)"),
        ]:
            result = conn.execute(
                text(f"SELECT name FROM sqlite_master WHERE type='index' AND name='{idx_name}'")
            ).first()
            if not result:
                logger.info(f"Migrating schema: creating index {idx_name}")
                conn.execute(text(idx_sql))
                conn.commit()


def _seed_admin():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        admin_password = os.getenv("ADMIN_PASSWORD")

        if admin is None:
            if not admin_password:
                admin_password = secrets.token_urlsafe(16)
                logger.warning(
                    "ADMIN_PASSWORD not set. Generated random admin password: %s",
                    admin_password,
                )
            db.add(
                User(
                    username="admin",
                    password_hash=hash_password(admin_password),
                    is_admin=True,
                )
            )
            db.commit()
            logger.info("Admin user created")
        elif admin_password:
            # Sync password on restart if ADMIN_PASSWORD is set and differs
            from .utils.security import verify_password

            if not verify_password(admin_password, admin.password_hash):
                admin.password_hash = hash_password(admin_password)
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
