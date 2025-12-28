"""小说模型 - 故事管理"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base


class Novel(Base):
    """小说表 - 存储故事元数据"""

    __tablename__ = "novels"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    outline = Column(Text, nullable=True)  # 小说大纲（AI生成的章节概要）
    cover_url = Column(String(255), nullable=True)
    category = Column(String(50), nullable=False, index=True)
    status = Column(String(20), default="draft", index=True)  # draft | published
    is_interactive = Column(Boolean, default=False)  # 是否互动小说
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)  # 软删除时间戳

    # P3 可玩性拓展字段（预留）
    total_endings = Column(Integer, default=1)
    hidden_endings = Column(Integer, default=0)

    # 关联关系
    author = relationship("User", back_populates="novels")
    chapters = relationship(
        "Chapter", back_populates="novel", cascade="all, delete-orphan"
    )
    characters = relationship(
        "Character", back_populates="novel", cascade="all, delete-orphan"
    )
    world_settings = relationship(
        "WorldSetting", back_populates="novel", cascade="all, delete-orphan"
    )

    @property
    def chapter_count(self) -> int:
        """获取章节总数"""
        return len(self.chapters) if self.chapters else 0

    @property
    def word_count(self) -> int:
        """获取所有章节的总字数"""
        if not self.chapters:
            return 0
        return sum(
            len(ch.content) if ch.content else 0 for ch in self.chapters
        )

    def __repr__(self):
        return f"<Novel(id={self.id}, title='{self.title}')>"
