"""角色和世界观模型 - 故事元数据存储"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base


class Character(Base):
    """角色表 - 存储角色设定"""

    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    novel_id = Column(Integer, ForeignKey("novels.id"), nullable=False, index=True)
    name = Column(String(50), nullable=False)
    role_type = Column(String(20), nullable=True)  # 主角、反派等
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 关联关系
    novel = relationship("Novel", back_populates="characters")

    def __repr__(self):
        return f"<Character(id={self.id}, name='{self.name}')>"


class WorldSetting(Base):
    """世界观设定表 - 存储世界构建信息"""

    __tablename__ = "world_settings"

    id = Column(Integer, primary_key=True, index=True)
    novel_id = Column(Integer, ForeignKey("novels.id"), nullable=False, index=True)
    setting_type = Column(String(50), nullable=False)  # 地理、力量体系等
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 关联关系
    novel = relationship("Novel", back_populates="world_settings")

    def __repr__(self):
        return f"<WorldSetting(id={self.id}, name='{self.name}')>"
