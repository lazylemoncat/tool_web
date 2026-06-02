"""
认证路由: /api/v1/auth/register, /api/v1/auth/login, /me, /preferences, /password, /account.
"""

import math
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from ..auth.adapters.stores import AuthStore
from ..database import get_db
from ..middleware.auth import get_current_user
from ..middleware.logging import get_security_logger
from ..models.user import User
from ..schemas.auth import (
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    UpdatePreferencesRequest,
    ChangePasswordRequest,
    DeleteAccountRequest,
)
from ..utils.errors import BadRequestError, ConflictError, UnauthorizedError
from ..utils.security import (
    hash_password,
    verify_password,
    create_token,
    decode_token,
    JWT_EXPIRE_HOURS,
    JWT_EXPIRE_HOURS_REMEMBER,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
sec_log = get_security_logger()

MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def _auth_response(user: User, db: Session, remember_me: bool = False) -> AuthResponse:
    token = create_token(user.id, user.username, remember_me=remember_me)
    return AuthResponse(
        token=token,
        username=user.username,
        preferences=AuthStore(db).get_preferences(user.id),
    )


def _set_token_cookie(response: Response, token: str, remember_me: bool = False):
    max_age = (JWT_EXPIRE_HOURS_REMEMBER if remember_me else JWT_EXPIRE_HOURS) * 3600
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        samesite="strict",
        path="/api",
        max_age=max_age,
        secure=False,  # set True in production with HTTPS
    )


def _clear_token_cookie(response: Response):
    response.set_cookie(
        key="token",
        value="",
        httponly=True,
        samesite="strict",
        path="/api",
        max_age=0,
    )


def _get_client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(body: RegisterRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise ConflictError("Username already exists")

    user = User(
        username=body.username,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    sec_log.info(
        "event=register_success username=%s ip=%s",
        user.username,
        _get_client_ip(request),
    )
    auth_resp = _auth_response(user, db)
    _set_token_cookie(response, auth_resp.token)
    return auth_resp


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()

    # Check account lockout
    if user and user.locked_until:
        now_utc = datetime.now(timezone.utc)
        if user.locked_until > now_utc:
            remaining = math.ceil((user.locked_until - now_utc).total_seconds() / 60)
            raise BadRequestError(
                f"Account locked due to too many failed attempts, please try again in {remaining} minutes"
            )
        else:
            # Lockout period expired, reset
            user.locked_until = None
            user.failed_login_attempts = 0

    if not user or not verify_password(body.password, user.password_hash):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
                sec_log.warning(
                    "event=account_locked username=%s ip=%s attempts=%d",
                    user.username,
                    _get_client_ip(request),
                    user.failed_login_attempts,
                )
            db.commit()
            sec_log.warning(
                "event=login_failure username=%s ip=%s",
                body.username,
                _get_client_ip(request),
            )
        raise UnauthorizedError("Invalid username or password")

    # Login success — reset lockout counters
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    sec_log.info(
        "event=login_success username=%s ip=%s",
        user.username,
        _get_client_ip(request),
    )
    auth_resp = _auth_response(user, db, remember_me=body.remember_me)
    _set_token_cookie(response, auth_resp.token, remember_me=body.remember_me)
    return auth_resp


@router.get("/me", response_model=AuthResponse)
def me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _auth_response(current_user, db)


@router.put("/preferences", status_code=204)
def update_preferences(
    body: UpdatePreferencesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    AuthStore(db).update_preferences(current_user.id, body.preferences)
    db.commit()


@router.put("/password", status_code=204)
def change_password(
    body: ChangePasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.old_password, current_user.password_hash):
        sec_log.warning(
            "event=password_change_failure username=%s ip=%s reason=wrong_old_password",
            current_user.username,
            _get_client_ip(request),
        )
        raise BadRequestError("Current password is incorrect")

    current_user.password_hash = hash_password(body.new_password)
    db.commit()
    sec_log.info(
        "event=password_change_success username=%s ip=%s",
        current_user.username,
        _get_client_ip(request),
    )


@router.post("/refresh", response_model=AuthResponse)
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get("token")
    if not token:
        raise UnauthorizedError("Invalid or expired token")

    from ..utils.security import decode_token_with_grace

    try:
        payload = decode_token_with_grace(token)
    except Exception:
        raise UnauthorizedError("Invalid or expired token")

    user_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UnauthorizedError("User not found")

    sec_log.info("event=token_refresh username=%s ip=%s", user.username, _get_client_ip(request))

    auth_resp = _auth_response(user, db)
    _set_token_cookie(response, auth_resp.token)
    return auth_resp


@router.post("/logout", status_code=204)
def logout(response: Response):
    _clear_token_cookie(response)


@router.delete("/account", status_code=204)
def delete_account(
    body: DeleteAccountRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.password, current_user.password_hash):
        raise BadRequestError("Password is incorrect")

    username = current_user.username
    db.delete(current_user)
    db.commit()
    sec_log.info(
        "event=account_deleted username=%s ip=%s",
        username,
        _get_client_ip(request),
    )
