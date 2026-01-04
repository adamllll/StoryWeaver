"""服务包 - 业务逻辑层"""
from .ai_service import ai_service, AIService
from .ai_generation_service import ai_generation_service, AIGenerationService
from .novel_service import NovelService
from .chapter_service import ChapterService

__all__ = [
    "ai_service",
    "AIService",
    "ai_generation_service",
    "AIGenerationService",
    "NovelService",
    "ChapterService",
]
