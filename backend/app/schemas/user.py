"""用户数据模式 - API 请求/响应验证"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional

from ..utils.password_validator import validate_password_strength


class UserBase(BaseModel):
    """用户基础模式 - 包含公共字段"""

    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    """用户注册模式"""

    password: str = Field(..., min_length=8, description="密码（至少8位，包含大写字母、小写字母和数字）")

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """验证密码强度 - 本小姐的安全要求！(￣▽￣)ノ"""
        return validate_password_strength(v)


class UserLogin(BaseModel):
    """用户登录模式"""

    email: EmailStr
    password: str = Field(..., min_length=1)
    remember_me: bool = False


class UserResponse(UserBase):
    """用户响应模式 - 公开信息"""

    id: int
    avatar: Optional[str] = None
    bio: Optional[str] = None
    is_admin: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class UserWithToken(UserResponse):
    """登录/注册响应模式 - 包含令牌（扁平化结构）"""

    token: str


class TokenPayload(BaseModel):
    """JWT 令牌载荷模式"""

    sub: str  # 用户 ID（字符串形式）
    exp: datetime
    iat: datetime


class PasswordReset(BaseModel):
    """密码重置模式"""

    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    new_password: str = Field(..., min_length=8, description="新密码（至少8位，包含大写字母、小写字母和数字）")

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        """验证新密码强度 - 本小姐的安全要求！(￣▽￣)ノ"""
        return validate_password_strength(v)
