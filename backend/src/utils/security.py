"""
密码哈希与 JWT token 工具.
"""

import os
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt
from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv())

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable must be set")

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24
JWT_EXPIRE_HOURS_REMEMBER = 168  # 7 days
REFRESH_GRACE_DAYS = 7
REFRESH_GRACE_DAYS_REMEMBER = 30


def generate_secret_key() -> str:
    return secrets.token_urlsafe(64)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_token(
    user_id: int, username: str, remember_me: bool = False
) -> str:
    expire_hours = (
        JWT_EXPIRE_HOURS_REMEMBER if remember_me else JWT_EXPIRE_HOURS
    )
    payload = {
        "sub": str(user_id),
        "username": username,
        "exp": datetime.now(UTC) + timedelta(hours=expire_hours),
        "iat": datetime.now(UTC),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str, verify_exp: bool = True) -> dict:
    options: Any = {} if verify_exp else {"verify_exp": False}
    return jwt.decode(
        token, JWT_SECRET, algorithms=[JWT_ALGORITHM], options=options
    )


def decode_token_with_grace(token: str, remember_me: bool = False) -> dict:
    """Decode token with an expiration grace window."""
    grace_days = (
        REFRESH_GRACE_DAYS_REMEMBER if remember_me else REFRESH_GRACE_DAYS
    )
    try:
        return decode_token(token, verify_exp=True)
    except jwt.ExpiredSignatureError:
        # Accept expired token within grace period
        payload = decode_token(token, verify_exp=False)
        exp = datetime.fromtimestamp(payload["exp"], tz=UTC)
        now = datetime.now(UTC)
        if now - exp <= timedelta(days=grace_days):
            return payload
        raise
