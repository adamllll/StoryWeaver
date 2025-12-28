"""用户模型 - 认证与个人资料管理"""
from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base


class User(Base):
    """用户表 - 用于认证和个人资料管理"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    avatar = Column(String(255), nullable=True)
    bio = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # P3 可玩性拓展字段（预留）
    role_preference = Column(String(20), default="author")  # author | player
    achievements = Column(JSON, default=list)

    # 权限字段
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)  # 账户是否启用
    deleted_at = Column(DateTime, nullable=True)  # 软删除时间戳
    last_login_at = Column(DateTime, nullable=True)  # 最后登录时间

    # 关联关系
    novels = relationship("Novel", back_populates="author", cascade="all, delete-orphan")
    reading_progress = relationship(
        "ReadingProgress", back_populates="user", cascade="all, delete-orphan"
    )
    adventures = relationship("Adventure", back_populates="player", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"
