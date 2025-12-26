"""冒险游戏导出服务

将冒险历程整理成完整小说并支持导出为不同格式
"""

from typing import Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session

from ..models.adventure import Adventure, StoryNode
from ..models.user import User


def extract_title_from_content(content: str) -> str:
    """从内容中提取章节标题

    策略：
    1. 如果内容以 # 开头，提取第一行作为标题
    2. 否则提取第一段的前20个字作为标题

    Args:
        content: 章节内容

    Returns:
        str: 提取的标题
    """
    if not content:
        return "无标题"

    # 移除首尾空白
    content = content.strip()

    # 如果以 # 开头（Markdown 标题）
    if content.startswith("#"):
        first_line = content.split("\n")[0]
        # 移除所有 # 号和前后空格
        title = first_line.lstrip("#").strip()
        return title if title else "无标题"

    # 否则提取第一段的前20个字
    first_paragraph = content.split("\n\n")[0]
    first_paragraph = first_paragraph.replace("\n", " ").strip()

    # 限制长度为20字
    if len(first_paragraph) > 20:
        title = first_paragraph[:20] + "..."
    else:
        title = first_paragraph

    return title if title else "无标题"


def compile_adventure_to_novel(db: Session, adventure_id: int) -> Dict[str, Any]:
    """将冒险历程整理成完整小说

    按照章节顺序整理所有故事节点，生成完整的小说数据结构

    Args:
        db: 数据库会话
        adventure_id: 冒险 ID

    Returns:
        dict: 包含小说完整信息的字典
        {
            "title": "小说标题",
            "author": "作者",
            "category": "类型",
            "keywords": ["关键词1", "关键词2"],
            "protagonist": {
                "name": "主角名",
                "gender": "性别",
                "personality": "性格"
            },
            "chapters": [
                {
                    "number": 1,
                    "title": "章节标题",
                    "content": "章节内容",
                    "word_count": 1000
                },
                ...
            ],
            "total_words": 总字数,
            "total_chapters": 章节数,
            "final_state": {...},  # 最终玩家状态
            "journey_stats": {  # 旅程统计
                "total_choices": 总选择数,
                "total_nodes": 总节点数,
                "play_time": "游戏时长"
            },
            "generated_at": "生成时间"
        }

    Raises:
        ValueError: 如果冒险不存在
    """
    # 获取冒险数据
    adventure = db.query(Adventure).filter(Adventure.id == adventure_id).first()
    if not adventure:
        raise ValueError(f"Adventure with id {adventure_id} not found")

    # 获取所有节点，按章节号排序
    nodes = (
        db.query(StoryNode)
        .filter(StoryNode.adventure_id == adventure_id)
        .order_by(StoryNode.chapter_num)
        .all()
    )

    # 验证节点是否为空
    if not nodes:
        raise ValueError("Adventure has no content to export (no story nodes)")

    # 整理章节数据
    chapters = []
    for node in nodes:
        # 提取章节标题
        title = extract_title_from_content(node.content)

        chapters.append({
            "number": node.chapter_num,
            "title": title,
            "content": node.content,
            "word_count": len(node.content)
        })

    # 获取玩家信息
    player = db.query(User).filter(User.id == adventure.player_id).first()
    author_name = player.username if player else "未知作者"

    # 计算游戏时长
    play_time = "未知"
    if adventure.finished_at and adventure.created_at:
        delta = adventure.finished_at - adventure.created_at
        hours = delta.total_seconds() // 3600
        minutes = (delta.total_seconds() % 3600) // 60
        play_time = f"{int(hours)}小时{int(minutes)}分钟"

    # 组装完整数据
    novel_data = {
        "title": adventure.title or f"{adventure.protagonist_name}的冒险",
        "author": f"由{author_name}探索生成",
        "category": adventure.category,
        "keywords": adventure.keywords,
        "protagonist": {
            "name": adventure.protagonist_name,
            "gender": adventure.protagonist_gender,
            "personality": adventure.protagonist_personality or "无特殊设定"
        },
        "chapters": chapters,
        "total_words": sum(c["word_count"] for c in chapters),
        "total_chapters": len(chapters),
        "final_state": adventure.player_state,
        "journey_stats": {
            "total_choices": adventure.total_choices,
            "total_nodes": adventure.total_nodes,
            "play_time": play_time
        },
        "generated_at": datetime.now().isoformat()
    }

    return novel_data


