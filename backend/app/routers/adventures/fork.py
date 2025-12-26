"""
冒险游戏分叉系统路由

包含：获取分叉点、执行分叉、获取分支树
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...database import get_db
from ...models import User, Adventure, StoryNode
from ...utils.auth import get_current_user
from ...services.fork_service import (
    fork_adventure,
    get_fork_points,
    get_adventure_tree,
    count_total_forks
)
from ...schemas.adventure import (
    AdventureResponse,
    ForkAdventureRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/{adventure_id}/fork-points")
async def get_adventure_fork_points(
    adventure_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取冒险的所有可分叉点

    返回所有故事节点的摘要信息，供用户选择分叉起始点

    注意：
    - 可以从任意章节点分叉
    - 分叉后会恢复到该节点的玩家状态
    """
    # 验证冒险存在（可以查看其他人的冒险）
    adventure = db.query(Adventure).filter(Adventure.id == adventure_id).first()
    if not adventure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Adventure {adventure_id} not found"
        )

    try:
        fork_points = get_fork_points(db, adventure_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get fork points: {str(e)}"
        )

    return {
        "adventure_id": adventure_id,
        "adventure_title": adventure.title,
        "total_nodes": adventure.total_nodes,
        "fork_points": fork_points
    }


@router.post("/{adventure_id}/fork", response_model=AdventureResponse)
async def fork_from_adventure(
    adventure_id: int,
    request: ForkAdventureRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    从指定冒险分叉

    流程：
    1. 复制源冒险的初始设定
    2. 复制从开始到分叉点的所有节点
    3. 恢复到分叉点的玩家状态
    4. 创建新的冒险记录
    5. 返回新冒险详情

    分叉后：
    - 新玩家可以从分叉点继续探索
    - 之前的章节内容保持不变
    - 之后的剧情由新玩家的选择决定
    """
    # 验证源冒险存在
    source_adventure = db.query(Adventure).filter(
        Adventure.id == adventure_id
    ).first()

    if not source_adventure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source adventure {adventure_id} not found"
        )

    # 验证节点存在
    fork_node = db.query(StoryNode).filter(
        StoryNode.id == request.fork_from_node_id
    ).first()

    if not fork_node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fork node {request.fork_from_node_id} not found"
        )

    if fork_node.adventure_id != adventure_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fork node does not belong to the source adventure"
        )

    # 执行分叉
    try:
        new_adventure = fork_adventure(
            db=db,
            source_adventure_id=adventure_id,
            fork_from_node_id=request.fork_from_node_id,
            new_player_id=current_user.id
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fork adventure: {str(e)}"
        )

    return new_adventure


@router.get("/{adventure_id}/tree")
async def get_adventure_branch_tree(
    adventure_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取冒险的完整分支树

    返回该冒险及其所有分叉的树状结构，用于可视化

    树结构：
    - 根节点：原始冒险
    - 子节点：从该冒险分叉的所有冒险
    - 递归展示：包含所有后代分叉

    应用场景：
    - 可视化展示故事的分支情况
    - 了解该故事被多少人分叉
    - 探索不同的剧情走向
    """
    # 验证冒险存在
    adventure = db.query(Adventure).filter(Adventure.id == adventure_id).first()
    if not adventure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Adventure {adventure_id} not found"
        )

    try:
        tree = get_adventure_tree(db, adventure_id)
        total_forks = count_total_forks(db, adventure_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to build adventure tree: {str(e)}"
        )

    return {
        "root_adventure_id": adventure_id,
        "total_forks": total_forks,
        "tree": tree
    }
