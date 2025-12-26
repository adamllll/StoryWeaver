"""角色和世界观路由 - 故事元素管理 API"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Novel, Character, WorldSetting, User
from ..schemas.character import (
    CharacterCreate,
    CharacterUpdate,
    CharacterItem,
    CharacterListResponse,
    WorldSettingCreate,
    WorldSettingUpdate,
    WorldSettingItem,
    WorldSettingListResponse,
)
from ..utils.auth import get_current_user, get_optional_user
from ..utils.db_helpers import get_accessible_novel, get_owned_novel

router = APIRouter(prefix="/novels/{novel_id}", tags=["角色与世界观"])


# ========== 角色管理 ==========


@router.get("/characters", response_model=CharacterListResponse)
async def list_characters(
    novel_id: int,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    获取小说的所有角色列表

    参数:
        novel_id: 小说ID
        current_user: 可选的当前登录用户
        db: 数据库会话

    返回:
        角色列表
    """
    novel = get_accessible_novel(novel_id, current_user, db)

    characters = [
        CharacterItem(
            id=char.id,
            novel_id=char.novel_id,
            name=char.name,
            role_type=char.role_type,
            description=char.description,
            created_at=char.created_at,
        )
        for char in novel.characters
    ]

    return CharacterListResponse(
        novel_id=novel.id,
        characters=characters,
        total=len(characters),
    )


