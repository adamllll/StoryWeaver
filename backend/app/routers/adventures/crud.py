"""
冒险游戏 CRUD 操作路由

包含：创建、列表、获取、删除冒险
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ...database import get_db
from ...models import User, Adventure, StoryNode
from ...utils.auth import get_current_user
from ...services.game_logic import create_initial_state
from ...services import ai_service
from ...utils.prompts import get_opening_prompt
from ...middleware import ai_rate_limiter
from ...schemas.adventure import (
    AdventureCreate,
    AdventureResponse,
    AdventureListItem,
    StoryNodeResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=AdventureResponse, status_code=status.HTTP_201_CREATED)
async def create_adventure(
    request: AdventureCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    创建新冒险

    流程：
    1. 创建 Adventure 记录
    2. 生成初始玩家状态
    3. 调用 AI 生成开局（背景+场景+选项）
    4. 创建第一个 StoryNode
    5. 返回冒险详情
    """
    # 处理随机模式下的默认值
    protagonist_name = request.protagonist_name.strip()
    protagonist_gender = request.protagonist_gender

    if request.random and not protagonist_name:
        # 随机模式下自动生成默认主角名
        import random as rand
        default_names = {
            "玄幻": ["无名剑客", "逍遥子", "天命之人", "云游侠"],
            "言情": ["佳人", "倾城", "若水", "清欢"],
            "科幻": ["星际旅者", "代号X", "觉醒者", "量子"],
            "悬疑": ["侦探K", "暗影", "追踪者", "谜"],
            "都市": ["都市行者", "异能者", "觉醒青年", "隐士"],
            "其他": ["旅人", "冒险家", "探索者", "命运之子"]
        }
        names = default_names.get(request.category, default_names["其他"])
        protagonist_name = rand.choice(names)

    # 验证非随机模式下必须有主角名
    if not request.random and not protagonist_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="非随机模式下必须提供主角名字"
        )

    # 生成标题
    if request.random:
        title = f"{protagonist_name}的{request.category}冒险"
    else:
        title = f"{protagonist_name}的{request.category}奇遇"

    # 创建初始玩家状态
    initial_state = create_initial_state(
        category=request.category,
        protagonist_name=protagonist_name,
        protagonist_personality=request.protagonist_personality
    )

    # 创建冒险记录
    adventure = Adventure(
        player_id=current_user.id,
        title=title,
        category=request.category,
        keywords=request.keywords,
        protagonist_name=protagonist_name,
        protagonist_gender=protagonist_gender,
        protagonist_personality=request.protagonist_personality,
        player_state=initial_state,
        total_nodes=0,
        total_choices=0,
        total_words=0
    )

    db.add(adventure)
    db.commit()
    db.refresh(adventure)

    # 调用 AI 生成开局
    try:
        # 速率限制检查
        ai_rate_limiter.check(current_user.id)

        system_prompt, user_prompt = get_opening_prompt(
            category=request.category,
            keywords=request.keywords,
            protagonist_name=protagonist_name,
            protagonist_gender=protagonist_gender,
            protagonist_personality=request.protagonist_personality or "无特殊设定",
        )

        logger.info(f"AI 开局生成开始: adventure_id={adventure.id}, user_id={current_user.id}")

        # 调用 AI 服务
        result, usage = await ai_service.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.8,
        )

        # 提取生成的内容
        background = result.get("background", "").strip()
        initial_scene = result.get("initial_scene", "").strip()
        choices_data = result.get("choices", [])

        # 组合内容
        full_content = f"【背景】\n{background}\n\n【场景】\n{initial_scene}"

        # 转换选项格式
        choices = []
        for i, choice_data in enumerate(choices_data):
            choices.append({
                "index": choice_data.get("index", i),
                "text": choice_data.get("text", f"选项{i+1}"),
                "inner_monologue": choice_data.get("inner_monologue", ""),
                "success_rate": float(choice_data.get("success_rate", 0.5)),
                "difficulty": choice_data.get("difficulty", "普通"),
                "potential_reward": choice_data.get("potential_reward", "未知"),
                "potential_risk": choice_data.get("potential_risk", "未知"),
                "state_requirements": choice_data.get("state_requirements"),
            })

        # 创建第一个 StoryNode
        first_node = StoryNode(
            adventure_id=adventure.id,
            chapter_num=1,
            title="序章：命运的开端",
            content=full_content,
            state_before=initial_state,
            state_after=initial_state,
            choices=choices if choices else [
                {"index": 0, "text": "继续探索", "inner_monologue": "让我看看前方有什么...",
                 "success_rate": 0.8, "difficulty": "简单", "potential_reward": "发现新线索",
                 "potential_risk": "可能遇到危险", "state_requirements": None}
            ]
        )
        db.add(first_node)
        db.flush()

        # 更新冒险的当前节点
        adventure.current_node_id = first_node.id
        adventure.total_nodes = 1
        adventure.total_words = len(full_content)
        db.commit()
        db.refresh(adventure)

        logger.info(f"AI 开局生成完成: adventure_id={adventure.id}, node_id={first_node.id}")

    except Exception as e:
        logger.error(f"AI 开局生成失败: adventure_id={adventure.id}, error={str(e)}")
        # 即使 AI 生成失败，也创建一个默认的初始节点
        default_content = f"""【背景】
{protagonist_name}的冒险即将开始。在这个充满{request.category}元素的世界里，命运的齿轮已经开始转动。

【场景】
你站在命运的十字路口，前方的道路充满未知。作为{protagonist_name}，你感受到一股神秘的力量在召唤着你。
周围的环境透露着{request.category}世界特有的气息，让你不禁对即将到来的冒险充满期待。
"""
        default_choices = [
            {"index": 0, "text": "勇敢地向前走", "inner_monologue": "无论前方有什么，我都要面对！",
             "success_rate": 0.7, "difficulty": "普通", "potential_reward": "开启新的篇章",
             "potential_risk": "未知的挑战", "state_requirements": None},
            {"index": 1, "text": "先观察周围环境", "inner_monologue": "谨慎行事总是没错的...",
             "success_rate": 0.9, "difficulty": "简单", "potential_reward": "获得有用信息",
             "potential_risk": "可能错过时机", "state_requirements": None},
        ]

        first_node = StoryNode(
            adventure_id=adventure.id,
            chapter_num=1,
            title="序章：命运的开端",
            content=default_content,
            state_before=initial_state,
            state_after=initial_state,
            choices=default_choices
        )
        db.add(first_node)
        db.flush()

        adventure.current_node_id = first_node.id
        adventure.total_nodes = 1
        adventure.total_words = len(default_content)
        db.commit()
        db.refresh(adventure)

        logger.info(f"使用默认开局: adventure_id={adventure.id}, node_id={first_node.id}")

    return adventure


