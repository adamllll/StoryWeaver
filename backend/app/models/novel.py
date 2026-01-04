"""小说模型 - 故事管理"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Index
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

    # 性能优化：缓存字段（避免实时计算）
    cached_chapter_count = Column(Integer, default=0)  # 章节总数缓存
    cached_word_count = Column(Integer, default=0)  # 总字数缓存

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

    # 性能优化：复合索引
    __table_args__ = (
        Index('idx_user_status', 'user_id', 'status'),  # 用户的小说列表查询
        Index('idx_category_status', 'category', 'status'),  # 分类浏览查询
        Index('idx_updated_at', 'updated_at'),  # 最新更新排序
    )

    @property
    def chapter_count(self) -> int:
        """获取章节总数（优先使用缓存）"""
        # 如果缓存字段存在且有效，使用缓存
        if hasattr(self, 'cached_chapter_count') and self.cached_chapter_count is not None:
            return self.cached_chapter_count
        # 否则实时计算（兼容旧数据）
        return len(self.chapters) if self.chapters else 0

    @property
    def word_count(self) -> int:
        """获取所有章节的总字数（优先使用缓存）"""
        # 如果缓存字段存在且有效，使用缓存
        if hasattr(self, 'cached_word_count') and self.cached_word_count is not None:
            return self.cached_word_count
        # 否则实时计算（兼容旧数据）
        if not self.chapters:
            return 0
        return sum(
            len(ch.content) if ch.content else 0 for ch in self.chapters
        )

    def __repr__(self):
        return f"<Novel(id={self.id}, title='{self.title}')>"
