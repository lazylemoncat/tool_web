"""
Compatibility dependency for existing business routers.

The reusable auth module exposes require_user; this module preserves the old
get_current_user import path while returning a lightweight CurrentUser object.
"""

from ..auth.fastapi_adapter.dependencies import (
    require_user as get_current_user,
)

__all__ = ["get_current_user"]
