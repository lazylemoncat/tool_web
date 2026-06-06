"""Auth settings sourced from environment variables."""

import os
from dataclasses import dataclass
from typing import Literal

from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv())


def _bool_env(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or raw == "":
        return default
    return int(raw)


@dataclass(frozen=True)
class AuthSettings:
    environment: Literal["development", "test", "production"] = "development"
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    jwt_issuer: str = "tool-web"
    jwt_audience: str = "tool-web-api"
    access_token_ttl_seconds: int = 15 * 60
    session_ttl_seconds: int = 24 * 60 * 60
    remember_session_ttl_seconds: int = 30 * 24 * 60 * 60
    refresh_token_ttl_seconds: int = 24 * 60 * 60
    remember_refresh_token_ttl_seconds: int = 30 * 24 * 60 * 60
    access_cookie_name: str = "access_token"
    refresh_cookie_name: str = "refresh_token"
    csrf_cookie_name: str = "csrf_token"
    csrf_header_name: str = "X-CSRF-Token"
    cookie_path: str = "/api"
    refresh_cookie_path: str = "/api/v1/auth/refresh"
    cookie_secure: bool = False
    cookie_samesite: Literal["strict", "lax", "none"] = "strict"
    cookie_domain: str | None = None
    max_login_failures: int = 5
    account_lock_seconds: int = 15 * 60
    rate_limit_window_seconds: int = 60
    rate_limit_max_requests: int = 30
    password_min_length: int = 8
    password_require_letter: bool = True
    password_require_digit: bool = True
    mfa_totp_enabled: bool = True
    mfa_totp_issuer: str = "Tool Web"
    mfa_totp_digits: int = 6
    mfa_totp_interval_seconds: int = 30
    mfa_totp_algorithm: str = "SHA1"
    mfa_totp_valid_window: int = 1
    mfa_challenge_ttl_seconds: int = 5 * 60
    mfa_max_attempts_per_challenge: int = 5
    mfa_secret_encryption_key: str = ""
    mfa_recovery_code_count: int = 10
    mfa_recovery_code_length: int = 12

    @classmethod
    def from_env(cls) -> "AuthSettings":
        env = os.getenv("AUTH_ENV", os.getenv("ENVIRONMENT", "development"))
        cookie_secure_default = env == "production"
        settings = cls(
            environment=env,  # type: ignore[arg-type]
            jwt_secret=os.getenv("JWT_SECRET", ""),
            jwt_algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
            jwt_issuer=os.getenv("JWT_ISSUER", "tool-web"),
            jwt_audience=os.getenv("JWT_AUDIENCE", "tool-web-api"),
            access_token_ttl_seconds=_int_env(
                "AUTH_ACCESS_TTL_SECONDS", 15 * 60
            ),
            session_ttl_seconds=_int_env(
                "AUTH_SESSION_TTL_SECONDS", 24 * 60 * 60
            ),
            remember_session_ttl_seconds=_int_env(
                "AUTH_REMEMBER_SESSION_TTL_SECONDS", 30 * 24 * 60 * 60
            ),
            refresh_token_ttl_seconds=_int_env(
                "AUTH_REFRESH_TTL_SECONDS", 24 * 60 * 60
            ),
            remember_refresh_token_ttl_seconds=_int_env(
                "AUTH_REMEMBER_REFRESH_TTL_SECONDS", 30 * 24 * 60 * 60
            ),
            access_cookie_name=os.getenv(
                "AUTH_ACCESS_COOKIE_NAME", "access_token"
            ),
            refresh_cookie_name=os.getenv(
                "AUTH_REFRESH_COOKIE_NAME", "refresh_token"
            ),
            csrf_cookie_name=os.getenv("AUTH_CSRF_COOKIE_NAME", "csrf_token"),
            csrf_header_name=os.getenv(
                "AUTH_CSRF_HEADER_NAME", "X-CSRF-Token"
            ),
            cookie_path=os.getenv("AUTH_COOKIE_PATH", "/api"),
            refresh_cookie_path=os.getenv(
                "AUTH_REFRESH_COOKIE_PATH", "/api/v1/auth/refresh"
            ),
            cookie_secure=_bool_env(
                "AUTH_COOKIE_SECURE", cookie_secure_default
            ),
            cookie_samesite=os.getenv("AUTH_COOKIE_SAMESITE", "strict"),  # type: ignore[arg-type]
            cookie_domain=os.getenv("AUTH_COOKIE_DOMAIN") or None,
            max_login_failures=_int_env("AUTH_MAX_LOGIN_FAILURES", 5),
            account_lock_seconds=_int_env(
                "AUTH_ACCOUNT_LOCK_SECONDS", 15 * 60
            ),
            rate_limit_window_seconds=_int_env(
                "AUTH_RATE_LIMIT_WINDOW_SECONDS", 60
            ),
            rate_limit_max_requests=_int_env(
                "AUTH_RATE_LIMIT_MAX_REQUESTS", 30
            ),
            password_min_length=_int_env("AUTH_PASSWORD_MIN_LENGTH", 8),
            password_require_letter=_bool_env(
                "AUTH_PASSWORD_REQUIRE_LETTER", True
            ),
            password_require_digit=_bool_env(
                "AUTH_PASSWORD_REQUIRE_DIGIT", True
            ),
            mfa_secret_encryption_key=os.getenv(
                "MFA_SECRET_ENCRYPTION_KEY", ""
            ),
        )
        settings.validate()
        return settings

    def validate(self) -> None:
        if len(self.jwt_secret) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")
        if self.environment == "production" and not self.cookie_secure:
            raise ValueError("AUTH_COOKIE_SECURE must be true in production")
        if (
            self.environment == "production"
            and not self.mfa_secret_encryption_key
        ):
            raise ValueError(
                "MFA_SECRET_ENCRYPTION_KEY is required in production"
            )


_settings: AuthSettings | None = None


def get_auth_settings() -> AuthSettings:
    global _settings
    if _settings is None:
        _settings = AuthSettings.from_env()
    return _settings
