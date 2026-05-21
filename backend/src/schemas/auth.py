"""
认证相关 Pydantic 模型.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Any
import re


class RegisterRequest(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    password: str = Field(min_length=8, max_length=100)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[a-zA-Z]", v) or not re.search(r"\d", v):
            raise ValueError(
                "Password must be at least 8 characters with at least 1 letter and 1 digit"
            )
        return v


class LoginRequest(BaseModel):
    username: str
    password: str
    remember_me: bool = False


class AuthResponse(BaseModel):
    token: str
    username: str
    preferences: dict[str, Any] = {}


class UpdatePreferencesRequest(BaseModel):
    preferences: dict[str, Any]


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=100)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[a-zA-Z]", v) or not re.search(r"\d", v):
            raise ValueError(
                "Password must be at least 8 characters with at least 1 letter and 1 digit"
            )
        return v


class DeleteAccountRequest(BaseModel):
    password: str = Field(min_length=1)
