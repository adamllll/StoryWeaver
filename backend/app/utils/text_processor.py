"""
文本处理工具 - 处理 AI 生成内容的各种文本操作

这个模块包含所有文本处理相关的工具函数，避免在 Router 中重复代码。
遵循 DRY 原则和单一职责原则。
"""
import re
from typing import Tuple, Optional
from bs4 import BeautifulSoup


class TextProcessor:
    """文本处理工具类"""

    @staticmethod
    def html_to_text(html: str) -> str:
        """
        将 HTML 转换为纯文本

        参数:
            html: HTML 字符串

        返回:
            纯文本字符串
        """
        if not html:
            return ""

        soup = BeautifulSoup(html, "html.parser")

        # 移除 script 和 style 标签
        for script in soup(["script", "style"]):
            script.decompose()

        # 获取文本
        text = soup.get_text()

        # 清理多余的空白
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = " ".join(chunk for chunk in chunks if chunk)

        return text

    @staticmethod
    def extract_title_and_content(markdown_text: str) -> Tuple[str, str]:
        """
        从 Markdown 文本中提取标题和正文

        参数:
            markdown_text: Markdown 格式的文本

        返回:
            (标题, 正文) 元组
        """
        if not markdown_text:
            return "", ""

        lines = markdown_text.strip().split("\n")
        title = ""
        content_lines = []
        found_title = False

        for line in lines:
            stripped = line.strip()

            # 查找第一个标题
            if not found_title and stripped.startswith("#"):
                # 提取标题文本（移除 # 符号）
                title = re.sub(r"^#+\s*", "", stripped).strip()
                found_title = True
                continue

            # 跳过空行（在找到标题之前）
            if not found_title and not stripped:
                continue

            # 收集正文
            if found_title:
                content_lines.append(line)

        content = "\n".join(content_lines).strip()

        return title, content

    @staticmethod
    def normalize_title(title: str) -> str:
        """
        标准化章节标题，移除格式标记和特殊字符

        参数:
            title: 原始标题

        返回:
            标准化后的标题（小写，无特殊字符）
        """
        if not title:
            return ""

        # 移除 Markdown 标题标记
        cleaned = re.sub(r"^#+\s*", "", title).strip()

        # 移除特殊字符，只保留字母、数字、中文
        cleaned = re.sub(r"[^\w\u4e00-\u9fff\s]", "", cleaned)

        # 转换为小写（用于比较）
        return cleaned.lower()

    @staticmethod
    def is_generic_chapter_title(title: str) -> bool:
        """
        判断是否为通用的章节标题（如"第一章"、"Chapter 1"等）

        参数:
            title: 章节标题

        返回:
            True 如果是通用标题
        """
        if not title:
            return True

        normalized = TextProcessor.normalize_title(title)

        # 通用标题模式
        generic_patterns = [
            r"^第\s*[一二三四五六七八九十百千万\d]+\s*章",  # 第一章
            r"^chapter\s*\d+",  # Chapter 1
            r"^ch\s*\d+",  # Ch 1
            r"^\d+",  # 1
            r"^序章",  # 序章
            r"^prologue",  # Prologue
            r"^epilogue",  # Epilogue
        ]

        for pattern in generic_patterns:
            if re.match(pattern, normalized):
                return True

        return False

    @staticmethod
    def extract_json_from_response(response_str: str) -> Optional[str]:
        """
        从 AI 响应中提取 JSON 内容

        参数:
            response_str: AI 响应字符串

        返回:
            提取的 JSON 字符串，如果未找到则返回 None
        """
        if not response_str:
            return None

        # 尝试查找 JSON 代码块
        json_match = re.search(r"```json\s*(.*?)\s*```", response_str, re.DOTALL)
        if json_match:
            return json_match.group(1).strip()

        # 尝试查找普通代码块
        code_match = re.search(r"```\s*(.*?)\s*```", response_str, re.DOTALL)
        if code_match:
            return code_match.group(1).strip()

        # 尝试查找 JSON 对象
        json_obj_match = re.search(r"\{.*\}", response_str, re.DOTALL)
        if json_obj_match:
            return json_obj_match.group(0).strip()

        return None

    @staticmethod
    def build_context_excerpt(
        raw_text: str,
        max_length: int = 500,
        from_end: bool = True
    ) -> str:
        """
        构建上下文摘要

        参数:
            raw_text: 原始文本
            max_length: 最大长度
            from_end: 是否从末尾开始截取

        返回:
            上下文摘要
        """
        if not raw_text:
            return ""

        # 移除多余的空白
        text = " ".join(raw_text.split())

        if len(text) <= max_length:
            return text

        if from_end:
            # 从末尾截取
            return "..." + text[-max_length:]
        else:
            # 从开头截取
            return text[:max_length] + "..."
