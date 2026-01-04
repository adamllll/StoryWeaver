"""AI 服务 - 使用 OpenAI/Claude API 进行内容生成"""
import json
import logging
from typing import Optional, Literal
from fastapi import HTTPException, status
from openai import AsyncOpenAI, APIError, APIConnectionError, RateLimitError, BadRequestError, InternalServerError

from ..config import settings
from ..schemas import AIUsage

# 设置日志
logger = logging.getLogger(__name__)

# 任务类型定义
TaskType = Literal["outline", "continue", "expand", "rewrite", "character", "branch"]

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
        # 重试条件：连接错误、速率限制、服务端错误(5xx)
        retry=retry_if_exception_type((APIConnectionError, RateLimitError, InternalServerError)),
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

    @staticmethod
    def _build_extra_body(model: str, max_tokens: int) -> dict | None:
        """
        构建兼容层额外参数（适配非 OpenAI 原生模型）

        部分 OpenAI 兼容网关会忽略 max_tokens，但支持 max_output_tokens。
        """
        if not model:
            return None

        model_name = model.lower()
        if "gemini" in model_name:
            return {"max_output_tokens": max_tokens}

        return None

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
        extra_body = self._build_extra_body(model, max_tokens)

        response = await self.openai_client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            extra_body=extra_body,
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

        except BadRequestError as e:
            # 捕获 OpenAI 内容安全策略错误
            error_msg = str(e).lower()
            # 检测内容安全相关的关键词
            safety_keywords = ["policy", "safety", "content", "filter", "moderation", "flagged"]
            if any(keyword in error_msg for keyword in safety_keywords):
                logger.warning(f"内容安全违规: task={task}, error={str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "content_policy_violation",
                        "message": "生成失败：内容违反了AI安全策略，请调整提示词或剧情走向。",
                        "original_error": str(e)
                    }
                )
            # 其他 Bad Request (如 context length exceeded)
            logger.warning(f"AI 请求无效: task={task}, error={str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "invalid_request",
                    "message": f"AI 请求无效: {str(e)}"
                }
            )

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
        fallback_to_text: bool = False,
    ) -> tuple[dict, AIUsage]:
        """
        生成内容并解析为 JSON

        参数:
            system_prompt: 定义 AI 行为的系统提示词
            user_prompt: 用户的请求
            max_tokens: 最大生成令牌数
            temperature: 创意度（0-1）
            task: 任务类型，用于选择对应模型
            fallback_to_text: 如果为 True，在 JSON 解析失败时返回包含原始文本的字典而不是抛出异常

        返回:
            元组（解析后的 JSON, 使用量信息）
            如果 fallback_to_text=True 且 JSON 解析失败，返回 {"_raw_text": 原始内容, "_parse_error": 错误信息}

        异常:
            Exception: AI 服务失败或 JSON 解析失败时抛出（仅当 fallback_to_text=False）
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
            # 尝试修复常见的 JSON 问题
            fixed_content = self._try_fix_json(content)
            if fixed_content:
                try:
                    result = json.loads(fixed_content)
                    logger.info(f"JSON 修复成功: task={task}")
                    return result, usage
                except json.JSONDecodeError:
                    pass  # 修复失败，继续原有逻辑

            # 记录详细的错误信息便于调试
            logger.error(
                f"JSON 解析失败: {str(e)}",
                extra={
                    "raw_response_preview": original_content[:500] if 'original_content' in dir() else content[:500],
                    "task": task,
                }
            )

            # 如果启用了降级模式，返回包含原始文本的字典
            if fallback_to_text:
                logger.warning(f"JSON 解析失败，降级返回原始文本: task={task}")
                return {"_raw_text": original_content, "_parse_error": str(e)}, usage

            # 抛出可重试的错误，带有特定错误码
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "code": "json_parse_error",
                    "message": "AI 响应格式异常，请点击重新生成",
                    "retryable": True,
                    "original_error": str(e),
                    "response_preview": content[:200] if content else ""
                }
            )

    def _try_fix_json(self, content: str) -> Optional[str]:
        """
        尝试修复常见的 JSON 格式问题

        返回:
            修复后的 JSON 字符串，如果无法修复则返回 None
        """
        if not content:
            return None

        import re

        fixed = content.strip()

        # 1. 移除可能的前缀文字（AI 有时会添加说明）
        json_start = fixed.find('{')
        if json_start > 0:
            fixed = fixed[json_start:]

        # 2. 替换中文引号（在其他处理之前）
        fixed = fixed.replace('"', '"').replace('"', '"')
        fixed = fixed.replace(''', "'").replace(''', "'")

        # 3. 修复单引号属性名（将 'key': 替换为 "key":）
        fixed = re.sub(r"'([^']+)'(\s*):", r'"\1"\2:', fixed)

        # 4. 移除尾部逗号（JSON 不允许）
        fixed = re.sub(r',(\s*[}\]])', r'\1', fixed)

        # 5. 移除注释（// 和 /* */）
        fixed = re.sub(r'//.*?$', '', fixed, flags=re.MULTILINE)
        fixed = re.sub(r'/\*.*?\*/', '', fixed, flags=re.DOTALL)

        # 6. 尝试找到完整的 JSON 对象
        brace_count = 0
        json_end = -1
        for i, char in enumerate(fixed):
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    json_end = i + 1
                    break

        if json_end > 0:
            fixed = fixed[:json_end]

        # 7. 修复被截断的 JSON（尝试补全）
        if fixed and not fixed.rstrip().endswith('}'):
            # 计算缺少的闭合括号
            open_braces = fixed.count('{') - fixed.count('}')
            open_brackets = fixed.count('[') - fixed.count(']')

            # 尝试在最后一个完整的值后截断并补全
            # 找最后一个逗号或冒号后的位置
            last_comma = fixed.rfind(',')
            last_colon = fixed.rfind(':')

            if last_comma > last_colon and last_comma > len(fixed) - 100:
                # 在最后一个逗号处截断
                fixed = fixed[:last_comma]

            # 补全缺少的括号
            fixed += ']' * open_brackets + '}' * open_braces

        # 8. 修复未转义的换行符（在字符串值内）
        # 这是一个简化的处理，可能不完美
        fixed = re.sub(r'(?<!\\)\n(?=[^"]*"[^"]*$)', '\\n', fixed)

        return fixed if fixed != content else None

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
