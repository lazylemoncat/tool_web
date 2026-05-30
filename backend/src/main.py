"""
FastAPI 入口: CORS 配置, 路由注册, 日志中间件, 数据库初始化.
"""

import os

from contextlib import asynccontextmanager
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .auth.core.errors import AuthError
from .auth.fastapi_adapter.exceptions import auth_error_handler
from .auth.fastapi_adapter.router import router as auth_router
from .database import init_db
from .middleware.logging import log_requests
from .routers import folder, todo, theme, tag, finance
from .utils.errors import AppError, app_error_handler
from .utils.rate_limit import rate_limit_middleware

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:8003"
).split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Tool Web API",
    version="1.0.0",
    lifespan=lifespan,
    request_max_size=10_485_760,  # 10MB
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
)

app.middleware("http")(log_requests)
app.middleware("http")(rate_limit_middleware)


async def validation_error_handler(request: Request, exc: RequestValidationError):
    messages = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err["loc"])
        messages.append(f"{loc}: {err['msg']}")
    return JSONResponse(
        status_code=422,
        content={"code": 422, "message": "; ".join(messages), "data": None},
    )


async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.status_code, "message": exc.detail, "data": None},
    )


app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(AuthError, auth_error_handler)

app.include_router(auth_router)
app.include_router(folder.router)
app.include_router(todo.router)
app.include_router(theme.router)
app.include_router(tag.router)
app.include_router(finance.router)

uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/api/health")
def health():
    return {"code": 0, "message": "ok"}
