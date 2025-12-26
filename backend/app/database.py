"""
数据库连接和会话管理模块
使用 SQLite + SQLAlchemy ORM
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# 创建数据库引擎，配置 SQLite 优化参数
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={
        "check_same_thread": False,  # FastAPI 多线程必需
        "timeout": 30,
    },
    echo=settings.DEBUG,  # 调试模式下打印 SQL 日志
)


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """配置 SQLite 参数以提升性能"""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")  # 启用预写日志模式
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA cache_size=10000")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# 会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 模型基类
Base = declarative_base()


def get_db():
    """
    获取数据库会话的依赖注入函数
    确保请求结束后正确清理会话
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    初始化数据库表

    通过导入 models 包来确保所有模型都被注册到 Base.metadata，
    然后创建所有表结构。
    """
    # 导入所有模型以确保它们被注册到 Base.metadata
    from .models import (  # noqa: F401
        User, Novel, Chapter, ReadingProgress,
        Character, WorldSetting,
        Adventure, StoryNode, PlayerChoice, AIConversation
    )
    Base.metadata.create_all(bind=engine)
