"""小说数据模式 - API 请求/响应验证"""
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List, Literal

from .user import UserResponse
from ..utils.html_sanitizer import sanitize_chapter_content


# 类型枚举值
NOVEL_CATEGORIES = Literal["玄幻", "言情", "科幻", "悬疑", "历史", "都市", "其他"]
NOVEL_STATUS = Literal["draft", "published"]


class NovelBase(BaseModel):
    """小说基础模式 - 包含公共字段"""

    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    outline: Optional[str] = Field(None, max_length=5000)  # 小说大纲
    category: NOVEL_CATEGORIES


class NovelCreate(NovelBase):
    """创建小说模式"""

    cover_url: Optional[str] = None

    @field_validator('description')
    @classmethod
    def sanitize_description(cls, v: Optional[str]) -> Optional[str]:
        """清理小说描述，防止 XSS 攻击 - 本小姐的安全防护！(￣▽￣)ノ"""
        if v is None:
            return v
        return sanitize_chapter_content(v)

    @field_validator('outline')
    @classmethod
    def sanitize_outline(cls, v: Optional[str]) -> Optional[str]:
        """清理小说大纲，防止 XSS 攻击 - 本小姐的安全防护！(￣▽￣)ノ"""
        if v is None:
            return v
        return sanitize_chapter_content(v)


class NovelUpdate(BaseModel):
    """更新小说模式 - 所有字段可选"""

    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    outline: Optional[str] = Field(None, max_length=5000)  # 小说大纲
    category: Optional[NOVEL_CATEGORIES] = None
    cover_url: Optional[str] = None

    @field_validator('description')
    @classmethod
    def sanitize_description(cls, v: Optional[str]) -> Optional[str]:
        """清理小说描述，防止 XSS 攻击 - 本小姐的安全防护！(￣▽￣)ノ"""
        if v is None:
            return v
        return sanitize_chapter_content(v)

    @field_validator('outline')
    @classmethod
    def sanitize_outline(cls, v: Optional[str]) -> Optional[str]:
        """清理小说大纲，防止 XSS 攻击 - 本小姐的安全防护！(￣▽￣)ノ"""
        if v is None:
            return v
        return sanitize_chapter_content(v)


class NovelPublish(BaseModel):
    """发布/取消发布小说模式"""

    publish: bool = Field(..., description="true=发布, false=取消发布")


class AuthorInfo(BaseModel):
    """简化的作者信息 - 用于小说响应"""

    id: int
    username: str
    avatar: Optional[str] = None

    class Config:
        from_attributes = True


class NovelListItem(NovelBase):
    """小说列表项模式"""

    id: int
    cover_url: Optional[str] = None
    status: NOVEL_STATUS
    is_interactive: bool = False  # 是否互动小说
    author: AuthorInfo
    chapter_count: int
    word_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChapterSummary(BaseModel):
    """简化的章节信息 - 用于小说详情"""

    id: int
    title: str
    order_num: float
    word_count: int
    is_branch: bool = False
    parent_chapter_id: Optional[int] = None  # 父章节ID
    choice_text: Optional[str] = None  # 选项文本
    created_at: datetime

    class Config:
        from_attributes = True


class CharacterSummary(BaseModel):
    """简化的角色信息 - 用于小说详情"""

    id: int
    name: str
    role_type: Optional[str] = None

    class Config:
        from_attributes = True


class NovelDetail(NovelListItem):
    """小说详情模式 - 包含章节和角色"""

    chapters: List[ChapterSummary] = []
    characters: List[CharacterSummary] = []


class NovelListResponse(BaseModel):
    """分页小说列表响应"""

    novels: List[NovelListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
