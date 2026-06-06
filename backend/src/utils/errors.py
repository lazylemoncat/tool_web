"""Unified exception classes and FastAPI handlers."""

from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    """基础业务异常. status_code 同时作为响应中的 code 字段."""

    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail


class BadRequestError(AppError):
    """400 - 请求参数有误."""

    def __init__(self, detail: str):
        super().__init__(400, detail)


class UnauthorizedError(AppError):
    """401 - 认证失败."""

    def __init__(self, detail: str = "Invalid or expired token"):
        super().__init__(401, detail)


class ForbiddenError(AppError):
    """403 - 无权访问."""

    def __init__(self, detail: str = "Access denied"):
        super().__init__(403, detail)


class NotFoundError(AppError):
    """404 - 资源不存在."""

    def __init__(self, entity: str):
        super().__init__(404, f"{entity} not found")


class ConflictError(AppError):
    """409 - 资源冲突 (如用户名已存在)."""

    def __init__(self, detail: str):
        super().__init__(409, detail)


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.status_code, "message": exc.detail, "data": None},
    )