@router.get("/", response_model=List[AdventureListItem])
async def list_adventures(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    is_finished: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取当前用户的冒险列表

    支持筛选：
    - category: 按类型筛选
    - is_finished: 按完成状态筛选
    """
    query = db.query(Adventure).filter(Adventure.player_id == current_user.id)

    if category:
        query = query.filter(Adventure.category == category)

    if is_finished is not None:
        query = query.filter(Adventure.is_finished == is_finished)

    adventures = query.order_by(Adventure.created_at.desc()).offset(skip).limit(limit).all()

    return adventures


@router.get("/{adventure_id}", response_model=AdventureResponse)
async def get_adventure(
    adventure_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取冒险详情"""
    adventure = db.query(Adventure).filter(
        Adventure.id == adventure_id,
        Adventure.player_id == current_user.id
    ).first()

    if not adventure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Adventure {adventure_id} not found"
        )

    return adventure


@router.delete("/{adventure_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_adventure(
    adventure_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除冒险（包括所有关联的节点和选择记录）"""
    adventure = db.query(Adventure).filter(
        Adventure.id == adventure_id,
        Adventure.player_id == current_user.id
    ).first()

    if not adventure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Adventure {adventure_id} not found"
        )

    db.delete(adventure)
    db.commit()


@router.get("/{adventure_id}/nodes", response_model=List[StoryNodeResponse])
async def get_adventure_nodes(
    adventure_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取冒险的所有故事节点（按章节顺序）"""
    adventure = db.query(Adventure).filter(
        Adventure.id == adventure_id,
        Adventure.player_id == current_user.id
    ).first()

    if not adventure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Adventure {adventure_id} not found"
        )

    nodes = db.query(StoryNode).filter(
        StoryNode.adventure_id == adventure_id
    ).order_by(StoryNode.chapter_num).all()

    return nodes
