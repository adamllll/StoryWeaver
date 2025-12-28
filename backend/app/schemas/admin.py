"""管理员数据模式"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Literal


# ========== 用户管理 ==========
class UserAdminResponse(BaseModel):
    """管理员视角的用户信息"""
    id: int
    username: str
    email: str
    avatar: Optional[str] = None
    bio: Optional[str] = None
    is_admin: bool
    is_active: bool
    role_preference: str
    created_at: datetime
    last_login_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    novel_count: int = 0
    adventure_count: int = 0

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """用户列表响应"""
    users: List[UserAdminResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class UserStatusUpdate(BaseModel):
    """用户状态更新"""
    is_active: bool


class UserAdminUpdate(BaseModel):
    """管理员权限更新"""
    is_admin: bool


# ========== 内容管理 ==========
class NovelAdminResponse(BaseModel):
    """管理员视角的小说信息"""
    id: int
    title: str
    description: Optional[str] = None
    category: str
    status: str
    is_interactive: bool
    chapter_count: int
    word_count: int
    author_id: int
    author_username: str
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NovelListAdminResponse(BaseModel):
    """小说列表响应（管理员）"""
    novels: List[NovelAdminResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class NovelStatusUpdate(BaseModel):
    """小说状态更新"""
    status: Literal["draft", "published"]


class AdventureAdminResponse(BaseModel):
    """管理员视角的冒险信息"""
    id: int
    title: str
    category: str
    protagonist_name: str
    is_finished: bool
    total_nodes: int
    total_words: int
    player_id: int
    player_username: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AdventureListAdminResponse(BaseModel):
    """冒险列表响应（管理员）"""
    adventures: List[AdventureAdminResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ========== 统计数据 ==========
class PlatformOverview(BaseModel):
    """平台总览统计"""
    total_users: int
    total_novels: int
    total_chapters: int
    total_adventures: int
    total_words: int
    new_users_today: int
    new_novels_today: int
    active_users_today: int


class DailyCount(BaseModel):
    """每日统计项"""
    date: str
    count: int


class UserStats(BaseModel):
    """用户统计"""
    daily_registrations: List[DailyCount]
    daily_active_users: List[DailyCount]
    user_role_distribution: dict


class TopAuthor(BaseModel):
    """热门作者"""
    user_id: int
    username: str
    novel_count: int


class ContentStats(BaseModel):
    """内容统计"""
    daily_novels: List[DailyCount]
    daily_chapters: List[DailyCount]
    category_distribution: dict
    top_authors: List[TopAuthor]


# ========== ENV 配置管理 ==========
class EnvConfigItem(BaseModel):
    """单个环境变量配置项"""
    key: str
    value: str
    is_secret: bool = False  # 是否为敏感信息（显示时部分隐藏）
    description: str = ""


class EnvConfigResponse(BaseModel):
    """ENV 配置响应"""
    items: List[EnvConfigItem]
    env_file_path: str


class EnvConfigUpdate(BaseModel):
    """ENV 配置更新"""
    key: str
    value: str


# ========== 批量操作 ==========
class BatchUserIds(BaseModel):
    """批量用户 ID"""
    user_ids: List[int]


class BatchNovelIds(BaseModel):
    """批量小说 ID"""
    novel_ids: List[int]


class BatchOperationResult(BaseModel):
    """批量操作结果"""
    success_count: int
    failed_count: int
    failed_ids: List[int]
