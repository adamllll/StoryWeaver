"""
Conversations API 路由 - AI 对话历史持久化

提供：
1. 保存/更新对话历史
2. 获取对话历史
3. 删除对话历史
4. 按冒险查询对话
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field

from ..database import get_db
from ..models import User, AIConversation, Adventure
from ..utils.auth import get_current_user


router = APIRouter(prefix="/conversations", tags=["conversations"])


# ========== Pydantic Schemas ==========

class Message(BaseModel):
    """单条消息"""
    role: str = Field(..., description="角色：user/assistant/system")
    content: str = Field(..., description="消息内容")
    timestamp: Optional[str] = Field(None, description="时间戳（可选）")


class ConversationUpdate(BaseModel):
    """更新对话的请求体"""
    messages: List[dict] = Field(..., description="完整的消息列表")


class ConversationResponse(BaseModel):
    """对话响应"""
    id: int
    adventure_id: Optional[int]
    user_id: int
    messages: List[dict]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ========== API Endpoints ==========

@router.get("/{adventure_id}", response_model=ConversationResponse)
async def get_conversation(
    adventure_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取指定冒险的对话历史

    如果不存在，返回 404
    """
    # 验证冒险存在且属于当前用户
    adventure = db.query(Adventure).filter(
        Adventure.id == adventure_id,
        Adventure.player_id == current_user.id
    ).first()

    if not adventure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Adventure {adventure_id} not found or access denied"
        )

    # 获取对话记录
    conversation = db.query(AIConversation).filter(
        AIConversation.adventure_id == adventure_id,
        AIConversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No conversation found for adventure {adventure_id}"
        )

    return conversation


@router.put("/{adventure_id}", response_model=ConversationResponse)
async def save_or_update_conversation(
    adventure_id: int,
    request: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    保存或更新指定冒险的对话历史

    流程：
    1. 验证冒险存在且属于当前用户
    2. 如果对话记录不存在，创建新记录
    3. 如果存在，更新消息列表和更新时间
    4. 返回最新的对话记录

    使用场景：
    - 每次 AI 对话后调用此接口保存消息
    - 支持增量更新（每次发送完整消息列表）
    """
    # 1. 验证冒险存在且属于当前用户
    adventure = db.query(Adventure).filter(
        Adventure.id == adventure_id,
        Adventure.player_id == current_user.id
    ).first()

    if not adventure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Adventure {adventure_id} not found or access denied"
        )

    # 2. 查找现有对话记录
    conversation = db.query(AIConversation).filter(
        AIConversation.adventure_id == adventure_id,
        AIConversation.user_id == current_user.id
    ).first()

    if conversation:
        # 3. 更新现有记录
        conversation.messages = request.messages
        conversation.updated_at = datetime.now(timezone.utc)
    else:
        # 4. 创建新记录
        conversation = AIConversation(
            adventure_id=adventure_id,
            user_id=current_user.id,
            messages=request.messages
        )
        db.add(conversation)

    db.commit()
    db.refresh(conversation)

    return conversation


@router.delete("/{adventure_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    adventure_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    删除指定冒险的对话历史

    使用场景：
    - 用户希望清除对话记录
    - 重新开始冒险时清空历史
    """
    # 查找对话记录
    conversation = db.query(AIConversation).filter(
        AIConversation.adventure_id == adventure_id,
        AIConversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No conversation found for adventure {adventure_id}"
        )

    db.delete(conversation)
    db.commit()


@router.get("/user/all", response_model=List[ConversationResponse])
async def get_user_conversations(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取当前用户的所有对话历史

    查询参数：
    - skip: 跳过数量
    - limit: 返回数量（最多 100）

    使用场景：
    - 用户个人中心查看所有对话
    - 管理对话记录
    """
    if limit > 100:
        limit = 100

    conversations = (
        db.query(AIConversation)
        .filter(AIConversation.user_id == current_user.id)
        .order_by(AIConversation.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return conversations


@router.post("/standalone", response_model=ConversationResponse)
async def create_standalone_conversation(
    request: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    创建独立的对话记录（不关联冒险）

    使用场景：
    - 用户在创建冒险之前与 AI 对话
    - 通用的 AI 助手对话
    - 临时对话记录

    注意：
    - adventure_id 为 null
    - 可以后续通过其他接口关联到冒险
    """
    conversation = AIConversation(
        adventure_id=None,
        user_id=current_user.id,
        messages=request.messages
    )

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return conversation


@router.get("/standalone/{conversation_id}", response_model=ConversationResponse)
async def get_standalone_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取独立对话记录

    验证：只能获取属于当前用户的对话
    """
    conversation = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.user_id == current_user.id,
        AIConversation.adventure_id.is_(None)  # 确保是独立对话
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Standalone conversation {conversation_id} not found or access denied"
        )

    return conversation


@router.put("/standalone/{conversation_id}", response_model=ConversationResponse)
async def update_standalone_conversation(
    conversation_id: int,
    request: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    更新独立对话记录

    验证：只能更新属于当前用户的对话
    """
    conversation = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.user_id == current_user.id,
        AIConversation.adventure_id.is_(None)
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Standalone conversation {conversation_id} not found or access denied"
        )

    conversation.messages = request.messages
    conversation.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(conversation)

    return conversation


@router.post("/{conversation_id}/link/{adventure_id}")
async def link_conversation_to_adventure(
    conversation_id: int,
    adventure_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    将独立对话关联到冒险

    使用场景：
    - 用户在创建冒险前与 AI 讨论，创建冒险后关联历史对话

    验证：
    - 对话和冒险都必须属于当前用户
    - 对话必须是独立对话（adventure_id 为 null）
    - 冒险不能已经有关联的对话
    """
    # 验证对话存在且属于当前用户
    conversation = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.user_id == current_user.id,
        AIConversation.adventure_id.is_(None)
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Standalone conversation {conversation_id} not found or access denied"
        )

    # 验证冒险存在且属于当前用户
    adventure = db.query(Adventure).filter(
        Adventure.id == adventure_id,
        Adventure.player_id == current_user.id
    ).first()

    if not adventure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Adventure {adventure_id} not found or access denied"
        )

    # 检查冒险是否已有关联的对话
    existing_conversation = db.query(AIConversation).filter(
        AIConversation.adventure_id == adventure_id,
        AIConversation.user_id == current_user.id
    ).first()

    if existing_conversation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Adventure {adventure_id} already has a linked conversation"
        )

    # 关联对话到冒险
    conversation.adventure_id = adventure_id
    conversation.updated_at = datetime.now(timezone.utc)

    db.commit()

    return {
        "message": "Conversation linked to adventure successfully",
        "conversation_id": conversation_id,
        "adventure_id": adventure_id
    }
