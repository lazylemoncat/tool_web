"""
请求日志中间件: 记录 method, path, status, duration 到控制台和文件。
日志文件: backend/logs/app.log (自动轮转, 保留5个文件, 每个最大5MB)
"""

import logging
import os
import time
from logging.handlers import RotatingFileHandler

from fastapi import Request

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "logs")

_logger: logging.Logger | None = None


def _get_logger() -> logging.Logger:
    global _logger
    if _logger is not None:
        return _logger

    _logger = logging.getLogger("tool_web")
    _logger.setLevel(getattr(logging, LOG_LEVEL, logging.INFO))

    if not _logger.handlers:
        fmt = logging.Formatter(
            "%(asctime)s | %(levelname)-5s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

        console = logging.StreamHandler()
        console.setFormatter(fmt)
        _logger.addHandler(console)

        os.makedirs(LOG_DIR, exist_ok=True)
        file_handler = RotatingFileHandler(
            os.path.join(LOG_DIR, "app.log"),
            maxBytes=5 * 1024 * 1024,
            backupCount=5,
            encoding="utf-8",
        )
        file_handler.setFormatter(fmt)
        _logger.addHandler(file_handler)

    return _logger


_security_logger: logging.Logger | None = None


def get_security_logger() -> logging.Logger:
    """Returns a logger for security events."""
    global _security_logger
    if _security_logger is not None:
        return _security_logger

    _security_logger = logging.getLogger("tool_web.security")
    _security_logger.setLevel(logging.INFO)

    if not _security_logger.handlers:
        fmt = logging.Formatter(
            "%(asctime)s | SECURITY | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        console = logging.StreamHandler()
        console.setFormatter(fmt)
        _security_logger.addHandler(console)

        os.makedirs(LOG_DIR, exist_ok=True)
        file_handler = RotatingFileHandler(
            os.path.join(LOG_DIR, "app.log"),
            maxBytes=5 * 1024 * 1024,
            backupCount=5,
            encoding="utf-8",
        )
        file_handler.setFormatter(fmt)
        _security_logger.addHandler(file_handler)

    return _security_logger


async def log_requests(request: Request, call_next):
    logger = _get_logger()
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 2)

    logger.info(
        "%s %s | %d | %.2fms",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response
