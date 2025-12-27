"""
织梦者后端配置管理模块
使用环境变量管理敏感数据
"""
import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置类，从环境变量加载配置"""

    # 数据库配置
    DATABASE_URL: str = "sqlite:///./data/story.db"

    # JWT 认证配置
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7

    # AI 服务配置
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4"  # 默认模型

    # 分功能模型配置（留空则使用默认模型 OPENAI_MODEL）
    OPENAI_MODEL_OUTLINE: str = ""    # 大纲生成
    OPENAI_MODEL_CONTINUE: str = ""   # 章节续写
    OPENAI_MODEL_EXPAND: str = ""     # 文本扩写
    OPENAI_MODEL_REWRITE: str = ""    # 文本重写
    OPENAI_MODEL_CHARACTER: str = ""  # 角色生成
    OPENAI_MODEL_BRANCH: str = ""     # 分支生成
    OPENAI_MODEL_FORMAT_OPTIMIZE: str = ""  # 格式优化

    CLAUDE_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-3-opus-20240229"

    def get_model(self, task: str) -> str:
        """
        根据任务类型获取对应的模型名称

        参数:
            task: 任务类型，可选值：outline, continue, expand, character, branch, format_optimize

        返回:
            对应的模型名称，如果未配置则返回默认模型
        """
        model_map = {
            "outline": self.OPENAI_MODEL_OUTLINE,
            "continue": self.OPENAI_MODEL_CONTINUE,
            "expand": self.OPENAI_MODEL_EXPAND,
            "rewrite": self.OPENAI_MODEL_REWRITE,
            "character": self.OPENAI_MODEL_CHARACTER,
            "branch": self.OPENAI_MODEL_BRANCH,
            "format_optimize": self.OPENAI_MODEL_FORMAT_OPTIMIZE,
        }
        # 如果指定任务的模型为空，则使用默认模型
        return model_map.get(task, "") or self.OPENAI_MODEL

    # 服务器配置
    # 本小姐提醒：生产环境必须关闭 DEBUG！开发时在 .env 文件中设置 DEBUG=true (￣▽￣)ノ
    DEBUG: bool = False
    FRONTEND_URL: str = "http://localhost:3000"

    # 速率限制
    AI_REQUESTS_PER_MINUTE: int = 5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """获取缓存的配置实例"""
    return Settings()


settings = get_settings()
