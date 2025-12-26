"""
冒险游戏数据模式 - API 请求/响应验证

从 routers/adventures.py 拆分出来的 Pydantic 模型
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ========== 创建/请求 Schemas ==========

class AdventureCreate(BaseModel):
    """创建冒险的请求体"""
    category: str = Field(..., description="小说类型：玄幻/言情/科幻/悬疑/都市")
    keywords: List[str] = Field(..., description="关键词列表", min_items=1, max_items=5)
    protagonist_name: str = Field("", description="主角名字（random=true时可为空）", max_length=100)
    protagonist_gender: str = Field("male", description="主角性别：male/female/other")
    protagonist_personality: Optional[str] = Field(None, description="主角性格描述", max_length=200)
    random: bool = Field(False, description="是否完全随机生成")


class ChoiceRequest(BaseModel):
    """玩家选择请求"""
    choice_index: int = Field(..., description="选择的索引（从0开始）")
    choice_text: str = Field(..., description="选择的文本内容")


class FinishAdventureRequest(BaseModel):
    """结束冒险的请求体"""
    ending_type: str = Field(
        "user_quit",
        description="结局类型：happy/tragic/user_quit"
    )


class ForkAdventureRequest(BaseModel):
    """分叉冒险的请求体"""
    fork_from_node_id: int = Field(..., description="从哪个节点开始分叉")


# ========== 响应 Schemas ==========

class AdventureResponse(BaseModel):
    """冒险详情响应"""
    id: int
    player_id: int
    title: str
    category: str
    keywords: List[str]
    protagonist_name: str
    protagonist_gender: str
    protagonist_personality: Optional[str]

    # 分叉相关字段
    parent_adventure_id: Optional[int]
    fork_from_node_id: Optional[int]

    current_node_id: Optional[int]
    player_state: dict

    is_finished: bool
    final_ending: Optional[str]

    total_nodes: int
    total_choices: int
    total_words: int

    created_at: datetime
    updated_at: datetime
    finished_at: Optional[datetime]

    class Config:
        from_attributes = True


class AdventureListItem(BaseModel):
    """冒险列表项"""
    id: int
    title: str
    category: str
    keywords: List[str] = []
    protagonist_name: str
    is_finished: bool
    total_nodes: int
    total_words: int
    created_at: datetime

    class Config:
        from_attributes = True


class StoryNodeResponse(BaseModel):
    """故事节点响应"""
    id: int
    adventure_id: int
    chapter_num: int
    title: Optional[str]
    content: str
    choices: List[dict]
    created_at: datetime

    class Config:
        from_attributes = True


class ChoiceResponse(BaseModel):
    """判定结果响应"""
    roll_value: int
    target: int
    success: bool
    new_node: StoryNodeResponse
    state_after: dict
    game_over: bool = False
    game_over_reason: Optional[str] = None


class FinishAdventureResponse(BaseModel):
    """结束冒险的响应"""
    message: str
    ending_type: str
    novel: dict  # 整理后的完整小说数据
