"""章节模型 - 故事内容存储"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, Index
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base


class Chapter(Base):
    """章节表 - 存储故事内容"""

    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    novel_id = Column(Integer, ForeignKey("novels.id"), nullable=False, index=True)
    title = Column(String(100), nullable=False)
    content = Column(Text, nullable=True)
    order_num = Column(Float, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 结局管理字段
    is_ending = Column(Integer, default=0)  # 是否为结局章节 (0=否, 1=是)
    ending_type = Column(String(50), nullable=True)  # 结局类型: "happy"/"tragic"/"hidden"

    # 分支章节字段（互动小说）
    parent_chapter_id = Column(
        Integer,
        ForeignKey("chapters.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    choice_text = Column(String(200), nullable=True)

    # 关联关系
    novel = relationship("Novel", back_populates="chapters")

    # 双向关系（支持分支章节）
    children = relationship(
        "Chapter",
        back_populates="parent",
        cascade="all, delete-orphan",
        foreign_keys=[parent_chapter_id]
    )
    parent = relationship(
        "Chapter",
        remote_side=[id],
        back_populates="children",
        foreign_keys=[parent_chapter_id]
    )

    # 性能优化：复合索引
    __table_args__ = (
        Index('idx_novel_order', 'novel_id', 'order_num'),  # 章节列表查询(按顺序)
        Index('idx_parent_ending', 'parent_chapter_id', 'is_ending'),  # 分支章节查询
    )

    @property
    def word_count(self) -> int:
        """获取本章节字数"""
        return len(self.content) if self.content else 0

    def __repr__(self):
        return f"<Chapter(id={self.id}, title='{self.title}')>"


class ReadingProgress(Base):
    """阅读进度表 - 记录用户阅读位置"""

    __tablename__ = "reading_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    novel_id = Column(Integer, ForeignKey("novels.id"), nullable=False, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # P3 可玩性拓展字段（预留）
    choices_made = Column(Text, nullable=True)  # 选择历史的 JSON 字符串
    endings_unlocked = Column(Text, nullable=True)  # 已解锁结局的 JSON 字符串

    # 关联关系
    user = relationship("User", back_populates="reading_progress")
    novel = relationship("Novel")
    chapter = relationship("Chapter")

    def __repr__(self):
        return f"<ReadingProgress(user_id={self.user_id}, novel_id={self.novel_id})>"
