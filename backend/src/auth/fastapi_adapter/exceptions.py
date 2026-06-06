"""Exception mapping for auth domain errors."""

from fastapi import Request
from fastapi.responses import JSONResponse

from ..core.errors import AuthError


async def auth_error_handler(request: Request, exc: AuthError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.status_code,
            "error_code": exc.code,
            "message": exc.message,
            "data": None,
        },
    )
