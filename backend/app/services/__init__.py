"""服务包 - 业务逻辑层"""
from .ai_service import ai_service, AIService
from .ai_generation_service import ai_generation_service, AIGenerationService

__all__ = ["ai_service", "AIService", "ai_generation_service", "AIGenerationService"]
