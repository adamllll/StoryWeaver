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


def _migrate_add_missing_columns():
    """为已存在的表添加缺失的列（SQLite 迁移）"""
    from sqlalchemy import text

    migrations = [
        # users 表新增列
        ("users", "is_admin", "ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0"),
        ("users", "is_active", "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"),
        ("users", "deleted_at", "ALTER TABLE users ADD COLUMN deleted_at DATETIME"),
        ("users", "last_login_at", "ALTER TABLE users ADD COLUMN last_login_at DATETIME"),
        # novels 表新增列
        ("novels", "deleted_at", "ALTER TABLE novels ADD COLUMN deleted_at DATETIME"),
    ]

    with engine.connect() as conn:
        for table, column, sql in migrations:
            # 检查列是否存在
            result = conn.execute(text(f"PRAGMA table_info({table})"))
            columns = [row[1] for row in result.fetchall()]
            if column not in columns:
                try:
                    conn.execute(text(sql))
                    conn.commit()
                    print(f"[迁移] 已添加列: {table}.{column}")
                except Exception as e:
                    print(f"[迁移] 添加列 {table}.{column} 失败: {e}")


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

    # 迁移：为已存在的表添加缺失的列
    _migrate_add_missing_columns()

    # 创建默认管理员账号（如果不存在）
    _create_default_admin()


def _create_default_admin():
    """创建默认管理员账号"""
    from .models import User
    from .utils.security import hash_password
    import os

    # 从环境变量读取管理员配置，或使用默认值
    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

    db = SessionLocal()
    try:
        # 检查管理员是否已存在
        existing = db.query(User).filter(User.username == admin_username).first()
        if not existing:
            admin = User(
                username=admin_username,
                email=admin_email,
                password_hash=hash_password(admin_password),
                is_admin=True,
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print(f"[OK] 默认管理员已创建: {admin_username}")
        else:
            # 确保已存在的用户是管理员
            if not existing.is_admin:
                existing.is_admin = True
                db.commit()
                print(f"[OK] 已将 {admin_username} 设为管理员")
    finally:
        db.close()
