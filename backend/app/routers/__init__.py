"""路由包 - API 路由定义"""
from .auth import router as auth_router
from .novels import router as novels_router
from .chapters import router as chapters_router
from .ai import router as ai_router
from .characters import router as characters_router
from .reading_progress import router as reading_progress_router
from .adventures import router as adventures_router  # 从拆分后的包导入
from .conversations import router as conversations_router
from .dev import router as dev_router
from .admin import router as admin_router  # 管理员路由

__all__ = [
    "auth_router",
    "novels_router",
    "chapters_router",
    "ai_router",
    "characters_router",
    "reading_progress_router",
    "adventures_router",  # 新增：冒险游戏路由
    "conversations_router",  # 新增：对话历史路由
    "dev_router",
    "admin_router",  # 新增：管理员路由
]
