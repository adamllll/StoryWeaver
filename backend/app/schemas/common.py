"""通用响应模式"""
from pydantic import BaseModel
from typing import TypeVar, Generic, Optional, Any

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """标准 API 响应封装"""

    code: int = 200
    message: str = "success"
    data: Optional[T] = None


class ErrorResponse(BaseModel):
    """错误响应模式"""

    code: int
    message: str
    detail: Optional[str] = None
