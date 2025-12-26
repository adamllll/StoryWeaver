"""冒险分叉服务

实现故事分叉系统，允许玩家从其他人的故事中任意节点分叉，
创造属于自己的独特故事线
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from ..models.adventure import Adventure, StoryNode, PlayerChoice


def get_nodes_until(db: Session, target_node_id: int) -> List[StoryNode]:
    """获取从根节点到目标节点的所有节点（按章节顺序）

    Args:
        db: 数据库会话
        target_node_id: 目标节点 ID

    Returns:
        List[StoryNode]: 从第一章到目标章节的所有节点
    """
    target_node = db.query(StoryNode).filter(StoryNode.id == target_node_id).first()
    if not target_node:
        raise ValueError(f"Node {target_node_id} not found")

    # 获取该冒险的所有节点，按章节号排序
    all_nodes = (
        db.query(StoryNode)
        .filter(StoryNode.adventure_id == target_node.adventure_id)
        .order_by(StoryNode.chapter_num)
        .all()
    )

    # 只返回章节号 <= 目标章节号的节点
    nodes_until_target = [
        node for node in all_nodes
        if node.chapter_num <= target_node.chapter_num
    ]

    return nodes_until_target


def fork_adventure(
    db: Session,
    source_adventure_id: int,
    fork_from_node_id: int,
    new_player_id: int
) -> Adventure:
    """从别人的故事分叉

    创建一个新的冒险，复制源冒险从开始到分叉点的所有节点，
    并恢复到分叉点的玩家状态，允许新玩家从该点继续探索。

    Args:
        db: 数据库会话
        source_adventure_id: 源冒险 ID
        fork_from_node_id: 分叉起始节点 ID
        new_player_id: 新玩家 ID

    Returns:
        Adventure: 新创建的分叉冒险

    Raises:
        ValueError: 如果源冒险或节点不存在
        PermissionError: 如果尝试从自己的冒险分叉
    """
    # 1. 获取源冒险
    source_adventure = db.query(Adventure).filter(
        Adventure.id == source_adventure_id
    ).first()

    if not source_adventure:
        raise ValueError(f"Source adventure {source_adventure_id} not found")

    # 防止从自己的冒险分叉（没有意义）
    if source_adventure.player_id == new_player_id:
        raise PermissionError("Cannot fork from your own adventure")

    # 2. 获取分叉节点
    fork_node = db.query(StoryNode).filter(
        StoryNode.id == fork_from_node_id
    ).first()

    if not fork_node:
        raise ValueError(f"Fork node {fork_from_node_id} not found")

    if fork_node.adventure_id != source_adventure_id:
        raise ValueError("Fork node does not belong to the source adventure")

    # 3. 创建新冒险
    new_adventure = Adventure(
        player_id=new_player_id,
        parent_adventure_id=source_adventure_id,
        fork_from_node_id=fork_from_node_id,

        # 复制初始设定
        title=f"{source_adventure.title} - 分支版本",
        category=source_adventure.category,
        keywords=source_adventure.keywords,
        protagonist_name=source_adventure.protagonist_name,
        protagonist_gender=source_adventure.protagonist_gender,
        protagonist_personality=source_adventure.protagonist_personality,

        # 恢复到分叉点的状态
        current_node_id=None,  # 稍后设置
        player_state=fork_node.state_after.copy(),

        # 初始化统计信息
        total_nodes=0,
        total_choices=0,
        total_words=0,

        is_finished=False,
        final_ending=None
    )

    db.add(new_adventure)
    db.flush()  # 获取新冒险的 ID

    # 4. 复制所有节点直到分叉点
    nodes_to_copy = get_nodes_until(db, fork_from_node_id)
    node_id_mapping = {}  # 旧 ID -> 新 ID 的映射

    for old_node in nodes_to_copy:
        # 复制节点内容
        new_node = StoryNode(
            adventure_id=new_adventure.id,
            parent_node_id=node_id_mapping.get(old_node.parent_node_id),  # 使用新的父节点 ID
            chapter_num=old_node.chapter_num,
            title=old_node.title,
            content=old_node.content,
            state_before=old_node.state_before.copy(),
            state_after=old_node.state_after.copy(),
            choices=old_node.choices.copy()
        )
        db.add(new_node)
        db.flush()  # 获取新节点的 ID

        # 记录 ID 映射
        node_id_mapping[old_node.id] = new_node.id

        # 更新统计
        new_adventure.total_nodes += 1
        new_adventure.total_words += len(old_node.content)

    # 5. 设置当前节点为最后一个复制的节点
    last_copied_node_id = node_id_mapping[fork_from_node_id]
    new_adventure.current_node_id = last_copied_node_id

    # 6. 复制分叉点之前的选择历史（可选，用于完整性）
    # 注意：这里只复制历史记录，不影响游戏逻辑
    source_choices = (
        db.query(PlayerChoice)
        .filter(PlayerChoice.adventure_id == source_adventure_id)
        .join(StoryNode, PlayerChoice.story_node_id == StoryNode.id)
        .filter(StoryNode.chapter_num < fork_node.chapter_num)
        .all()
    )

    for old_choice in source_choices:
        new_choice = PlayerChoice(
            adventure_id=new_adventure.id,
            story_node_id=node_id_mapping.get(old_choice.story_node_id),
            choice_index=old_choice.choice_index,
            choice_text=old_choice.choice_text,
            target_success_rate=old_choice.target_success_rate,
            roll_value=old_choice.roll_value,
            success=old_choice.success,
            state_delta=old_choice.state_delta.copy() if old_choice.state_delta else None
        )
        db.add(new_choice)
        new_adventure.total_choices += 1

    db.commit()
    db.refresh(new_adventure)

    return new_adventure


def get_forkable_adventures(
    db: Session,
    current_user_id: int,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
) -> List[Adventure]:
    """获取可分叉的冒险列表（社区浏览）

    返回其他玩家的冒险，排除当前用户自己的冒险

    Args:
        db: 数据库会话
        current_user_id: 当前用户 ID
        category: 筛选类型（可选）
        skip: 跳过数量
        limit: 返回数量

    Returns:
        List[Adventure]: 可分叉的冒险列表
    """
    query = db.query(Adventure).filter(
        Adventure.player_id != current_user_id,  # 排除自己的冒险
        Adventure.total_nodes > 0  # 至少有一个节点
    )

    if category:
        query = query.filter(Adventure.category == category)

    # 按创建时间降序排列
    adventures = (
        query.order_by(Adventure.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return adventures


def get_fork_points(
    db: Session,
    adventure_id: int
) -> List[Dict[str, Any]]:
    """获取冒险的所有可分叉点

    返回所有故事节点及其摘要信息，供用户选择分叉点

    Args:
        db: 数据库会话
        adventure_id: 冒险 ID

    Returns:
        List[dict]: 分叉点列表
        [
            {
                "node_id": 123,
                "chapter_num": 3,
                "title": "第三章标题",
                "preview": "内容前100字...",
                "state_after": {...},  # 该节点结束时的状态
                "has_choices": true    # 是否还有可选项
            },
            ...
        ]
    """
    nodes = (
        db.query(StoryNode)
        .filter(StoryNode.adventure_id == adventure_id)
        .order_by(StoryNode.chapter_num)
        .all()
    )

    fork_points = []
    for node in nodes:
        # 提取内容预览（前100字）
        preview = node.content[:100].replace("\n", " ")
        if len(node.content) > 100:
            preview += "..."

        fork_points.append({
            "node_id": node.id,
            "chapter_num": node.chapter_num,
            "title": node.title or f"第{node.chapter_num}章",
            "preview": preview,
            "state_after": node.state_after,
            "has_choices": len(node.choices) > 0,
            "word_count": len(node.content)
        })

    return fork_points


def get_adventure_tree(
    db: Session,
    adventure_id: int
) -> Dict[str, Any]:
    """获取冒险的完整分支树（用于可视化）

    返回该冒险及其所有分叉的树状结构

    Args:
        db: 数据库会话
        adventure_id: 根冒险 ID

    Returns:
        dict: 分支树结构
        {
            "id": 1,
            "title": "原始冒险",
            "player_name": "玩家A",
            "total_nodes": 10,
            "fork_count": 2,
            "children": [
                {
                    "id": 2,
                    "title": "分支1",
                    "player_name": "玩家B",
                    "fork_from_chapter": 5,
                    "total_nodes": 8,
                    "fork_count": 0,
                    "children": []
                },
                {
                    "id": 3,
                    "title": "分支2",
                    "player_name": "玩家C",
                    "fork_from_chapter": 7,
                    "total_nodes": 6,
                    "fork_count": 1,
                    "children": [...]
                }
            ]
        }
    """
    from ..models.user import User

    def build_tree(adv_id: int) -> Dict[str, Any]:
        """递归构建树结构"""
        adventure = db.query(Adventure).filter(Adventure.id == adv_id).first()
        if not adventure:
            return None

        # 获取玩家信息
        player = db.query(User).filter(User.id == adventure.player_id).first()
        player_name = player.username if player else "未知玩家"

        # 查找所有从该冒险分叉的子冒险
        children_adventures = db.query(Adventure).filter(
            Adventure.parent_adventure_id == adv_id
        ).all()

        # 获取分叉起始章节号
        fork_from_chapter = None
        if adventure.fork_from_node_id:
            fork_node = db.query(StoryNode).filter(
                StoryNode.id == adventure.fork_from_node_id
            ).first()
            if fork_node:
                fork_from_chapter = fork_node.chapter_num

        # 构建节点数据
        node_data = {
            "id": adventure.id,
            "title": adventure.title,
            "player_name": player_name,
            "category": adventure.category,
            "total_nodes": adventure.total_nodes,
            "total_words": adventure.total_words,
            "is_finished": adventure.is_finished,
            "fork_count": len(children_adventures),
            "fork_from_chapter": fork_from_chapter,
            "children": []
        }

        # 递归构建子树
        for child_adv in children_adventures:
            child_tree = build_tree(child_adv.id)
            if child_tree:
                node_data["children"].append(child_tree)

        return node_data

    return build_tree(adventure_id)


def count_total_forks(
    db: Session,
    adventure_id: int
) -> int:
    """计算一个冒险被分叉的总次数（包括间接分叉）

    Args:
        db: 数据库会话
        adventure_id: 冒险 ID

    Returns:
        int: 总分叉次数
    """
    def count_recursive(adv_id: int) -> int:
        """递归计数"""
        direct_forks = db.query(Adventure).filter(
            Adventure.parent_adventure_id == adv_id
        ).all()

        count = len(direct_forks)

        # 递归统计子分叉
        for fork in direct_forks:
            count += count_recursive(fork.id)

        return count

    return count_recursive(adventure_id)
