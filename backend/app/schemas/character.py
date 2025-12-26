"""角色和世界观数据模式 - API 请求/响应验证"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Literal


# ========== 角色相关 ==========


ROLE_TYPES = Literal["主角", "女主", "反派", "配角", "导师", "其他"]


class CharacterBase(BaseModel):
    """角色基础模式 - 包含公共字段"""

    name: str = Field(..., min_length=1, max_length=50)
    role_type: Optional[ROLE_TYPES] = None
    description: Optional[str] = Field(None, max_length=2000)


class CharacterCreate(CharacterBase):
    """创建角色模式"""

    pass


class CharacterUpdate(BaseModel):
    """更新角色模式 - 所有字段可选"""

    name: Optional[str] = Field(None, min_length=1, max_length=50)
    role_type: Optional[ROLE_TYPES] = None
    description: Optional[str] = Field(None, max_length=2000)


class CharacterItem(CharacterBase):
    """角色列表项模式"""

    id: int
    novel_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CharacterListResponse(BaseModel):
    """角色列表响应"""

    novel_id: int
    characters: List[CharacterItem]
    total: int


# ========== 世界观设定相关 ==========


SETTING_TYPES = Literal["地理", "力量体系", "势力分布", "历史背景", "文化习俗", "其他"]


class WorldSettingBase(BaseModel):
    """世界观设定基础模式 - 包含公共字段"""

    setting_type: SETTING_TYPES
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=5000)


class WorldSettingCreate(WorldSettingBase):
    """创建世界观设定模式"""

    pass


class WorldSettingUpdate(BaseModel):
    """更新世界观设定模式 - 所有字段可选"""

    setting_type: Optional[SETTING_TYPES] = None
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=5000)


class WorldSettingItem(WorldSettingBase):
    """世界观设定列表项模式"""

    id: int
    novel_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class WorldSettingListResponse(BaseModel):
    """世界观设定列表响应"""

    novel_id: int
    world_settings: List[WorldSettingItem]
    total: int
