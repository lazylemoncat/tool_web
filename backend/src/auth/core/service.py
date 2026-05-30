"""AuthService orchestrates authentication workflows without FastAPI dependencies."""

import math
import secrets
from dataclasses import dataclass
from datetime import timedelta
from typing import Any

from ..adapters.stores import AuthStore, refresh_is_active, session_is_active
from .csrf import CsrfService
from .errors import (
    AccountLockedError,
    CurrentPasswordInvalidError,
    DeletePasswordInvalidError,
    InvalidCredentialsError,
    InvalidTokenError,
    MfaInvalidError,
    SessionRevokedError,
    UserNotFoundError,
    UsernameExistsError,
)
from .mfa import (
    build_otpauth_uri,
    generate_recovery_code,
    generate_totp_secret,
    verify_totp,
)
from .models import AuthResult, CurrentUser, MfaRequired, PasswordPolicy
from .password import PasswordHasher, validate_password
from .settings import AuthSettings
from .time import ensure_aware_utc, utcnow
from .tokens import TokenService


@dataclass(frozen=True)
class LoginOutput:
    status: str
    auth: AuthResult | None = None
    mfa: MfaRequired | None = None


class AuthService:
    def __init__(
        self,
        *,
        store: AuthStore,
        settings: AuthSettings,
        password_hasher: PasswordHasher | None = None,
        token_service: TokenService | None = None,
        csrf_service: CsrfService | None = None,
    ):
        self.store = store
        self.settings = settings
        self.password_hasher = password_hasher or PasswordHasher()
        self.token_service = token_service or TokenService(settings)
        self.csrf_service = csrf_service or CsrfService()

    def password_policy(self) -> PasswordPolicy:
        return PasswordPolicy(
            min_length=self.settings.password_min_length,
            require_letter=self.settings.password_require_letter,
            require_digit=self.settings.password_require_digit,
        )

    def register(
        self,
        *,
        username: str,
        password: str,
        remember_me: bool,
        ip: str | None,
        user_agent: str | None,
    ) -> AuthResult:
        if self.store.get_user_by_username(username):
            raise UsernameExistsError()
        validate_password(password, self.password_policy())
        user = self.store.create_user(
            username=username,
            password_hash=self.password_hasher.hash(password),
        )
        self.store.audit("register_success", user_id=user.id, ip=ip, user_agent=user_agent)
        result = self._issue_auth(user=user, remember_me=remember_me, ip=ip, user_agent=user_agent)
        self.store.db.commit()
        return result

    def login(
        self,
        *,
        username: str,
        password: str,
        remember_me: bool,
        ip: str | None,
        user_agent: str | None,
    ) -> LoginOutput:
        user = self.store.get_user_by_username(username)
        if user:
            self._raise_if_locked(user)
        if not user or not user.is_active or not self.password_hasher.verify(password, user.password_hash):
            if user:
                user.failed_login_attempts += 1
                if user.failed_login_attempts >= self.settings.max_login_failures:
                    user.locked_until = utcnow() + timedelta(seconds=self.settings.account_lock_seconds)
                    self.store.audit("account_locked", user_id=user.id, ip=ip, user_agent=user_agent)
                self.store.audit("login_failure", user_id=user.id, ip=ip, user_agent=user_agent)
                self.store.db.commit()
            raise InvalidCredentialsError()

        user.failed_login_attempts = 0
        user.locked_until = None

        enabled_methods = self.store.enabled_mfa_methods(user.id)
        if enabled_methods:
            challenge = self.store.create_mfa_challenge(
                user_id=user.id,
                methods=sorted({m.method_type for m in enabled_methods} | {"recovery_code"}),
                ttl_seconds=self.settings.mfa_challenge_ttl_seconds,
                max_attempts=self.settings.mfa_max_attempts_per_challenge,
                ip=ip,
                user_agent=user_agent,
            )
            self.store.audit("mfa_challenge_created", user_id=user.id, ip=ip, user_agent=user_agent)
            self.store.db.commit()
            return LoginOutput(
                status="mfa_required",
                mfa=MfaRequired(
                    challenge_id=challenge.id,
                    available_methods=list(challenge.available_methods_json),
                    expires_in=self.settings.mfa_challenge_ttl_seconds,
                ),
            )

        self.store.audit("login_success", user_id=user.id, ip=ip, user_agent=user_agent)
        result = self._issue_auth(user=user, remember_me=remember_me, ip=ip, user_agent=user_agent)
        self.store.db.commit()
        return LoginOutput(status="authenticated", auth=result)

    def verify_mfa(
        self,
        *,
        challenge_id: str,
        method: str,
        code: str,
        remember_me: bool,
        ip: str | None,
        user_agent: str | None,
    ) -> AuthResult:
        challenge = self.store.get_mfa_challenge(challenge_id)
        if not challenge or challenge.revoked_at or challenge.verified_at:
            raise MfaInvalidError()
        expires_at = ensure_aware_utc(challenge.expires_at)
        if not expires_at or expires_at <= utcnow():
            raise MfaInvalidError()
        if challenge.attempts >= challenge.max_attempts:
            raise MfaInvalidError()
        user = self.store.get_user_by_id(challenge.user_id)
        if not user:
            raise UserNotFoundError()
        challenge.attempts += 1

        ok = False
        if method == "totp":
            ok = self._verify_totp_for_user(user.id, code, challenge.id)
        elif method == "recovery_code":
            ok = self.store.consume_recovery_code(
                user_id=user.id, code=code, ip=ip, user_agent=user_agent
            )
            if ok:
                self.store.audit("mfa_recovery_code_used", user_id=user.id, ip=ip, user_agent=user_agent)

        if not ok:
            self.store.audit("mfa_verify_failure", user_id=user.id, ip=ip, user_agent=user_agent)
            self.store.db.commit()
            raise MfaInvalidError()

        challenge.verified_at = utcnow()
        self.store.audit("mfa_verify_success", user_id=user.id, ip=ip, user_agent=user_agent)
        self.store.audit("login_success", user_id=user.id, ip=ip, user_agent=user_agent)
        result = self._issue_auth(user=user, remember_me=remember_me, ip=ip, user_agent=user_agent)
        self.store.db.commit()
        return result

    def refresh(self, *, refresh_token: str, ip: str | None, user_agent: str | None) -> AuthResult:
        refresh = self.store.get_refresh_by_plaintext(refresh_token)
        if not refresh:
            raise InvalidTokenError()
        session = self.store.get_session(refresh.session_id)
        if not session or not session_is_active(session):
            raise SessionRevokedError()
        if refresh.used_at or refresh.revoked_at:
            self.store.revoke_refresh_family(refresh.token_family)
            self.store.revoke_session(session.id, "refresh_reuse")
            self.store.audit(
                "refresh_token_reuse_detected",
                user_id=session.user_id,
                session_id=session.id,
                ip=ip,
                user_agent=user_agent,
            )
            self.store.db.commit()
            raise InvalidTokenError()
        if not refresh_is_active(refresh):
            raise InvalidTokenError()
        user = self.store.get_user_by_id(session.user_id)
        if not user:
            raise UserNotFoundError()

        new_refresh_plain, new_refresh = self.store.create_refresh_token(
            session_id=session.id,
            ttl_seconds=self.settings.refresh_token_ttl_seconds,
            token_family=refresh.token_family,
        )
        self.store.mark_refresh_used(refresh, new_refresh.id)
        session.last_seen_at = utcnow()
        access = self.token_service.create_access_token(
            user_id=user.id,
            username=user.username,
            session_id=session.id,
        )
        csrf = self.csrf_service.create_token()
        self.store.audit("token_refresh_success", user_id=user.id, session_id=session.id, ip=ip, user_agent=user_agent)
        self.store.db.commit()
        return AuthResult(
            access_token=access,
            refresh_token=new_refresh_plain,
            csrf_token=csrf,
            user=self.store.current_user_from_model(user),
            preferences=self.store.get_preferences(user.id),
            access_max_age=self.settings.access_token_ttl_seconds,
            refresh_max_age=self.settings.refresh_token_ttl_seconds,
        )

    def get_current_user(self, access_token: str) -> CurrentUser:
        payload = self.token_service.decode_access_token(access_token)
        user_id = int(payload["sub"])
        session_id = payload["sid"]
        session = self.store.get_session(session_id)
        if not session or not session_is_active(session):
            raise SessionRevokedError()
        user = self.store.get_user_by_id(user_id)
        if not user or not user.is_active:
            raise UserNotFoundError()
        session.last_seen_at = utcnow()
        return self.store.current_user_from_model(user)

    def auth_response_for_user(self, user: CurrentUser) -> dict[str, Any]:
        return {
            "username": user.username,
            "preferences": self.store.get_preferences(user.id),
        }

    def update_preferences(self, *, user: CurrentUser, preferences: dict[str, Any]) -> None:
        self.store.update_preferences(user.id, preferences)
        self.store.db.commit()

    def logout(self, *, session_id: str | None, ip: str | None, user_agent: str | None) -> None:
        if session_id:
            session = self.store.get_session(session_id)
            self.store.revoke_session(session_id, "logout")
            self.store.audit(
                "logout",
                user_id=session.user_id if session else None,
                session_id=session_id,
                ip=ip,
                user_agent=user_agent,
            )
        self.store.db.commit()

    def change_password(
        self,
        *,
        user: CurrentUser,
        old_password: str,
        new_password: str,
        current_session_id: str | None,
        ip: str | None,
        user_agent: str | None,
    ) -> None:
        db_user = self.store.get_user_by_id(user.id)
        if not db_user or not self.password_hasher.verify(old_password, db_user.password_hash):
            raise CurrentPasswordInvalidError()
        validate_password(new_password, self.password_policy())
        db_user.password_hash = self.password_hasher.hash(new_password)
        db_user.password_changed_at = utcnow()
        self.store.revoke_user_sessions(user.id, "password_changed", except_session_id=current_session_id)
        self.store.audit("password_changed", user_id=user.id, session_id=current_session_id, ip=ip, user_agent=user_agent)
        self.store.db.commit()

    def delete_account(self, *, user: CurrentUser, password: str, ip: str | None, user_agent: str | None) -> None:
        db_user = self.store.get_user_by_id(user.id)
        if not db_user or not self.password_hasher.verify(password, db_user.password_hash):
            raise DeletePasswordInvalidError()
        self.store.audit("account_deleted", user_id=user.id, ip=ip, user_agent=user_agent)
        self.store.db.delete(db_user)
        self.store.db.commit()

    def list_sessions(self, user: CurrentUser) -> list[dict[str, Any]]:
        return [
            {
                "id": s.id,
                "user_agent": s.user_agent,
                "ip_address": s.ip_address,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "last_seen_at": s.last_seen_at.isoformat() if s.last_seen_at else None,
                "expires_at": s.expires_at.isoformat() if s.expires_at else None,
                "revoked_at": s.revoked_at.isoformat() if s.revoked_at else None,
            }
            for s in self.store.list_sessions(user.id)
        ]

    def revoke_session(self, *, user: CurrentUser, session_id: str) -> None:
        session = self.store.get_session(session_id)
        if session and session.user_id == user.id:
            self.store.revoke_session(session_id, "user_revoked")
            self.store.audit("session_revoked", user_id=user.id, session_id=session_id)
            self.store.db.commit()

    def start_totp_setup(self, *, user: CurrentUser) -> dict[str, str]:
        secret = generate_totp_secret()
        method = self.store.create_totp_method(user_id=user.id, secret_ciphertext=secret)
        self.store.audit("mfa_totp_setup_started", user_id=user.id)
        self.store.db.commit()
        return {
            "method_id": method.id,
            "otpauth_uri": build_otpauth_uri(
                issuer=self.settings.mfa_totp_issuer,
                username=user.username,
                secret=secret,
            ),
        }

    def confirm_totp_setup(self, *, user: CurrentUser, method_id: str, code: str) -> dict[str, list[str]]:
        method = self.store.get_mfa_method(method_id, user.id)
        if not method or method.method_type != "totp" or not method.secret_ciphertext:
            raise MfaInvalidError()
        ok, step = verify_totp(
            secret=method.secret_ciphertext,
            code=code,
            digits=self.settings.mfa_totp_digits,
            interval_seconds=self.settings.mfa_totp_interval_seconds,
            valid_window=self.settings.mfa_totp_valid_window,
        )
        if not ok or step is None:
            raise MfaInvalidError()
        method.is_enabled = True
        method.confirmed_at = utcnow()
        method.last_used_at = utcnow()
        self.store.mark_totp_step_used(user_id=user.id, method_id=method.id, time_step=step)
        codes = [
            generate_recovery_code(self.settings.mfa_recovery_code_length)
            for _ in range(self.settings.mfa_recovery_code_count)
        ]
        self.store.create_recovery_codes(user_id=user.id, codes=codes)
        self.store.audit("mfa_totp_enabled", user_id=user.id)
        self.store.db.commit()
        return {"recovery_codes": codes}

    def get_mfa_status(self, *, user: CurrentUser) -> dict[str, Any]:
        methods = self.store.enabled_mfa_methods(user.id)
        return {
            "enabled": bool(methods),
            "methods": [
                {
                    "id": method.id,
                    "type": method.method_type,
                    "confirmed_at": method.confirmed_at.isoformat() if method.confirmed_at else None,
                    "last_used_at": method.last_used_at.isoformat() if method.last_used_at else None,
                }
                for method in methods
            ],
        }

    def _issue_auth(self, *, user, remember_me: bool, ip: str | None, user_agent: str | None) -> AuthResult:
        session_ttl = (
            self.settings.remember_session_ttl_seconds
            if remember_me
            else self.settings.session_ttl_seconds
        )
        refresh_ttl = (
            self.settings.remember_refresh_token_ttl_seconds
            if remember_me
            else self.settings.refresh_token_ttl_seconds
        )
        session = self.store.create_session(
            user_id=user.id, ttl_seconds=session_ttl, ip=ip, user_agent=user_agent
        )
        refresh_token, _ = self.store.create_refresh_token(
            session_id=session.id, ttl_seconds=refresh_ttl
        )
        access_token = self.token_service.create_access_token(
            user_id=user.id, username=user.username, session_id=session.id
        )
        return AuthResult(
            access_token=access_token,
            refresh_token=refresh_token,
            csrf_token=self.csrf_service.create_token(),
            user=self.store.current_user_from_model(user),
            preferences=self.store.get_preferences(user.id),
            access_max_age=self.settings.access_token_ttl_seconds,
            refresh_max_age=refresh_ttl,
        )

    def _raise_if_locked(self, user) -> None:
        locked_until = ensure_aware_utc(user.locked_until)
        if locked_until and locked_until > utcnow():
            remaining = math.ceil((locked_until - utcnow()).total_seconds() / 60)
            raise AccountLockedError(remaining)
        if locked_until and locked_until <= utcnow():
            user.locked_until = None
            user.failed_login_attempts = 0

    def _verify_totp_for_user(self, user_id: int, code: str, challenge_id: str | None) -> bool:
        for method in self.store.enabled_mfa_methods(user_id):
            if method.method_type != "totp" or not method.secret_ciphertext:
                continue
            ok, step = verify_totp(
                secret=method.secret_ciphertext,
                code=code,
                digits=self.settings.mfa_totp_digits,
                interval_seconds=self.settings.mfa_totp_interval_seconds,
                valid_window=self.settings.mfa_totp_valid_window,
            )
            if ok and step is not None and not self.store.is_totp_step_used(
                user_id=user_id, method_id=method.id, time_step=step
            ):
                method.last_used_at = utcnow()
                self.store.mark_totp_step_used(
                    user_id=user_id,
                    method_id=method.id,
                    time_step=step,
                    challenge_id=challenge_id,
                )
                return True
        return False
