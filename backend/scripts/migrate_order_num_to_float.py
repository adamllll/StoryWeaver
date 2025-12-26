"""
数据库迁移脚本：将 chapters.order_num 从 INTEGER 改为 FLOAT

SQLite 不支持直接 ALTER COLUMN，需要：
1. 创建新表（带 FLOAT 类型的 order_num）
2. 复制数据
3. 删除旧表
4. 重命名新表
"""

import sqlite3
import sys
from pathlib import Path

# 设置 UTF-8 输出（避免 Windows 编码问题）
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 数据库路径
DB_PATH = Path(__file__).parent.parent / "story_weaver.db"


def migrate_order_num_to_float():
    """执行迁移"""
    if not DB_PATH.exists():
        print(f"❌ 数据库文件不存在: {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # 开始事务
        cursor.execute("BEGIN TRANSACTION")

        # 1. 检查当前表结构
        cursor.execute("PRAGMA table_info(chapters)")
        columns = cursor.fetchall()
        print("📋 当前 chapters 表结构:")
        for col in columns:
            print(f"  {col[1]}: {col[2]}")

        # 2. 创建新表（order_num 为 REAL/FLOAT 类型）
        cursor.execute("""
            CREATE TABLE chapters_new (
                id INTEGER PRIMARY KEY,
                novel_id INTEGER NOT NULL,
                title VARCHAR(100) NOT NULL,
                content TEXT,
                order_num REAL NOT NULL,  -- 改为 REAL (SQLite 的浮点数类型)
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                parent_chapter_id INTEGER,
                choice_text VARCHAR(200),
                is_branch INTEGER DEFAULT 0,
                is_ending INTEGER DEFAULT 0,
                ending_type VARCHAR(50),
                FOREIGN KEY(novel_id) REFERENCES novels (id),
                FOREIGN KEY(parent_chapter_id) REFERENCES chapters (id)
            )
        """)
        print("\n✅ 创建新表 chapters_new")

        # 3. 复制数据（order_num 会自动转换为浮点数）
        cursor.execute("""
            INSERT INTO chapters_new
            SELECT * FROM chapters
        """)
        print("✅ 数据复制完成")

        # 4. 删除旧表
        cursor.execute("DROP TABLE chapters")
        print("✅ 删除旧表 chapters")

        # 5. 重命名新表
        cursor.execute("ALTER TABLE chapters_new RENAME TO chapters")
        print("✅ 重命名 chapters_new -> chapters")

        # 6. 重建索引
        cursor.execute("CREATE INDEX ix_chapters_novel_id ON chapters (novel_id)")
        cursor.execute("CREATE INDEX ix_chapters_order_num ON chapters (order_num)")
        cursor.execute("CREATE INDEX ix_chapters_parent_chapter_id ON chapters (parent_chapter_id)")
        print("✅ 重建索引")

        # 7. 验证新表结构
        cursor.execute("PRAGMA table_info(chapters)")
        new_columns = cursor.fetchall()
        print("\n📋 新 chapters 表结构:")
        for col in new_columns:
            print(f"  {col[1]}: {col[2]}")

        # 提交事务
        conn.commit()
        print("\n🎉 迁移成功！order_num 已改为 FLOAT 类型")

    except Exception as e:
        # 回滚事务
        conn.rollback()
        print(f"\n❌ 迁移失败: {e}")
        sys.exit(1)

    finally:
        conn.close()


if __name__ == "__main__":
    print("=" * 60)
    print("数据库迁移：chapters.order_num INTEGER -> FLOAT")
    print("=" * 60)

    # 执行迁移
    migrate_order_num_to_float()
