"""CSRF token generation and validation."""

import hmac
import secrets

from .errors import CsrfInvalidError


class CsrfService:
    def create_token(self) -> str:
        return secrets.token_urlsafe(32)

    def verify(
        self, cookie_token: str | None, header_token: str | None
    ) -> None:
        if not cookie_token or not header_token:
            raise CsrfInvalidError()
        if not hmac.compare_digest(cookie_token, header_token):
            raise CsrfInvalidError()
