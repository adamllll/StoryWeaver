"""JWT 认证工具"""
from datetime import datetime, timedelta
from typing import Optional

from jose import jwt, JWTError
from fastapi import HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import User


# 自定义 HTTPBearer，返回 401 而不是 403
class CustomHTTPBearer(HTTPBearer):
    """自定义 Bearer 认证，未认证时返回 401 而不是 403"""
    async def __call__(self, request: Request) -> Optional[HTTPAuthorizationCredentials]:
        try:
            return await super().__call__(request)
        except HTTPException as e:
            if e.status_code == 403:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="未提供认证令牌",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            raise


# Bearer 令牌安全方案
security = CustomHTTPBearer()


def create_token(user_id: int, remember_me: bool = False) -> str:
    """
    为用户创建 JWT 令牌

    参数:
        user_id: 用户的数据库 ID
        remember_me: 是否记住登录状态（True: 30天, False: 1天）

    返回:
        编码后的 JWT 令牌字符串
    """
    # 记住我：30天，否则：1天
    expire_days = 30 if remember_me else 1
    expire = datetime.utcnow() + timedelta(days=expire_days)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    return jwt.encode(
        payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def decode_token(token: str) -> int:
    """
    解码并验证 JWT 令牌

    参数:
        token: JWT 令牌字符串

    返回:
        令牌中的用户 ID

    异常:
        HTTPException: 令牌无效或已过期时抛出
    """
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = int(payload.get("sub"))
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="令牌无效或已过期",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    依赖注入：获取当前已认证的用户

    参数:
        credentials: HTTP Authorization 请求头
        db: 数据库会话

    返回:
        已认证的用户对象

    异常:
        HTTPException: 认证失败时抛出
    """
    token = credentials.credentials
    user_id = decode_token(token)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
        )

    return user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    依赖注入：可选获取当前用户（用于公开端点）

    参数:
        credentials: HTTP Authorization 请求头（可选）
        db: 数据库会话

    返回:
        已认证则返回用户对象，否则返回 None
    """
    if not credentials:
        return None

    try:
        token = credentials.credentials
        user_id = decode_token(token)
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except HTTPException:
        return None
