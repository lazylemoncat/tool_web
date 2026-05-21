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

from .database import init_db
from .middleware.logging import log_requests
from .routers import folder, todo, auth, theme, tag, finance
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
    request_max_size=1_048_576,  # 1MB
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
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

app.include_router(folder.router)
app.include_router(todo.router)
app.include_router(auth.router)
app.include_router(theme.router)
app.include_router(tag.router)
app.include_router(finance.router)


@app.get("/api/health")
def health():
    return {"code": 0, "message": "ok"}
