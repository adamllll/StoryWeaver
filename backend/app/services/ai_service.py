"""AI 服务 - 使用 OpenAI/Claude API 进行内容生成"""
import json
import logging
from typing import Optional, Literal
from openai import AsyncOpenAI, APIError, APIConnectionError, RateLimitError

from ..config import settings
from ..schemas import AIUsage

# 设置日志
logger = logging.getLogger(__name__)

# 任务类型定义
TaskType = Literal["outline", "continue", "expand", "character", "branch"]

# 导入 tenacity 用于重试
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)


def create_retry_decorator(max_attempts: int = 3):
    """
    创建带有日志记录的重试装饰器

    参数:
        max_attempts: 最大重试次数（默认3次）

    返回:
        配置好的 tenacity 重试装饰器
    """
    return retry(
        # 重试条件：API 错误、连接错误、速率限制
        retry=retry_if_exception_type((APIError, APIConnectionError, RateLimitError)),
        # 最大尝试次数
        stop=stop_after_attempt(max_attempts),
        # 指数退避：1秒 -> 2秒 -> 4秒，最大10秒
        wait=wait_exponential(multiplier=1, min=1, max=10),
        # 重试前记录日志
        before_sleep=before_sleep_log(logger, logging.WARNING),
        # 重新抛出最后一个异常
        reraise=True,
    )


class AIService:
    """AI 内容生成服务"""

    def __init__(self):
        """初始化 AI 客户端"""
        self.openai_client = None
        if settings.OPENAI_API_KEY:
            self.openai_client = AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_BASE_URL,
            )
            logger.info("AI 服务初始化完成 (AsyncOpenAI)")
        else:
            logger.warning("OPENAI_API_KEY 未配置，AI 服务不可用")

    @create_retry_decorator(max_attempts=3)
    async def _call_api(
        self,
        model: str,
        messages: list,
        max_tokens: int,
        temperature: float,
    ) -> tuple[str, AIUsage]:
        """
        调用 OpenAI API（带自动重试机制）

        使用 tenacity 装饰器实现：
        - 最多重试 3 次
        - 指数退避等待（1s -> 2s -> 4s）
        - 仅对 API 错误、连接错误、速率限制进行重试
        """
        response = await self.openai_client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )

        content = response.choices[0].message.content

        # 处理空内容的情况
        if content is None:
            content = ""

        usage = AIUsage(
            prompt_tokens=response.usage.prompt_tokens,
            completion_tokens=response.usage.completion_tokens,
            total_tokens=response.usage.total_tokens,
        )

        return content, usage

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 4000,
        temperature: float = 0.7,
        task: Optional[TaskType] = None,
    ) -> tuple[str, AIUsage]:
        """
        使用 AI 生成内容

        参数:
            system_prompt: 定义 AI 行为的系统提示词
            user_prompt: 用户的请求
            max_tokens: 最大生成令牌数
            temperature: 创意度（0-1）
            task: 任务类型，用于选择对应模型（outline/continue/expand/character/branch）

        返回:
            元组（生成的内容, 使用量信息）

        异常:
            Exception: AI 服务不可用或调用失败时抛出
        """
        if not self.openai_client:
            raise Exception("AI 服务未配置，请设置 OPENAI_API_KEY")

        # 根据任务类型选择模型
        model = settings.get_model(task) if task else settings.OPENAI_MODEL

        logger.info(f"AI 请求开始: task={task}, model={model}, max_tokens={max_tokens}")

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        try:
            # 使用带重试机制的 API 调用
            content, usage = await self._call_api(model, messages, max_tokens, temperature)

            logger.info(f"AI 请求成功: task={task}, tokens={usage.total_tokens}")
            return content, usage

        except Exception as e:
            logger.error(f"AI 请求失败: task={task}, error={str(e)}")
            raise Exception(f"AI 生成失败: {str(e)}")

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 4000,
        temperature: float = 0.7,
        task: Optional[TaskType] = None,
    ) -> tuple[dict, AIUsage]:
        """
        生成内容并解析为 JSON

        参数:
            system_prompt: 定义 AI 行为的系统提示词
            user_prompt: 用户的请求
            max_tokens: 最大生成令牌数
            temperature: 创意度（0-1）
            task: 任务类型，用于选择对应模型

        返回:
            元组（解析后的 JSON, 使用量信息）

        异常:
            Exception: AI 服务失败或 JSON 解析失败时抛出
        """
        content, usage = await self.generate(
            system_prompt, user_prompt, max_tokens, temperature, task
        )

        # 尝试从响应中提取 JSON
        try:
            original_content = content  # 保存原始内容用于日志

            # 处理 Markdown 代码块
            if "```json" in content:
                start = content.find("```json") + 7
                end = content.find("```", start)
                content = content[start:end].strip()
            elif "```" in content:
                start = content.find("```") + 3
                end = content.find("```", start)
                content = content[start:end].strip()

            result = json.loads(content)
            logger.debug(f"JSON 解析成功: keys={list(result.keys()) if isinstance(result, dict) else f'array[{len(result)}]'}")
            return result, usage

        except json.JSONDecodeError as e:
            # 记录详细的错误信息便于调试
            logger.error(
                f"JSON 解析失败: {str(e)}",
                extra={
                    "raw_response_preview": original_content[:500] if 'original_content' in dir() else content[:500],
                    "task": task,
                }
            )
            raise Exception(f"AI 响应 JSON 解析失败: {str(e)}\n原始响应预览: {content[:200]}...")

    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 2500,
        temperature: float = 0.7,
        task: Optional[TaskType] = None,
    ) -> tuple[str, AIUsage]:
        """
        生成纯文本内容（不进行JSON解析）

        参数:
            system_prompt: 定义 AI 行为的系统提示词
            user_prompt: 用户的请求
            max_tokens: 最大生成令牌数
            temperature: 创意度（0-1）
            task: 任务类型，用于选择对应模型

        返回:
            元组（生成的文本, 使用量信息）

        异常:
            Exception: AI 服务不可用或调用失败时抛出
        """
        content, usage = await self.generate(
            system_prompt, user_prompt, max_tokens, temperature, task
        )
        return content, usage


# 单例实例
ai_service = AIService()
