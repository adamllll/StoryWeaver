"""
速率限制工具 - 为敏感端点提供速率限制装饰器

本小姐的安全防护：防止暴力破解和 DDoS 攻击！(￣▽￣)ノ
"""
from functools import wraps
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


# 创建全局 limiter 实例
limiter = Limiter(key_func=get_remote_address)


def rate_limit(limit_string: str):
    """
    速率限制装饰器工厂

    参数:
        limit_string: 速率限制字符串，例如 "5/minute", "10/hour"

    返回:
        装饰器函数

    使用示例:
        @rate_limit("5/minute")
        async def login(request: Request, ...):
            ...
    """
    def decorator(func):
        @wraps(func)
        @limiter.limit(limit_string)
        async def wrapper(request: Request, *args, **kwargs):
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator


# 预定义的速率限制装饰器（本小姐的推荐配置！）
def strict_rate_limit(func):
    """
    严格速率限制：5次/分钟
    适用于：登录、注册、密码重置等敏感操作
    """
    return limiter.limit("5/minute")(func)


def moderate_rate_limit(func):
    """
    中等速率限制：20次/分钟
    适用于：创建资源、更新资源等一般操作
    """
    return limiter.limit("20/minute")(func)


def relaxed_rate_limit(func):
    """
    宽松速率限制：60次/分钟
    适用于：查询操作、读取资源等频繁操作
    """
    return limiter.limit("60/minute")(func)


# AI 生成专用速率限制（防止 API 滥用）
def ai_generation_rate_limit(func):
    """
    AI 生成速率限制：10次/分钟，100次/小时
    适用于：AI 续写、扩写、生成等消耗 API 配额的操作

    本小姐特别提醒：AI API 很贵的，要省着用！(￣ε ￣*)
    """
    return limiter.limit("10/minute;100/hour")(func)
