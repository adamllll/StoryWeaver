"""
通用重试服务 - 处理 AI 生成的重试逻辑

这个服务封装了所有 AI 生成相关的重试逻辑，避免代码重复。
遵循 DRY 原则（Don't Repeat Yourself）。
"""
from typing import Callable, Optional, TypeVar, Tuple, Any
from dataclasses import dataclass
import logging

from ..schemas.ai import AIUsage

logger = logging.getLogger(__name__)

T = TypeVar('T')


@dataclass
class RetryConfig:
    """重试配置"""
    max_retries: int = 3
    on_retry_callback: Optional[Callable[[int, str], None]] = None


class AIRetryService:
    """AI 生成重试服务

    提供统一的重试机制，用于所有 AI 生成操作。
    """

    def __init__(self):
        self.logger = logger

    async def retry_with_validation(
        self,
        generate_fn: Callable[[], Tuple[str, AIUsage]],
        validate_fn: Callable[[str], bool],
        config: RetryConfig,
        operation_name: str = "AI生成"
    ) -> Tuple[str, AIUsage]:
        """
        带验证的重试逻辑

        参数:
            generate_fn: 生成函数，返回 (内容, 使用量)
            validate_fn: 验证函数，返回 True 表示验证通过
            config: 重试配置
            operation_name: 操作名称（用于日志）

        返回:
            (生成的内容, 累计使用量)

        异常:
            Exception: 重试次数用尽后仍失败
        """
        total_usage = None
        last_error = None
        last_content = None

        for attempt in range(config.max_retries):
            try:
                self.logger.info(f"{operation_name} - 第 {attempt + 1}/{config.max_retries} 次尝试")

                # 调用生成函数
                content, usage = await generate_fn()
                last_content = content

                # 累计 token 使用量
                total_usage = self._accumulate_usage(total_usage, usage)

                # 验证结果
                if validate_fn(content):
                    self.logger.info(f"{operation_name} - 验证通过")
                    return content, total_usage

                # 验证失败，准备重试
                self.logger.warning(f"{operation_name} - 验证失败，准备重试")

                if config.on_retry_callback:
                    config.on_retry_callback(attempt, content)

            except Exception as e:
                last_error = e
                self.logger.error(f"{operation_name} - 第 {attempt + 1} 次尝试失败: {str(e)}")

        # 所有重试都失败了
        error_msg = f"{operation_name}重试 {config.max_retries} 次后仍失败"
        if last_error:
            error_msg += f": {str(last_error)}"
        elif last_content:
            error_msg += f"，最后一次生成的内容验证失败"

        raise Exception(error_msg)

    def _accumulate_usage(
        self,
        total: Optional[AIUsage],
        current: AIUsage
    ) -> AIUsage:
        """累计 token 使用量"""
        if total is None:
            return current

        return AIUsage(
            prompt_tokens=total.prompt_tokens + current.prompt_tokens,
            completion_tokens=total.completion_tokens + current.completion_tokens,
            total_tokens=total.total_tokens + current.total_tokens,
        )
