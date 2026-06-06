"""SQLAlchemy models used by the reusable auth module."""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from ...models.todo import Base
from ..core.time import utcnow


class User(Base):
    __tablename__ = "auth_users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True, default=None)
    password_changed_at = Column(DateTime(timezone=True), nullable=True, default=None)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class UserPreference(Base):
    __tablename__ = "user_preferences"

    user_id = Column(Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), primary_key=True)
    preferences_json = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User")


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id = Column(String(64), primary_key=True)
    user_id = Column(Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True)
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    last_seen_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoke_reason = Column(String(100), nullable=True)

    user = relationship("User")


class AuthRefreshToken(Base):
    __tablename__ = "auth_refresh_tokens"

    id = Column(String(64), primary_key=True)
    session_id = Column(String(64), ForeignKey("auth_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(128), unique=True, nullable=False, index=True)
    token_family = Column(String(64), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    replaced_by_id = Column(String(64), ForeignKey("auth_refresh_tokens.id"), nullable=True)

    session = relationship("AuthSession")


class AuthAuditLog(Base):
    __tablename__ = "auth_audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("auth_users.id", ondelete="SET NULL"), nullable=True, index=True)
    session_id = Column(String(64), ForeignKey("auth_sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    ip_address = Column(String(100), nullable=True)
    user_agent = Column(String(500), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class AuthMfaMethod(Base):
    __tablename__ = "auth_mfa_methods"

    id = Column(String(64), primary_key=True)
    user_id = Column(Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True)
    method_type = Column(String(50), nullable=False)
    label = Column(String(100), nullable=True)
    secret_ciphertext = Column(Text, nullable=True)
    secret_version = Column(Integer, default=1, nullable=False)
    is_enabled = Column(Boolean, default=False, nullable=False)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User")


class AuthMfaChallenge(Base):
    __tablename__ = "auth_mfa_challenges"

    id = Column(String(64), primary_key=True)
    user_id = Column(Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_intent_id = Column(String(64), nullable=True)
    challenge_type = Column(String(50), nullable=False)
    available_methods_json = Column(JSON, nullable=False)
    ip_address = Column(String(100), nullable=True)
    user_agent = Column(String(500), nullable=True)
    attempts = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)


class AuthRecoveryCode(Base):
    __tablename__ = "auth_recovery_codes"

    id = Column(String(64), primary_key=True)
    user_id = Column(Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True)
    code_hash = Column(String(128), unique=True, nullable=False)
    code_hint = Column(String(16), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True, index=True)
    used_ip_address = Column(String(100), nullable=True)
    used_user_agent = Column(String(500), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)


class AuthMfaUsedTotpStep(Base):
    __tablename__ = "auth_mfa_used_totp_steps"
    __table_args__ = (UniqueConstraint("user_id", "method_id", "time_step"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True)
    method_id = Column(String(64), ForeignKey("auth_mfa_methods.id", ondelete="CASCADE"), nullable=False)
    time_step = Column(Integer, nullable=False)
    used_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)
    challenge_id = Column(String(64), ForeignKey("auth_mfa_challenges.id"), nullable=True)
