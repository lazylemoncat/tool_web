"""FastAPI dependencies for auth."""

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ...database import get_db
from ..adapters.stores import AuthStore
from ..core.csrf import CsrfService
from ..core.errors import InvalidTokenError
from ..core.models import CurrentUser
from ..core.service import AuthService
from ..core.settings import AuthSettings, get_auth_settings

security_scheme = HTTPBearer(auto_error=False)


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    settings = get_auth_settings()
    return AuthService(store=AuthStore(db), settings=settings)


def _get_access_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None,
    settings: AuthSettings,
) -> str | None:
    token = request.cookies.get(
        settings.access_cookie_name
    ) or request.cookies.get("token")
    if not token and credentials:
        token = credentials.credentials
    return token


def require_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(
        security_scheme
    ),
    auth: AuthService = Depends(get_auth_service),
) -> CurrentUser:
    token = _get_access_token(request, credentials, auth.settings)
    if not token:
        raise InvalidTokenError()
    return auth.get_current_user(token)


def optional_session_id(
    request: Request, auth: AuthService = Depends(get_auth_service)
) -> str | None:
    token = request.cookies.get(
        auth.settings.access_cookie_name
    ) or request.cookies.get("token")
    if not token:
        return None
    try:
        payload = auth.token_service.decode_access_token(token)
    except Exception:
        return None
    return str(payload.get("sid") or "") or None


def verify_csrf(
    request: Request, auth: AuthService = Depends(get_auth_service)
) -> None:
    if request.method in {"GET", "HEAD", "OPTIONS"}:
        return
    cookie_token = request.cookies.get(auth.settings.csrf_cookie_name)
    header_token = request.headers.get(auth.settings.csrf_header_name)
    CsrfService().verify(cookie_token, header_token)


def require_admin(
    current_user: CurrentUser = Depends(require_user),
) -> CurrentUser:
    if not current_user.is_admin:
        from ...utils.errors import ForbiddenError

        raise ForbiddenError()
    return current_user
