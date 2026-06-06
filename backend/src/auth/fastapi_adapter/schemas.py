"""Pydantic schemas for auth HTTP APIs."""

from typing import Any, Literal

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    password: str = Field(min_length=1, max_length=100)
    remember_me: bool = False


class LoginRequest(BaseModel):
    username: str
    password: str
    remember_me: bool = False


class MfaVerifyRequest(BaseModel):
    challenge_id: str
    method: Literal["totp", "recovery_code"]
    code: str
    remember_me: bool = False


class AuthUserResponse(BaseModel):
    id: int
    username: str
    is_admin: bool = False


class AuthResponse(BaseModel):
    token: str
    username: str
    preferences: dict[str, Any] = {}
    user: AuthUserResponse | None = None
    csrf_token: str | None = None


class LoginResponse(BaseModel):
    status: Literal["authenticated", "mfa_required"]
    token: str | None = None
    username: str | None = None
    preferences: dict[str, Any] = {}
    user: AuthUserResponse | None = None
    csrf_token: str | None = None
    challenge_id: str | None = None
    available_methods: list[str] = []
    expires_in: int | None = None


class UpdatePreferencesRequest(BaseModel):
    preferences: dict[str, Any]


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(min_length=1)
    new_password: str = Field(min_length=1, max_length=100)


class DeleteAccountRequest(BaseModel):
    password: str = Field(min_length=1)


class PasswordPolicyResponse(BaseModel):
    min_length: int
    require_letter: bool
    require_digit: bool


class TotpSetupResponse(BaseModel):
    method_id: str
    otpauth_uri: str


class TotpConfirmRequest(BaseModel):
    method_id: str
    code: str


class RecoveryCodesResponse(BaseModel):
    recovery_codes: list[str]
