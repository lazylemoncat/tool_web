"""
主题相关 Pydantic schemas.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class ThemeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    config_json: str = Field(min_length=1)


class ThemeUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    config_json: str | None = Field(None, min_length=1)


class ThemeOut(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class ThemeFullOut(ThemeOut):
    config_json: str
