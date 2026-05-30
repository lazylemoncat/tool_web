"""
Compatibility exports for the new reusable auth module.

Business modules can keep importing User from this path while the actual
SQLAlchemy model lives in backend.src.auth.adapters.sqlalchemy_models.
"""

from ..auth.adapters.sqlalchemy_models import (
    AuthAuditLog,
    AuthMfaChallenge,
    AuthMfaMethod,
    AuthMfaUsedTotpStep,
    AuthRecoveryCode,
    AuthRefreshToken,
    AuthSession,
    User,
    UserPreference,
)

__all__ = [
    "User",
    "UserPreference",
    "AuthSession",
    "AuthRefreshToken",
    "AuthAuditLog",
    "AuthMfaMethod",
    "AuthMfaChallenge",
    "AuthRecoveryCode",
    "AuthMfaUsedTotpStep",
]
