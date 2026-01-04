"""章节数据模式 - API 请求/响应验证"""
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List

from ..utils.html_sanitizer import sanitize_chapter_content


class ChapterBase(BaseModel):
    """章节基础模式 - 包含公共字段"""

    title: str = Field(..., min_length=1, max_length=100)
    content: Optional[str] = Field(None, max_length=500000)  # 最多50万字符，防止DoS攻击


class ChapterCreate(ChapterBase):
    """创建章节模式"""

    order_num: Optional[float] = None  # 为空则追加到末尾，支持小数排序（如 1.1, 1.2）
    parent_chapter_id: Optional[int] = None  # 创建分支章节时指定父章节
    choice_text: Optional[str] = None  # 分支选项文本

    @field_validator('content')
    @classmethod
    def sanitize_content(cls, v: Optional[str]) -> Optional[str]:
        """清理章节内容，防止 XSS 攻击 - 本小姐的安全防护！(￣▽￣)ノ"""
        if v is None:
            return v
        return sanitize_chapter_content(v)

    @field_validator('choice_text')
    @classmethod
    def sanitize_choice_text(cls, v: Optional[str]) -> Optional[str]:
        """清理选项文本，防止 XSS 攻击 - 本小姐的安全防护！(￣▽￣)ノ"""
        if v is None:
            return v
        return sanitize_chapter_content(v)


class ChapterUpdate(BaseModel):
    """更新章节模式 - 所有字段可选"""

    title: Optional[str] = Field(None, min_length=1, max_length=100)
    content: Optional[str] = Field(None, max_length=500000)  # 最多50万字符，防止DoS攻击
    choice_text: Optional[str] = None  # 允许更新选项文本

    @field_validator('content')
    @classmethod
    def sanitize_content(cls, v: Optional[str]) -> Optional[str]:
        """清理章节内容，防止 XSS 攻击 - 本小姐的安全防护！(￣▽￣)ノ"""
        if v is None:
            return v
        return sanitize_chapter_content(v)

    @field_validator('choice_text')
    @classmethod
    def sanitize_choice_text(cls, v: Optional[str]) -> Optional[str]:
        """清理选项文本，防止 XSS 攻击 - 本小姐的安全防护！(￣▽￣)ノ"""
        if v is None:
            return v
        return sanitize_chapter_content(v)


class ChapterReorder(BaseModel):
    """重排序章节模式"""

    chapter_ids: List[int]


class ChapterNavigation(BaseModel):
    """章节阅读的导航信息"""

    prev_chapter_id: Optional[int] = None
    prev_chapter_title: Optional[str] = None
    next_chapter_id: Optional[int] = None
    next_chapter_title: Optional[str] = None


class ChapterListItem(BaseModel):
    """章节列表项模式"""

    id: int
    title: str
    order_num: float
    word_count: int
    is_branch: bool = False  # 是否为分支章节
    parent_chapter_id: Optional[int] = None  # 父章节ID
    choice_text: Optional[str] = None  # 选项文本
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChapterDetail(ChapterListItem):
    """章节详情模式 - 包含内容和导航"""

    novel_id: int
    content: Optional[str] = None
    navigation: ChapterNavigation


class ChapterListResponse(BaseModel):
    """章节列表响应"""

    novel_id: int
    novel_title: str
    chapters: List[ChapterListItem]
    total: int


# ============================================================
# 互动小说功能相关 Schemas
# ============================================================


class ChoiceSelection(BaseModel):
    """用户选择提交模式"""

    choice_id: int = Field(..., ge=0, description="选择第几个选项（0-based索引）")


class ChoiceResult(BaseModel):
    """选择提交结果"""

    next_chapter_id: int = Field(..., description="下一章节 ID")
    is_ending: bool = Field(False, description="是否到达结局章节")
    ending_type: Optional[str] = Field(None, description="结局类型（如果是结局）")


class ChoiceHistory(BaseModel):
    """单次选择历史记录"""

    chapter_id: int
    choice_id: int
    choice_text: str
    timestamp: str


class ReadingProgressResponse(BaseModel):
    """阅读进度响应"""

    novel_id: int
    chapter_id: int = Field(alias="current_chapter_id", description="当前阅读章节ID")
    chapter_title: str = Field(..., description="当前章节标题")
    progress_percentage: float = Field(..., ge=0, le=100, description="阅读进度百分比")
    choices_made: List[ChoiceHistory] = Field(default_factory=list, description="选择历史")
    endings_unlocked: List[str] = Field(default_factory=list, description="已解锁的结局")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True  # 允许使用 chapter_id 或 current_chapter_id


class ReadingProgressUpdate(BaseModel):
    """更新阅读进度"""

    chapter_id: int = Field(..., description="当前阅读到的章节 ID")


class EndingInfo(BaseModel):
    """结局信息"""

    ending_id: str = Field(..., description="结局唯一标识")
    chapter_id: int = Field(..., description="结局章节 ID")
    title: str = Field(..., description="结局章节标题")
    ending_type: str = Field(..., description="结局类型: happy/tragic/hidden")
    is_unlocked: bool = Field(False, description="用户是否已解锁")
    is_hidden: bool = Field(False, description="是否为隐藏结局")


class EndingsList(BaseModel):
    """结局列表响应"""

    total_endings: int = Field(..., description="总结局数量")
    unlocked_count: int = Field(..., description="已解锁数量")
    endings: List[EndingInfo] = Field(default_factory=list, description="结局列表")


class MarkEndingRequest(BaseModel):
    """标记章节为结局"""

    ending_type: str = Field(..., description="结局类型: happy/tragic/hidden")
