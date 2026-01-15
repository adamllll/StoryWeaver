"""认证路由 - 用户注册和登录"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from collections import defaultdict

from ..database import get_db
from ..config import settings
from ..models import User
from ..schemas import UserCreate, UserLogin, UserResponse, UserWithToken, PasswordReset
from ..utils.auth import create_token, get_current_user
from ..utils.security import hash_password, verify_password
from ..utils.rate_limit import strict_rate_limit

router = APIRouter(prefix="/auth", tags=["认证"])

# 速率限制配置（简单内存存储，生产环境建议使用 Redis）
# 本小姐提醒：这是针对密码重置的安全加固哦！(￣▽￣)ノ
_reset_attempts = defaultdict(list)
RESET_LIMIT = 3  # 最多尝试次数
RESET_WINDOW = 300  # 5分钟窗口（秒）


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@strict_rate_limit  # 本小姐的安全防护：5次/分钟 (￣▽￣)ノ
async def register(
    request: Request,
    response: Response,
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    注册新用户

    参数:
        request: HTTP 请求对象
        response: HTTP 响应对象（用于设置 Cookie）
        user_data: 用户注册数据（用户名、邮箱、密码）
        db: 数据库会话

    返回:
        创建的用户信息（Token 通过 httpOnly Cookie 返回）

    异常:
        HTTPException: 邮箱或用户名已存在时抛出
    """
    # 检查邮箱是否已存在
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已被注册",
        )

    # 检查用户名是否已存在
    existing_username = db.query(User).filter(
        User.username == user_data.username
    ).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该用户名已被占用",
        )

    # 创建新用户
    hashed_password = hash_password(user_data.password)
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        last_login_at=datetime.now(timezone.utc),  # 注册即登录，设置最后登录时间
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 生成令牌（默认记住登录，30天）
    token = create_token(user.id, remember_me=True)
    cookie_secure = not settings.DEBUG

    # 设置 httpOnly Cookie（本小姐的安全防护！防止 XSS 攻击！）(￣▽￣)ノ
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,  # 防止 JavaScript 访问
        secure=cookie_secure,  # 生产环境强制 HTTPS
        samesite="lax",  # CSRF 防护
        max_age=30 * 24 * 60 * 60,  # 30天（秒）
    )

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        avatar=user.avatar,
        bio=user.bio,
        is_admin=user.is_admin,
        created_at=user.created_at,
    )


@router.post("/login", response_model=UserResponse)
@strict_rate_limit  # 本小姐的安全防护：5次/分钟，防止暴力破解！(￣▽￣)ノ
async def login(
    request: Request,
    response: Response,
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    用户登录

    参数:
        request: HTTP 请求对象
        response: HTTP 响应对象（用于设置 Cookie）
        credentials: 登录凭证（邮箱、密码、记住我选项）
        db: 数据库会话

    返回:
        认证用户信息（Token 通过 httpOnly Cookie 返回）

    异常:
        HTTPException: 凭证无效时抛出
    """
    # 通过邮箱查找用户
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
        )

    # 检查用户是否被软删除
    if user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="账户已被删除",
        )

    # 检查用户是否被禁用
    if user.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账户已被禁用",
        )

    # 验证密码
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
        )

    # 更新最后登录时间
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    # 生成令牌（根据记住我选项设置有效期）
    token = create_token(user.id, credentials.remember_me)
    cookie_secure = not settings.DEBUG

    # 设置 httpOnly Cookie（本小姐的安全防护！防止 XSS 攻击！）(￣▽￣)ノ
    max_age = 30 * 24 * 60 * 60 if credentials.remember_me else 24 * 60 * 60  # 30天或1天
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,  # 防止 JavaScript 访问
        secure=cookie_secure,  # 生产环境强制 HTTPS
        samesite="lax",  # CSRF 防护
        max_age=max_age,
    )

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        avatar=user.avatar,
        bio=user.bio,
        is_admin=user.is_admin,
        created_at=user.created_at,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    获取当前登录用户信息

    参数:
        current_user: 从 JWT 解析的认证用户

    返回:
        当前用户的个人资料
    """
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        avatar=current_user.avatar,
        bio=current_user.bio,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at,
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):
    """
    用户登出

    参数:
        response: HTTP 响应对象（用于清除 Cookie）

    返回:
        成功消息

    说明:
        清除 httpOnly Cookie，实现安全登出（本小姐的安全设计！）(￣▽￣)ノ
    """
    # 清除 httpOnly Cookie
    cookie_secure = not settings.DEBUG
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=cookie_secure,  # 生产环境强制 HTTPS
        samesite="lax",
    )

    return {"message": "登出成功"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
@strict_rate_limit  # 本小姐的安全防护：5次/分钟，防止密码重置滥用！(￣▽￣)ノ
async def reset_password(request: Request, reset_data: PasswordReset, db: Session = Depends(get_db)):
    """
    重置用户密码（通过用户名和邮箱验证）

    参数:
        reset_data: 密码重置数据（用户名、邮箱、新密码）
        db: 数据库会话

    返回:
        成功消息

    异常:
        HTTPException: 用户名和邮箱不匹配时抛出
        HTTPException: 请求过于频繁时抛出（429）
    """
    # 速率限制检查（本小姐的安全防护！）
    key = f"{reset_data.username}:{reset_data.email}"
    now = datetime.now(timezone.utc)

    # 清理过期记录
    _reset_attempts[key] = [
        ts for ts in _reset_attempts[key]
        if (now - ts).total_seconds() < RESET_WINDOW
    ]

    # 检查是否超过限制
    if len(_reset_attempts[key]) >= RESET_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"重置密码请求过于频繁，请在{RESET_WINDOW // 60}分钟后再试",
        )

    # 记录本次尝试
    _reset_attempts[key].append(now)

    # 通过用户名和邮箱查找用户
    user = db.query(User).filter(
        User.username == reset_data.username,
        User.email == reset_data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户名和邮箱不匹配，请检查输入信息",
        )

    # 更新密码
    user.password_hash = hash_password(reset_data.new_password)
    db.commit()

    return {"message": "密码重置成功，请使用新密码登录"}
