"""FastAPI router for auth APIs."""

from fastapi import APIRouter, Depends, Query, Request, Response

from ..core.models import AuthResult, CurrentUser
from ..core.service import AuthService
from .cookies import clear_auth_cookies, set_auth_cookies
from .dependencies import get_auth_service, optional_session_id, require_user
from .schemas import (
    AuthResponse,
    AuthUserResponse,
    ChangePasswordRequest,
    DeleteAccountRequest,
    LoginRequest,
    LoginResponse,
    MfaVerifyRequest,
    PasswordPolicyResponse,
    PasswordResetRequest,
    RecoveryCodesResponse,
    RegisterRequest,
    TotpConfirmRequest,
    TotpSetupResponse,
    UpdatePreferencesRequest,
    UsernameAvailabilityResponse,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _user_response(user: CurrentUser) -> AuthUserResponse:
    return AuthUserResponse(
        id=user.id, username=user.username, is_admin=user.is_admin
    )


def _auth_response(result: AuthResult) -> AuthResponse:
    return AuthResponse(
        token=result.access_token,
        username=result.user.username,
        preferences=result.preferences,
        user=_user_response(result.user),
        csrf_token=result.csrf_token,
    )


@router.get(
    "/username-availability",
    response_model=UsernameAvailabilityResponse,
)
def username_availability(
    username: str = Query(min_length=2, max_length=50),
    auth: AuthService = Depends(get_auth_service),
):
    normalized_username = username.strip()
    return UsernameAvailabilityResponse(
        username=normalized_username,
        available=auth.username_available(normalized_username),
    )


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(
    body: RegisterRequest,
    request: Request,
    response: Response,
    auth: AuthService = Depends(get_auth_service),
):
    result = auth.register(
        username=body.username.strip(),
        password=body.password,
        remember_me=body.remember_me,
        ip=_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    set_auth_cookies(response, result, auth.settings)
    return _auth_response(result)


@router.post("/login", response_model=LoginResponse)
def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    auth: AuthService = Depends(get_auth_service),
):
    output = auth.login(
        username=body.username.strip(),
        password=body.password,
        remember_me=body.remember_me,
        ip=_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    if output.status == "mfa_required" and output.mfa:
        return LoginResponse(
            status="mfa_required",
            challenge_id=output.mfa.challenge_id,
            available_methods=output.mfa.available_methods,
            expires_in=output.mfa.expires_in,
        )
    assert output.auth is not None
    set_auth_cookies(response, output.auth, auth.settings)
    return LoginResponse(
        status="authenticated",
        token=output.auth.access_token,
        username=output.auth.user.username,
        preferences=output.auth.preferences,
        user=_user_response(output.auth.user),
        csrf_token=output.auth.csrf_token,
    )


@router.post("/mfa/verify", response_model=AuthResponse)
def verify_mfa(
    body: MfaVerifyRequest,
    request: Request,
    response: Response,
    auth: AuthService = Depends(get_auth_service),
):
    result = auth.verify_mfa(
        challenge_id=body.challenge_id,
        method=body.method,
        code=body.code,
        remember_me=body.remember_me,
        ip=_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    set_auth_cookies(response, result, auth.settings)
    return _auth_response(result)


@router.post("/refresh", response_model=AuthResponse)
def refresh_token(
    request: Request,
    response: Response,
    auth: AuthService = Depends(get_auth_service),
):
    token = request.cookies.get(auth.settings.refresh_cookie_name)
    if not token:
        from ..core.errors import InvalidTokenError

        raise InvalidTokenError()
    result = auth.refresh(
        refresh_token=token,
        ip=_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    set_auth_cookies(response, result, auth.settings)
    return _auth_response(result)


@router.post("/logout", status_code=204)
def logout(
    request: Request,
    response: Response,
    session_id: str | None = Depends(optional_session_id),
    auth: AuthService = Depends(get_auth_service),
):
    auth.logout(
        session_id=session_id,
        ip=_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    clear_auth_cookies(response, auth.settings)


@router.get("/me", response_model=AuthResponse)
def me(
    current_user: CurrentUser = Depends(require_user),
    auth: AuthService = Depends(get_auth_service),
):
    body = auth.auth_response_for_user(current_user)
    return AuthResponse(
        token="",
        username=body["username"],
        preferences=body["preferences"],
        user=_user_response(current_user),
    )


@router.put("/preferences", status_code=204)
def update_preferences(
    body: UpdatePreferencesRequest,
    current_user: CurrentUser = Depends(require_user),
    auth: AuthService = Depends(get_auth_service),
):
    auth.update_preferences(user=current_user, preferences=body.preferences)


@router.put("/password", status_code=204)
def change_password(
    body: ChangePasswordRequest,
    request: Request,
    current_user: CurrentUser = Depends(require_user),
    session_id: str | None = Depends(optional_session_id),
    auth: AuthService = Depends(get_auth_service),
):
    auth.change_password(
        user=current_user,
        old_password=body.old_password,
        new_password=body.new_password,
        current_session_id=session_id,
        ip=_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )


@router.post("/password/reset", status_code=204)
def reset_password(
    body: PasswordResetRequest,
    request: Request,
    auth: AuthService = Depends(get_auth_service),
):
    auth.reset_password_with_mfa(
        username=body.username.strip(),
        method=body.method,
        code=body.code,
        new_password=body.new_password,
        ip=_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )


@router.delete("/account", status_code=204)
def delete_account(
    body: DeleteAccountRequest,
    request: Request,
    response: Response,
    current_user: CurrentUser = Depends(require_user),
    auth: AuthService = Depends(get_auth_service),
):
    auth.delete_account(
        user=current_user,
        password=body.password,
        ip=_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    clear_auth_cookies(response, auth.settings)


@router.get("/password-policy", response_model=PasswordPolicyResponse)
def password_policy(auth: AuthService = Depends(get_auth_service)):
    policy = auth.password_policy()
    return PasswordPolicyResponse(
        min_length=policy.min_length,
        require_letter=policy.require_letter,
        require_digit=policy.require_digit,
    )


@router.get("/sessions")
def list_sessions(
    current_user: CurrentUser = Depends(require_user),
    auth: AuthService = Depends(get_auth_service),
):
    return auth.list_sessions(current_user)


@router.delete("/sessions/{session_id}", status_code=204)
def revoke_session(
    session_id: str,
    current_user: CurrentUser = Depends(require_user),
    auth: AuthService = Depends(get_auth_service),
):
    auth.revoke_session(user=current_user, session_id=session_id)


@router.get("/csrf")
def csrf(auth: AuthService = Depends(get_auth_service)):
    return {"csrf_token": auth.csrf_service.create_token()}


@router.get("/mfa")
def mfa_status(
    current_user: CurrentUser = Depends(require_user),
    auth: AuthService = Depends(get_auth_service),
):
    return auth.get_mfa_status(user=current_user)


@router.post("/mfa/totp/setup", response_model=TotpSetupResponse)
def setup_totp(
    current_user: CurrentUser = Depends(require_user),
    auth: AuthService = Depends(get_auth_service),
):
    return auth.start_totp_setup(user=current_user)


@router.post("/mfa/totp/confirm", response_model=RecoveryCodesResponse)
def confirm_totp(
    body: TotpConfirmRequest,
    current_user: CurrentUser = Depends(require_user),
    auth: AuthService = Depends(get_auth_service),
):
    return auth.confirm_totp_setup(
        user=current_user, method_id=body.method_id, code=body.code
    )
