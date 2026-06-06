"""
Simple in-memory IP rate limiter for auth endpoints.
"""

import time
from collections import defaultdict
from collections.abc import Callable

from fastapi import Request
from fastapi.responses import JSONResponse

RATE_LIMIT_REQUESTS = 5
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_PATHS = {
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/password",
    "/api/v1/auth/account",
}

_attempts: dict[str, list[float]] = defaultdict(list)


def _prune(now: float) -> Callable[[str], None]:
    def prune(key: str) -> None:
        cutoff = now - RATE_LIMIT_WINDOW
        _attempts[key] = [t for t in _attempts[key] if t > cutoff]
        if not _attempts[key]:
            del _attempts[key]

    return prune


async def rate_limit_middleware(request: Request, call_next):
    if request.url.path in RATE_LIMIT_PATHS:
        now = time.time()
        key = request.client.host if request.client else "unknown"
        prune = _prune(now)
        prune(key)

        if len(_attempts[key]) >= RATE_LIMIT_REQUESTS:
            return JSONResponse(
                status_code=429,
                content={
                    "code": 429,
                    "message": "Too many requests, please try again later",
                    "data": None,
                },
            )

        _attempts[key].append(now)

    return await call_next(request)
