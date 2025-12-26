"""模型包 - 导出所有数据模型以便统一导入"""
from .user import User
from .novel import Novel
from .chapter import Chapter, ReadingProgress
from .character import Character, WorldSetting
from .adventure import Adventure, StoryNode, PlayerChoice, AIConversation

__all__ = [
    "User",
    "Novel",
    "Chapter",
    "ReadingProgress",
    "Character",
    "WorldSetting",
    # 新增：Adventure 游戏模型
    "Adventure",
    "StoryNode",
    "PlayerChoice",
    "AIConversation",
]
