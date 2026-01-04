"""
HTML 清理器 - XSS 防护

本小姐的安全防护:防止恶意脚本注入！(￣▽￣)ノ
"""
import bleach
from bleach.css_sanitizer import CSSSanitizer
from typing import List, Dict


class HTMLSanitizer:
    """HTML 内容清理器"""

    # 允许的 HTML 标签（富文本编辑器常用）
    ALLOWED_TAGS: List[str] = [
        # 文本格式
        'p', 'br', 'span', 'div',
        # 标题
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        # 文本样式
        'strong', 'em', 'u', 's', 'mark', 'small', 'sub', 'sup',
        # 列表
        'ul', 'ol', 'li',
        # 引用和代码
        'blockquote', 'code', 'pre',
        # 链接（需要严格控制）
        'a',
        # 表格
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        # 其他
        'hr',
    ]

    # 允许的 HTML 属性
    ALLOWED_ATTRIBUTES: Dict[str, List[str]] = {
        '*': ['class', 'id'],  # 所有标签允许 class 和 id
        'a': ['href', 'title', 'target'],  # 链接允许这些属性
        'span': ['style'],  # span 允许内联样式（需要严格控制）
        'p': ['style'],  # 段落允许内联样式
        'div': ['style'],  # div 允许内联样式
    }

    # 允许的 CSS 属性（用于 style）
    ALLOWED_STYLES: List[str] = [
        'color',
        'background-color',
        'font-size',
        'font-weight',
        'font-style',
        'text-align',
        'text-decoration',
        'line-height',
        'margin',
        'padding',
    ]

    # 允许的 URL 协议
    ALLOWED_PROTOCOLS: List[str] = ['http', 'https', 'mailto']

    @classmethod
    def sanitize(cls, html: str, strip: bool = False) -> str:
        """
        清理 HTML 内容，移除危险标签和属性

        参数:
            html: 待清理的 HTML 内容
            strip: 是否完全移除不允许的标签（默认替换为文本）

        返回:
            清理后的安全 HTML

        示例:
            >>> dirty_html = '<script>alert("XSS")</script><p>Hello</p>'
            >>> clean_html = HTMLSanitizer.sanitize(dirty_html)
            >>> print(clean_html)  # '<p>Hello</p>'
        """
        if not html:
            return ""

        # 创建 CSS 清理器
        css_sanitizer = CSSSanitizer(allowed_css_properties=cls.ALLOWED_STYLES)

        # 使用 bleach 清理 HTML
        clean_html = bleach.clean(
            html,
            tags=cls.ALLOWED_TAGS,
            attributes=cls.ALLOWED_ATTRIBUTES,
            protocols=cls.ALLOWED_PROTOCOLS,
            strip=strip,  # 是否移除标签（False 时会转义为文本）
            css_sanitizer=css_sanitizer,  # CSS 样式清理器
        )

        return clean_html

    @classmethod
    def sanitize_strict(cls, html: str) -> str:
        """
        严格清理 HTML 内容，完全移除不允许的标签

        参数:
            html: 待清理的 HTML 内容

        返回:
            清理后的安全 HTML（不允许的标签会被完全移除）
        """
        return cls.sanitize(html, strip=True)

    @classmethod
    def extract_text(cls, html: str) -> str:
        """
        从 HTML 中提取纯文本（移除所有 HTML 标签）

        参数:
            html: HTML 内容

        返回:
            纯文本内容
        """
        if not html:
            return ""

        # 移除所有 HTML 标签
        text = bleach.clean(html, tags=[], strip=True)
        return text.strip()


def sanitize_chapter_content(content: str) -> str:
    """
    清理章节内容（用于 Pydantic validator）

    参数:
        content: 章节 HTML 内容

    返回:
        清理后的安全 HTML

    使用示例:
        class ChapterCreate(BaseModel):
            content: str

            @validator('content')
            def sanitize_content(cls, v):
                return sanitize_chapter_content(v)
    """
    return HTMLSanitizer.sanitize(content)
