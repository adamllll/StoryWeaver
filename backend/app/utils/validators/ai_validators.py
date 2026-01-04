"""
AI 响应验证器 - 验证 AI 生成内容的质量

这个模块包含所有 AI 响应验证相关的逻辑。
遵循单一职责原则（Single Responsibility Principle）。
"""
import re
from typing import Optional
from ..utils.text_processor import TextProcessor


class AIResponseValidator:
    """AI 响应验证器"""

    @staticmethod
    def validate_chapter_content(
        content: str,
        min_words: int = 100,
        max_words: Optional[int] = None
    ) -> bool:
        """
        验证章节内容是否符合要求

        参数:
            content: 章节内容
            min_words: 最小字数
            max_words: 最大字数（可选）

        返回:
            True 如果验证通过
        """
        if not content or not content.strip():
            return False

        # 计算字数
        word_count = len(content.strip())

        # 检查最小字数
        if word_count < min_words:
            return False

        # 检查最大字数（如果指定）
        if max_words and word_count > max_words:
            return False

        # 检查是否包含实际内容（不只是空白和标点）
        text_only = re.sub(r'[^\w\u4e00-\u9fff]', '', content)
        if len(text_only) < min_words * 0.5:  # 至少50%是实际文字
            return False

        return True

    @staticmethod
    def validate_title(title: str, allow_generic: bool = False) -> bool:
        """
        验证标题是否符合要求

        参数:
            title: 标题
            allow_generic: 是否允许通用标题（如"第一章"）

        返回:
            True 如果验证通过
        """
        if not title or not title.strip():
            return False

        # 检查长度
        if len(title.strip()) < 2:
            return False

        if len(title.strip()) > 100:
            return False

        # 检查是否为通用标题
        if not allow_generic and TextProcessor.is_generic_chapter_title(title):
            return False

        return True

    @staticmethod
    def validate_json_structure(json_str: str, required_keys: list[str]) -> bool:
        """
        验证 JSON 结构是否包含必需的键

        参数:
            json_str: JSON 字符串
            required_keys: 必需的键列表

        返回:
            True 如果验证通过
        """
        if not json_str:
            return False

        try:
            import json
            data = json.loads(json_str)

            # 检查必需的键
            for key in required_keys:
                if key not in data:
                    return False

            return True

        except (json.JSONDecodeError, TypeError):
            return False

    @staticmethod
    def validate_outline(outline: str) -> bool:
        """
        验证大纲是否符合要求

        参数:
            outline: 大纲内容

        返回:
            True 如果验证通过
        """
        if not outline or not outline.strip():
            return False

        # 大纲应该至少包含一些章节信息
        # 检查是否包含章节标记
        chapter_patterns = [
            r'第.+章',  # 第一章
            r'Chapter\s+\d+',  # Chapter 1
            r'##\s+',  # Markdown 二级标题
        ]

        for pattern in chapter_patterns:
            if re.search(pattern, outline, re.IGNORECASE):
                return True

        # 或者至少有一定长度的内容
        return len(outline.strip()) >= 200

    @staticmethod
    def validate_character_info(character_data: dict) -> bool:
        """
        验证角色信息是否完整

        参数:
            character_data: 角色数据字典

        返回:
            True 如果验证通过
        """
        required_fields = ['name', 'role_type', 'description']

        for field in required_fields:
            if field not in character_data:
                return False

            value = character_data[field]
            if not value or not str(value).strip():
                return False

        # 验证角色类型
        valid_role_types = ['protagonist', 'antagonist', 'supporting', 'minor']
        if character_data['role_type'] not in valid_role_types:
            return False

        return True
