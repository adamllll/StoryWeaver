"""
冒险游戏核心玩法路由

包含：选择判定、结束冒险、探索社区
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from ...database import get_db
from ...models import User, Adventure, StoryNode, PlayerChoice
from ...utils.auth import get_current_user
from ...services.game_logic import (
    roll_dice,
    check_state_requirements,
    apply_state_changes,
    is_game_over
)
from ...services.export_service import compile_adventure_to_novel
from ...services.fork_service import get_forkable_adventures
from ...services import ai_service
from ...utils.prompts import get_story_node_prompt, get_ending_prompt
from ...middleware import ai_rate_limiter
from ...schemas.adventure import (
    AdventureListItem,
    ChoiceRequest,
    ChoiceResponse,
    StoryNodeResponse,
    FinishAdventureRequest,
    FinishAdventureResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/explore", response_model=List[AdventureListItem])
async def explore_adventures(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    浏览社区冒险（可分叉的故事）

    返回其他玩家的冒险，供当前用户浏览和分叉
    """
    if limit > 50:
        limit = 50

    try:
        adventures = get_forkable_adventures(
            db=db,
            current_user_id=current_user.id,
            category=category,
            skip=skip,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch adventures: {str(e)}"
        )

    return adventures


@router.post("/{adventure_id}/choose", response_model=ChoiceResponse)
async def make_choice(
    adventure_id: int,
    request: ChoiceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    玩家做出选择并生成下一节点

    流程：
    1. 验证冒险状态（未结束）
    2. 获取当前节点和选项
    3. 检查前置条件
    4. 投骰判定
    5. 调用 AI 生成后续剧情
    6. 应用状态变化
    7. 检查游戏是否结束
    8. 保存 PlayerChoice 记录
    9. 创建新的 StoryNode
    10. 返回结果
    """
    # 1. 获取冒险
    adventure = db.query(Adventure).filter(
        Adventure.id == adventure_id,
        Adventure.player_id == current_user.id
    ).first()

    if not adventure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Adventure {adventure_id} not found"
        )

    if adventure.is_finished:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This adventure has already finished"
        )

    # 2. 获取当前节点
    if not adventure.current_node_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No current node found. Please start the adventure first."
        )

    current_node = db.query(StoryNode).filter(
        StoryNode.id == adventure.current_node_id
    ).first()

    if not current_node:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Current node not found"
        )

    # 3. 验证选择
    if request.choice_index < 0 or request.choice_index >= len(current_node.choices):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid choice index: {request.choice_index}"
        )

    choice = current_node.choices[request.choice_index]

    # 4. 检查前置条件
    can_choose, reason = check_state_requirements(
        adventure.player_state,
        choice.get("state_requirements")
    )

    if not can_choose:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot make this choice: {reason}"
        )

    # 5. 投骰判定
    success_rate = choice.get("success_rate", 0.5)
    difficulty = choice.get("difficulty", "普通")
    roll_value, success = roll_dice(success_rate, difficulty)
    target = int(success_rate * 100)

    # 6. 调用 AI 生成后续剧情
    try:
        # 速率限制检查
        ai_rate_limiter.check(current_user.id)

        # 构建前文概要
        story_summary = current_node.content[-2000:] if len(current_node.content) > 2000 else current_node.content

        # 提取完整的choice上下文信息
        choice_inner_monologue = choice.get("inner_monologue", "")
        choice_potential_reward = choice.get("potential_reward", "未知")
        choice_potential_risk = choice.get("potential_risk", "未知")
        choice_difficulty = choice.get("difficulty", "普通")

        system_prompt, user_prompt = get_story_node_prompt(
            category=adventure.category,
            keywords=adventure.keywords,
            protagonist_name=adventure.protagonist_name,
            protagonist_gender=adventure.protagonist_gender,
            protagonist_personality=adventure.protagonist_personality or "无特殊设定",
            story_summary=story_summary,
            choice_text=request.choice_text,
            choice_inner_monologue=choice_inner_monologue,
            choice_potential_reward=choice_potential_reward,
            choice_potential_risk=choice_potential_risk,
            choice_difficulty=choice_difficulty,
            success=success,
            roll_value=roll_value,
            target=target,
            success_rate=success_rate,
            player_state=adventure.player_state,
        )

        logger.info(f"AI 故事节点生成开始: adventure_id={adventure_id}, choice={request.choice_text}")

        # 调用 AI 服务
        result, usage = await ai_service.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.8,
        )

        # 提取生成的内容
        new_content = result.get("content", "").strip()
        state_delta = result.get("state_changes", {})
        choices_data = result.get("choices", [])

        # 转换选项格式
        new_choices = []
        for i, choice_data in enumerate(choices_data):
            new_choices.append({
                "index": choice_data.get("index", i),
                "text": choice_data.get("text", f"选项{i+1}"),
                "inner_monologue": choice_data.get("inner_monologue", ""),
                "success_rate": float(choice_data.get("success_rate", 0.5)),
                "difficulty": choice_data.get("difficulty", "普通"),
                "potential_reward": choice_data.get("potential_reward", "未知"),
                "potential_risk": choice_data.get("potential_risk", "未知"),
                "state_requirements": choice_data.get("state_requirements"),
            })

        logger.info(f"AI 故事节点生成完成: adventure_id={adventure_id}")

    except Exception as e:
        logger.error(f"AI 故事节点生成失败: adventure_id={adventure_id}, error={str(e)}")
        # 使用默认内容
        error_msg = str(e)
        new_content = f"【{request.choice_text}】\n\n{'判定成功！' if success else '判定失败...'}\n\n（投骰 {roll_value} / 目标 {target}）\n\n⚠️ 系统错误：{error_msg}\n\n故事继续发展中..."
        state_delta = {"生命值": 10 if success else -20}
        new_choices = [
            {
                "index": 0,
                "text": "继续探索",
                "inner_monologue": "前方还有更多未知等待着我...",
                "success_rate": 0.7,
                "difficulty": "普通",
                "potential_reward": "发现新线索",
                "potential_risk": "可能遇到危险",
                "state_requirements": None
            },
            {
                "index": 1,
                "text": "谨慎行事",
                "inner_monologue": "还是小心为上...",
                "success_rate": 0.85,
                "difficulty": "简单",
                "potential_reward": "安全前进",
                "potential_risk": "可能错过机会",
                "state_requirements": None
            }
        ]

    # 7. 应用状态变化
    if not state_delta:
        if success:
            state_delta = {"生命值": 10}
        else:
            state_delta = {"生命值": -20}

    new_state = apply_state_changes(adventure.player_state, state_delta)

    # 8. 检查游戏是否结束
    game_over, game_over_reason = is_game_over(new_state)

    # 9. 保存 PlayerChoice 记录
    player_choice = PlayerChoice(
        adventure_id=adventure_id,
        story_node_id=current_node.id,
        choice_index=request.choice_index,
        choice_text=request.choice_text,
        target_success_rate=target,
        roll_value=roll_value,
        success=success,
        state_delta=state_delta
    )
    db.add(player_choice)

    # 10. 创建新的 StoryNode
    new_node = StoryNode(
        adventure_id=adventure_id,
        parent_node_id=current_node.id,
        chapter_num=current_node.chapter_num + 1,
        title=f"第{current_node.chapter_num + 1}章",
        content=new_content,
        state_before=adventure.player_state.copy(),
        state_after=new_state.copy(),
        choices=new_choices if not game_over else []
    )
    db.add(new_node)
    db.flush()

    # 11. 更新冒险状态
    adventure.current_node_id = new_node.id
    adventure.player_state = new_state
    adventure.total_nodes += 1
    adventure.total_choices += 1
    adventure.total_words += len(new_content)

    if game_over:
        adventure.is_finished = True
        adventure.final_ending = "game_over"
        adventure.finished_at = datetime.utcnow()

    db.commit()
    db.refresh(new_node)

    return ChoiceResponse(
        roll_value=roll_value,
        target=target,
        success=success,
        new_node=StoryNodeResponse.model_validate(new_node),
        state_after=new_state,
        game_over=game_over,
        game_over_reason=game_over_reason
    )


@router.post("/{adventure_id}/finish", response_model=FinishAdventureResponse)
async def finish_adventure(
    adventure_id: int,
    request: FinishAdventureRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    主动结束冒险

    ending_type:
    - "happy": 完美结局（AI生成）
    - "tragic": 悲剧结局（AI生成）
    - "user_quit": 暂时离开（不标记完成）
    """
    adventure = db.query(Adventure).filter(
        Adventure.id == adventure_id,
        Adventure.player_id == current_user.id
    ).first()

    if not adventure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Adventure {adventure_id} not found"
        )

    # 处理"暂时离开" - 不标记为完成，允许继续
    if request.ending_type == "user_quit":
        logger.info(f"User paused adventure {adventure_id}")

        try:
            novel_data = compile_adventure_to_novel(db, adventure_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to compile novel: {str(e)}"
            )

        return FinishAdventureResponse(
            message="Adventure paused. You can continue later.",
            ending_type="user_quit",
            novel=novel_data
        )

    # 检查是否已完成
    if adventure.is_finished:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This adventure has already finished"
        )

    # 为"完美结局"和"悲剧结局"生成AI结局章节
    if request.ending_type in ["happy", "tragic"]:
        logger.info(f"Generating {request.ending_type} ending for adventure {adventure_id}")

        try:
            # 获取最近5个节点作为故事摘要
            recent_nodes = (
                db.query(StoryNode)
                .filter(StoryNode.adventure_id == adventure_id)
                .order_by(StoryNode.chapter_num.desc())
                .limit(5)
                .all()
            )
            story_summary = "\n\n---\n\n".join([node.content for node in reversed(recent_nodes)])

            # 生成结局提示词
            system_prompt, user_prompt = get_ending_prompt(
                category=adventure.category,
                keywords=adventure.keywords,
                protagonist_name=adventure.protagonist_name,
                protagonist_gender=adventure.protagonist_gender,
                story_summary=story_summary[-5000:],
                player_state=adventure.player_state,
                ending_type=request.ending_type,
            )

            # 调用AI服务生成结局
            ending_content, usage = await ai_service.generate_text(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.7,
                max_tokens=4000,
            )

            # 创建结局节点
            final_chapter_num = (
                db.query(func.max(StoryNode.chapter_num))
                .filter(StoryNode.adventure_id == adventure_id)
                .scalar() or 0
            ) + 1

            ending_node = StoryNode(
                adventure_id=adventure_id,
                chapter_num=final_chapter_num,
                title="结局",
                content=f"# 结局\n\n{ending_content}",
                choices=[],
                state_before=adventure.player_state.copy(),
                state_after=adventure.player_state.copy(),
            )
            db.add(ending_node)

            logger.info(f"Generated {len(ending_content)} chars ending for adventure {adventure_id}")

        except Exception as e:
            logger.error(f"Failed to generate ending: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate ending: {str(e)}"
            )

    # 标记为完成
    adventure.is_finished = True
    adventure.final_ending = request.ending_type
    adventure.finished_at = datetime.utcnow()

    db.commit()

    # 整理成完整小说
    try:
        novel_data = compile_adventure_to_novel(db, adventure_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile novel: {str(e)}"
        )

    return FinishAdventureResponse(
        message="Adventure finished successfully",
        ending_type=request.ending_type,
        novel=novel_data
    )
