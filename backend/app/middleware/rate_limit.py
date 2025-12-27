"""速率限制中间件"""
import time
from collections import defaultdict
from fastapi import HTTPException, status

from ..config import settings


class RateLimiter:
    """简单的内存速率限制器（滑动窗口）"""

    def __init__(self, requests_per_minute: int = 5):
        self.requests_per_minute = requests_per_minute
        self.requests: dict[int, list[float]] = defaultdict(list)

    def check(self, user_id: int, cost: int = 1) -> None:
        """
        检查用户是否超过速率限制

        Args:
            user_id: 用户ID
            cost: 本次请求消耗的配额（默认1，批量操作可以设置更高）

        Raises:
            HTTPException: 429 Too Many Requests
        """
        now = time.time()
        window_start = now - 60

        # 清理过期记录
        self.requests[user_id] = [
            t for t in self.requests[user_id] if t > window_start
        ]

        # 检查是否超限（考虑本次请求的 cost）
        if len(self.requests[user_id]) + cost > self.requests_per_minute:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"请求过于频繁，请稍后再试（限制：{self.requests_per_minute}次/分钟）",
            )

        # 记录本次请求（根据 cost 添加多条记录）
        for _ in range(cost):
            self.requests[user_id].append(now)


# 全局 AI 速率限制器实例
ai_rate_limiter = RateLimiter(requests_per_minute=settings.AI_REQUESTS_PER_MINUTE)
