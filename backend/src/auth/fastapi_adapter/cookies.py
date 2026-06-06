"""Cookie helpers for the FastAPI auth adapter."""

from fastapi import Response

from ..core.models import AuthResult
from ..core.settings import AuthSettings


def set_auth_cookies(response: Response, result: AuthResult, settings: AuthSettings) -> None:
    response.set_cookie(
        key=settings.access_cookie_name,
        value=result.access_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
        path=settings.cookie_path,
        max_age=result.access_max_age,
    )
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=result.refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
        path=settings.cookie_path,
        max_age=result.refresh_max_age,
    )
    response.set_cookie(
        key=settings.csrf_cookie_name,
        value=result.csrf_token,
        httponly=False,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
        path=settings.cookie_path,
        max_age=result.refresh_max_age,
    )


def clear_auth_cookies(response: Response, settings: AuthSettings) -> None:
    for name in (
        settings.access_cookie_name,
        settings.refresh_cookie_name,
        settings.csrf_cookie_name,
        "token",
    ):
        response.set_cookie(
            key=name,
            value="",
            httponly=name != settings.csrf_cookie_name,
            secure=settings.cookie_secure,
            samesite=settings.cookie_samesite,
            domain=settings.cookie_domain,
            path=settings.cookie_path,
            max_age=0,
        )
