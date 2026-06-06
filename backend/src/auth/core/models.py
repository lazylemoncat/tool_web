"""Core dataclasses shared across auth services and adapters."""

from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass(frozen=True)
class CurrentUser:
    id: int
    username: str
    is_admin: bool = False


@dataclass(frozen=True)
class AuthUserData:
    id: int
    username: str
    password_hash: str
    is_admin: bool
    is_active: bool
    failed_login_attempts: int
    locked_until: datetime | None


@dataclass(frozen=True)
class AuthResult:
    access_token: str
    refresh_token: str
    csrf_token: str
    user: CurrentUser
    preferences: dict[str, Any]
    access_max_age: int
    refresh_max_age: int


@dataclass(frozen=True)
class MfaRequired:
    challenge_id: str
    available_methods: list[str]
    expires_in: int


@dataclass(frozen=True)
class PasswordPolicy:
    min_length: int
    require_letter: bool
    require_digit: bool
