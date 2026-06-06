"""Access token creation and validation."""

import secrets
from datetime import timedelta
from typing import Any

import jwt

from .errors import InvalidTokenError
from .settings import AuthSettings
from .time import utcnow


class TokenService:
    def __init__(self, settings: AuthSettings):
        self.settings = settings

    def create_access_token(
        self, *, user_id: int, username: str, session_id: str
    ) -> str:
        now = utcnow()
        payload = {
            "sub": str(user_id),
            "sid": session_id,
            "typ": "access",
            "username": username,
            "iss": self.settings.jwt_issuer,
            "aud": self.settings.jwt_audience,
            "iat": now,
            "nbf": now,
            "exp": now
            + timedelta(seconds=self.settings.access_token_ttl_seconds),
            "jti": secrets.token_urlsafe(16),
        }
        return jwt.encode(
            payload,
            self.settings.jwt_secret,
            algorithm=self.settings.jwt_algorithm,
        )

    def decode_access_token(self, token: str) -> dict[str, Any]:
        try:
            payload = jwt.decode(
                token,
                self.settings.jwt_secret,
                algorithms=[self.settings.jwt_algorithm],
                issuer=self.settings.jwt_issuer,
                audience=self.settings.jwt_audience,
                options={
                    "require": [
                        "sub",
                        "sid",
                        "typ",
                        "iat",
                        "nbf",
                        "exp",
                        "iss",
                        "aud",
                        "jti",
                    ]
                },
            )
        except Exception as exc:
            raise InvalidTokenError() from exc
        if payload.get("typ") != "access":
            raise InvalidTokenError()
        return payload
