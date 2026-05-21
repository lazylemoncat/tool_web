"""
JWT 认证中间件: 从 httpOnly cookie 或 Authorization header 解析 token 并注入当前用户.
"""

from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..utils.errors import UnauthorizedError
from ..utils.security import decode_token

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = request.cookies.get("token")
    if not token and credentials:
        token = credentials.credentials
    if not token:
        raise UnauthorizedError("Invalid or expired token")

    try:
        payload = decode_token(token)
        user_id = int(payload["sub"])
    except Exception:
        raise UnauthorizedError("Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UnauthorizedError("User not found")

    return user
