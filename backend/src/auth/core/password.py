"""Password hashing and policy validation."""

import re

import bcrypt

from .errors import WeakPasswordError
from .models import PasswordPolicy


class PasswordHasher:
    def hash(self, password: str) -> str:
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    def verify(self, password: str, password_hash: str) -> bool:
        return bcrypt.checkpw(password.encode(), password_hash.encode())

    def needs_rehash(self, password_hash: str) -> bool:
        return not password_hash.startswith("$2")


def validate_password(password: str, policy: PasswordPolicy) -> None:
    if len(password) < policy.min_length:
        raise WeakPasswordError(
            f"Password must be at least {policy.min_length} characters"
        )
    if policy.require_letter and not re.search(r"[a-zA-Z]", password):
        raise WeakPasswordError("Password must contain at least 1 letter")
    if policy.require_digit and not re.search(r"\d", password):
        raise WeakPasswordError("Password must contain at least 1 digit")