@router.post("/characters", response_model=CharacterItem, status_code=status.HTTP_201_CREATED)
async def create_character(
    novel_id: int,
    character_data: CharacterCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    创建新角色

    参数:
        novel_id: 小说ID
        character_data: 角色创建数据
        current_user: 当前登录用户
        db: 数据库会话

    返回:
        创建的角色信息
    """
    novel = get_owned_novel(novel_id, current_user, db)

    character = Character(
        novel_id=novel_id,
        name=character_data.name,
        role_type=character_data.role_type,
        description=character_data.description,
    )
    db.add(character)
    db.commit()
    db.refresh(character)

    return CharacterItem(
        id=character.id,
        novel_id=character.novel_id,
        name=character.name,
        role_type=character.role_type,
        description=character.description,
        created_at=character.created_at,
    )


@router.get("/characters/{character_id}", response_model=CharacterItem)
async def get_character(
    novel_id: int,
    character_id: int,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    根据ID获取角色详情

    参数:
        novel_id: 小说ID
        character_id: 角色ID
        current_user: 可选的当前登录用户
        db: 数据库会话

    返回:
        角色详情
    """
    get_accessible_novel(novel_id, current_user, db)
    character = _get_character(character_id, novel_id, db)

    return CharacterItem(
        id=character.id,
        novel_id=character.novel_id,
        name=character.name,
        role_type=character.role_type,
        description=character.description,
        created_at=character.created_at,
    )


@router.put("/characters/{character_id}", response_model=CharacterItem)
async def update_character(
    novel_id: int,
    character_id: int,
    character_data: CharacterUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    更新角色信息

    参数:
        novel_id: 小说ID
        character_id: 角色ID
        character_data: 更新数据
        current_user: 当前登录用户
        db: 数据库会话

    返回:
        更新后的角色信息
    """
    get_owned_novel(novel_id, current_user, db)
    character = _get_character(character_id, novel_id, db)

    update_data = character_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(character, field, value)

    db.commit()
    db.refresh(character)

    return CharacterItem(
        id=character.id,
        novel_id=character.novel_id,
        name=character.name,
        role_type=character.role_type,
        description=character.description,
        created_at=character.created_at,
    )


@router.delete("/characters/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_character(
    novel_id: int,
    character_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    删除角色

    参数:
        novel_id: 小说ID
        character_id: 角色ID
        current_user: 当前登录用户
        db: 数据库会话
    """
    get_owned_novel(novel_id, current_user, db)
    character = _get_character(character_id, novel_id, db)

    db.delete(character)
    db.commit()


# ========== 世界观设定管理 ==========


@router.get("/world-settings", response_model=WorldSettingListResponse)
async def list_world_settings(
    novel_id: int,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    获取小说的所有世界观设定

    参数:
        novel_id: 小说ID
        current_user: 可选的当前登录用户
        db: 数据库会话

    返回:
        世界观设定列表
    """
    novel = get_accessible_novel(novel_id, current_user, db)

    world_settings = [
        WorldSettingItem(
            id=ws.id,
            novel_id=ws.novel_id,
            setting_type=ws.setting_type,
            name=ws.name,
            description=ws.description,
            created_at=ws.created_at,
        )
        for ws in novel.world_settings
    ]

    return WorldSettingListResponse(
        novel_id=novel.id,
        world_settings=world_settings,
        total=len(world_settings),
    )


@router.post("/world-settings", response_model=WorldSettingItem, status_code=status.HTTP_201_CREATED)
async def create_world_setting(
    novel_id: int,
    setting_data: WorldSettingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    创建新的世界观设定

    参数:
        novel_id: 小说ID
        setting_data: 世界观设定数据
        current_user: 当前登录用户
        db: 数据库会话

    返回:
        创建的世界观设定
    """
    novel = get_owned_novel(novel_id, current_user, db)

    world_setting = WorldSetting(
        novel_id=novel_id,
        setting_type=setting_data.setting_type,
        name=setting_data.name,
        description=setting_data.description,
    )
    db.add(world_setting)
    db.commit()
    db.refresh(world_setting)

    return WorldSettingItem(
        id=world_setting.id,
        novel_id=world_setting.novel_id,
        setting_type=world_setting.setting_type,
        name=world_setting.name,
        description=world_setting.description,
        created_at=world_setting.created_at,
    )


@router.get("/world-settings/{setting_id}", response_model=WorldSettingItem)
async def get_world_setting(
    novel_id: int,
    setting_id: int,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    根据ID获取世界观设定详情

    参数:
        novel_id: 小说ID
        setting_id: 设定ID
        current_user: 可选的当前登录用户
        db: 数据库会话

    返回:
        世界观设定详情
    """
    get_accessible_novel(novel_id, current_user, db)
    world_setting = _get_world_setting(setting_id, novel_id, db)

    return WorldSettingItem(
        id=world_setting.id,
        novel_id=world_setting.novel_id,
        setting_type=world_setting.setting_type,
        name=world_setting.name,
        description=world_setting.description,
        created_at=world_setting.created_at,
    )


@router.put("/world-settings/{setting_id}", response_model=WorldSettingItem)
async def update_world_setting(
    novel_id: int,
    setting_id: int,
    setting_data: WorldSettingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    更新世界观设定

    参数:
        novel_id: 小说ID
        setting_id: 设定ID
        setting_data: 更新数据
        current_user: 当前登录用户
        db: 数据库会话

    返回:
        更新后的世界观设定
    """
    get_owned_novel(novel_id, current_user, db)
    world_setting = _get_world_setting(setting_id, novel_id, db)

    update_data = setting_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(world_setting, field, value)

    db.commit()
    db.refresh(world_setting)

    return WorldSettingItem(
        id=world_setting.id,
        novel_id=world_setting.novel_id,
        setting_type=world_setting.setting_type,
        name=world_setting.name,
        description=world_setting.description,
        created_at=world_setting.created_at,
    )


@router.delete("/world-settings/{setting_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_world_setting(
    novel_id: int,
    setting_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    删除世界观设定

    参数:
        novel_id: 小说ID
        setting_id: 设定ID
        current_user: 当前登录用户
        db: 数据库会话
    """
    get_owned_novel(novel_id, current_user, db)
    world_setting = _get_world_setting(setting_id, novel_id, db)

    db.delete(world_setting)
    db.commit()


# ========== 辅助函数 ==========


def _get_character(character_id: int, novel_id: int, db: Session) -> Character:
    """根据ID获取角色"""
    character = db.query(Character).filter(
        Character.id == character_id,
        Character.novel_id == novel_id,
    ).first()
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"未找到ID为 {character_id} 的角色",
        )
    return character


def _get_world_setting(setting_id: int, novel_id: int, db: Session) -> WorldSetting:
    """根据ID获取世界观设定"""
    world_setting = db.query(WorldSetting).filter(
        WorldSetting.id == setting_id,
        WorldSetting.novel_id == novel_id,
    ).first()
    if not world_setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"未找到ID为 {setting_id} 的世界观设定",
        )
    return world_setting
