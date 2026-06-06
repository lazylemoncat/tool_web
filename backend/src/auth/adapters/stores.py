"""SQLAlchemy-backed auth repositories."""

import hashlib
import secrets
from datetime import timedelta
from typing import Any

from sqlalchemy.orm import Session

from ..core.models import CurrentUser
from ..core.time import ensure_aware_utc, utcnow
from .sqlalchemy_models import (
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

DEFAULT_PREFERENCES = {
    "theme": "system",
    "language": "zh",
    "default_status_filter": "active",
}


def make_id() -> str:
    return secrets.token_urlsafe(24)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class AuthStore:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_username(self, username: str) -> User | None:
        return self.db.query(User).filter(User.username == username).first()

    def get_user_by_id(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(
        self, *, username: str, password_hash: str, is_admin: bool = False
    ) -> User:
        user = User(
            username=username, password_hash=password_hash, is_admin=is_admin
        )
        self.db.add(user)
        self.db.flush()
        prefs = UserPreference(
            user_id=user.id, preferences_json=dict(DEFAULT_PREFERENCES)
        )
        self.db.add(prefs)
        self.db.flush()
        return user

    def get_preferences(self, user_id: int) -> dict[str, Any]:
        prefs = (
            self.db.query(UserPreference)
            .filter(UserPreference.user_id == user_id)
            .first()
        )
        if not prefs:
            prefs = UserPreference(
                user_id=user_id, preferences_json=dict(DEFAULT_PREFERENCES)
            )
            self.db.add(prefs)
            self.db.flush()
        return dict(DEFAULT_PREFERENCES) | dict(prefs.preferences_json or {})

    def update_preferences(
        self, user_id: int, preferences: dict[str, Any]
    ) -> None:
        prefs = (
            self.db.query(UserPreference)
            .filter(UserPreference.user_id == user_id)
            .first()
        )
        if not prefs:
            prefs = UserPreference(
                user_id=user_id, preferences_json=preferences
            )
            self.db.add(prefs)
        else:
            prefs.preferences_json = preferences
            prefs.updated_at = utcnow()

    def create_session(
        self,
        *,
        user_id: int,
        ttl_seconds: int,
        ip: str | None,
        user_agent: str | None,
    ) -> AuthSession:
        session = AuthSession(
            id=make_id(),
            user_id=user_id,
            ip_address=ip,
            user_agent=user_agent,
            expires_at=utcnow() + timedelta(seconds=ttl_seconds),
        )
        self.db.add(session)
        self.db.flush()
        return session

    def get_session(self, session_id: str) -> AuthSession | None:
        return (
            self.db.query(AuthSession)
            .filter(AuthSession.id == session_id)
            .first()
        )

    def revoke_session(self, session_id: str, reason: str) -> None:
        session = self.get_session(session_id)
        if session and not session.revoked_at:
            session.revoked_at = utcnow()
            session.revoke_reason = reason

    def revoke_user_sessions(
        self, user_id: int, reason: str, except_session_id: str | None = None
    ) -> None:
        q = self.db.query(AuthSession).filter(
            AuthSession.user_id == user_id,
            AuthSession.revoked_at.is_(None),
        )
        if except_session_id:
            q = q.filter(AuthSession.id != except_session_id)
        for session in q.all():
            session.revoked_at = utcnow()
            session.revoke_reason = reason

    def list_sessions(self, user_id: int) -> list[AuthSession]:
        return (
            self.db.query(AuthSession)
            .filter(AuthSession.user_id == user_id)
            .order_by(AuthSession.created_at.desc())
            .all()
        )

    def create_refresh_token(
        self,
        *,
        session_id: str,
        ttl_seconds: int,
        token_family: str | None = None,
    ) -> tuple[str, AuthRefreshToken]:
        token = secrets.token_urlsafe(48)
        refresh = AuthRefreshToken(
            id=make_id(),
            session_id=session_id,
            token_hash=hash_token(token),
            token_family=token_family or make_id(),
            expires_at=utcnow() + timedelta(seconds=ttl_seconds),
        )
        self.db.add(refresh)
        self.db.flush()
        return token, refresh

    def get_refresh_by_plaintext(self, token: str) -> AuthRefreshToken | None:
        return (
            self.db.query(AuthRefreshToken)
            .filter(AuthRefreshToken.token_hash == hash_token(token))
            .first()
        )

    def mark_refresh_used(
        self, refresh: AuthRefreshToken, replaced_by_id: str
    ) -> None:
        refresh.used_at = utcnow()
        refresh.replaced_by_id = replaced_by_id

    def revoke_refresh_family(self, token_family: str) -> None:
        for refresh in (
            self.db.query(AuthRefreshToken)
            .filter(AuthRefreshToken.token_family == token_family)
            .all()
        ):
            if not refresh.revoked_at:
                refresh.revoked_at = utcnow()

    def audit(
        self,
        event_type: str,
        *,
        user_id: int | None = None,
        session_id: str | None = None,
        ip: str | None = None,
        user_agent: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.db.add(
            AuthAuditLog(
                event_type=event_type,
                user_id=user_id,
                session_id=session_id,
                ip_address=ip,
                user_agent=user_agent,
                metadata_json=metadata or {},
            )
        )

    def current_user_from_model(self, user: User) -> CurrentUser:
        return CurrentUser(
            id=user.id, username=user.username, is_admin=bool(user.is_admin)
        )

    def enabled_mfa_methods(self, user_id: int) -> list[AuthMfaMethod]:
        return (
            self.db.query(AuthMfaMethod)
            .filter(
                AuthMfaMethod.user_id == user_id,
                AuthMfaMethod.is_enabled.is_(True),
            )
            .all()
        )

    def create_totp_method(
        self, *, user_id: int, secret_ciphertext: str
    ) -> AuthMfaMethod:
        method = AuthMfaMethod(
            id=make_id(),
            user_id=user_id,
            method_type="totp",
            secret_ciphertext=secret_ciphertext,
            is_enabled=False,
        )
        self.db.add(method)
        self.db.flush()
        return method

    def get_mfa_method(
        self, method_id: str, user_id: int
    ) -> AuthMfaMethod | None:
        return (
            self.db.query(AuthMfaMethod)
            .filter(
                AuthMfaMethod.id == method_id, AuthMfaMethod.user_id == user_id
            )
            .first()
        )

    def create_mfa_challenge(
        self,
        *,
        user_id: int,
        methods: list[str],
        ttl_seconds: int,
        max_attempts: int,
        ip: str | None,
        user_agent: str | None,
    ) -> AuthMfaChallenge:
        challenge = AuthMfaChallenge(
            id=make_id(),
            user_id=user_id,
            challenge_type="login",
            available_methods_json=methods,
            max_attempts=max_attempts,
            expires_at=utcnow() + timedelta(seconds=ttl_seconds),
            ip_address=ip,
            user_agent=user_agent,
        )
        self.db.add(challenge)
        self.db.flush()
        return challenge

    def get_mfa_challenge(self, challenge_id: str) -> AuthMfaChallenge | None:
        return (
            self.db.query(AuthMfaChallenge)
            .filter(AuthMfaChallenge.id == challenge_id)
            .first()
        )

    def is_totp_step_used(
        self, *, user_id: int, method_id: str, time_step: int
    ) -> bool:
        return (
            self.db.query(AuthMfaUsedTotpStep)
            .filter(
                AuthMfaUsedTotpStep.user_id == user_id,
                AuthMfaUsedTotpStep.method_id == method_id,
                AuthMfaUsedTotpStep.time_step == time_step,
            )
            .first()
            is not None
        )

    def mark_totp_step_used(
        self,
        *,
        user_id: int,
        method_id: str,
        time_step: int,
        challenge_id: str | None = None,
    ) -> None:
        self.db.add(
            AuthMfaUsedTotpStep(
                user_id=user_id,
                method_id=method_id,
                time_step=time_step,
                challenge_id=challenge_id,
            )
        )

    def create_recovery_codes(self, *, user_id: int, codes: list[str]) -> None:
        for old in (
            self.db.query(AuthRecoveryCode)
            .filter(
                AuthRecoveryCode.user_id == user_id,
                AuthRecoveryCode.revoked_at.is_(None),
            )
            .all()
        ):
            old.revoked_at = utcnow()
        for code in codes:
            self.db.add(
                AuthRecoveryCode(
                    id=make_id(),
                    user_id=user_id,
                    code_hash=hash_token(code),
                    code_hint=code[-4:],
                )
            )

    def consume_recovery_code(
        self,
        *,
        user_id: int,
        code: str,
        ip: str | None,
        user_agent: str | None,
    ) -> bool:
        recovery = (
            self.db.query(AuthRecoveryCode)
            .filter(
                AuthRecoveryCode.user_id == user_id,
                AuthRecoveryCode.code_hash == hash_token(code),
                AuthRecoveryCode.used_at.is_(None),
                AuthRecoveryCode.revoked_at.is_(None),
            )
            .first()
        )
        if not recovery:
            return False
        recovery.used_at = utcnow()
        recovery.used_ip_address = ip
        recovery.used_user_agent = user_agent
        return True


def session_is_active(session: AuthSession) -> bool:
    expires_at = ensure_aware_utc(session.expires_at)
    return (
        session.revoked_at is None
        and expires_at is not None
        and expires_at > utcnow()
    )


def refresh_is_active(refresh: AuthRefreshToken) -> bool:
    expires_at = ensure_aware_utc(refresh.expires_at)
    return (
        refresh.revoked_at is None
        and expires_at is not None
        and expires_at > utcnow()
    )