def export_to_txt(novel_data: Dict[str, Any]) -> str:
    """将小说数据导出为 TXT 格式

    Args:
        novel_data: compile_adventure_to_novel 返回的小说数据

    Returns:
        str: TXT 格式的小说文本
    """
    lines = []

    # 标题和基本信息
    lines.append(novel_data["title"])
    lines.append("=" * 50)
    lines.append(f"\n作者：{novel_data['author']}")
    lines.append(f"类型：{novel_data['category']}")
    lines.append(f"关键词：{', '.join(novel_data['keywords'])}")
    lines.append(f"总字数：{novel_data['total_words']:,} 字")
    lines.append(f"总章节：{novel_data['total_chapters']} 章")

    # 主角信息
    protagonist = novel_data["protagonist"]
    lines.append(f"\n主角：{protagonist['name']}（{protagonist['gender']}）")
    if protagonist["personality"] != "无特殊设定":
        lines.append(f"性格：{protagonist['personality']}")

    # 旅程统计
    stats = novel_data["journey_stats"]
    lines.append(f"\n旅程统计：")
    lines.append(f"  - 游戏时长：{stats['play_time']}")
    lines.append(f"  - 做出选择：{stats['total_choices']} 次")
    lines.append(f"  - 经历节点：{stats['total_nodes']} 个")

    # 生成时间
    lines.append(f"\n导出时间：{novel_data['generated_at']}")

    # 分隔线
    lines.append("\n" + "=" * 50)
    lines.append("\n正文\n")
    lines.append("=" * 50 + "\n")

    # 章节内容
    for chapter in novel_data["chapters"]:
        lines.append(f"\n第{chapter['number']}章 {chapter['title']}")
        lines.append("-" * 50)
        lines.append(f"\n{chapter['content']}\n")
        lines.append("-" * 50)
        lines.append(f"\n（本章字数：{chapter['word_count']} 字）\n")

    # 结尾
    lines.append("\n" + "=" * 50)
    lines.append("\n--- 全文完 ---")
    lines.append(f"\n本小说由 StoryWeaver 冒险游戏生成")
    lines.append("=" * 50)

    return "\n".join(lines)


def export_to_markdown(novel_data: Dict[str, Any]) -> str:
    """将小说数据导出为 Markdown 格式

    Args:
        novel_data: compile_adventure_to_novel 返回的小说数据

    Returns:
        str: Markdown 格式的小说文本
    """
    lines = []

    # 标题和基本信息
    lines.append(f"# {novel_data['title']}\n")
    lines.append(f"**作者**：{novel_data['author']}  ")
    lines.append(f"**类型**：{novel_data['category']}  ")
    lines.append(f"**关键词**：{', '.join(novel_data['keywords'])}  ")
    lines.append(f"**总字数**：{novel_data['total_words']:,} 字  ")
    lines.append(f"**总章节**：{novel_data['total_chapters']} 章\n")

    # 主角信息
    protagonist = novel_data["protagonist"]
    lines.append("## 主角信息\n")
    lines.append(f"- **姓名**：{protagonist['name']}")
    lines.append(f"- **性别**：{protagonist['gender']}")
    if protagonist["personality"] != "无特殊设定":
        lines.append(f"- **性格**：{protagonist['personality']}")
    lines.append("")

    # 旅程统计
    stats = novel_data["journey_stats"]
    lines.append("## 旅程统计\n")
    lines.append(f"- **游戏时长**：{stats['play_time']}")
    lines.append(f"- **做出选择**：{stats['total_choices']} 次")
    lines.append(f"- **经历节点**：{stats['total_nodes']} 个")
    lines.append("")

    # 生成时间
    lines.append(f"*导出时间：{novel_data['generated_at']}*\n")
    lines.append("---\n")

    # 章节内容
    lines.append("## 正文\n")
    for chapter in novel_data["chapters"]:
        lines.append(f"### 第{chapter['number']}章 {chapter['title']}\n")
        lines.append(chapter['content'])
        lines.append(f"\n*（本章字数：{chapter['word_count']} 字）*\n")
        lines.append("---\n")

    # 结尾
    lines.append("**--- 全文完 ---**\n")
    lines.append("*本小说由 StoryWeaver 冒险游戏生成*")

    return "\n".join(lines)


def get_adventure_summary(db: Session, adventure_id: int) -> str:
    """获取冒险的简短摘要（用于分享等场景）

    Args:
        db: 数据库会话
        adventure_id: 冒险 ID

    Returns:
        str: 冒险摘要文本

    Raises:
        ValueError: 如果冒险不存在
    """
    adventure = db.query(Adventure).filter(Adventure.id == adventure_id).first()
    if not adventure:
        raise ValueError(f"Adventure with id {adventure_id} not found")

    player = db.query(User).filter(User.id == adventure.player_id).first()
    author_name = player.username if player else "未知作者"

    # 获取第一个节点（开局）
    first_node = (
        db.query(StoryNode)
        .filter(StoryNode.adventure_id == adventure_id)
        .order_by(StoryNode.chapter_num)
        .first()
    )

    # 提取开局前100字作为简介
    intro = ""
    if first_node and first_node.content:
        intro = first_node.content[:100].replace("\n", " ")
        if len(first_node.content) > 100:
            intro += "..."

    summary_lines = [
        f"《{adventure.title or f'{adventure.protagonist_name}的冒险'}》",
        f"",
        f"类型：{adventure.category}",
        f"作者：{author_name}",
        f"主角：{adventure.protagonist_name}",
        f"",
        f"简介：{intro}",
        f"",
        f"统计：共 {adventure.total_nodes} 章，{adventure.total_words} 字",
        f"状态：{'已完结' if adventure.is_finished else '进行中'}",
    ]

    if adventure.is_finished and adventure.final_ending:
        ending_names = {
            "happy": "圆满结局",
            "tragic": "悲剧结局",
            "game_over": "Game Over",
            "user_quit": "未完待续"
        }
        ending = ending_names.get(adventure.final_ending, adventure.final_ending)
        summary_lines.append(f"结局：{ending}")

    return "\n".join(summary_lines)
