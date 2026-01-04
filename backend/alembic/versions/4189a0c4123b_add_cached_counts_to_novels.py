"""add_cached_counts_to_novels

Revision ID: 4189a0c4123b
Revises: ea8386470db7
Create Date: 2026-01-04 14:36:27.892175

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4189a0c4123b'
down_revision: Union[str, Sequence[str], None] = 'ea8386470db7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: 添加缓存字段并初始化现有数据"""
    # 添加缓存字段
    op.add_column('novels', sa.Column('cached_chapter_count', sa.Integer(), nullable=True))
    op.add_column('novels', sa.Column('cached_word_count', sa.Integer(), nullable=True))

    # 初始化现有数据的缓存值
    # 注意：这里使用 SQL 直接计算，避免加载所有数据到内存
    connection = op.get_bind()

    # 更新 cached_chapter_count
    connection.execute(sa.text("""
        UPDATE novels
        SET cached_chapter_count = (
            SELECT COUNT(*)
            FROM chapters
            WHERE chapters.novel_id = novels.id
        )
    """))

    # 更新 cached_word_count
    connection.execute(sa.text("""
        UPDATE novels
        SET cached_word_count = (
            SELECT COALESCE(SUM(LENGTH(content)), 0)
            FROM chapters
            WHERE chapters.novel_id = novels.id
        )
    """))

    # 设置默认值为 0（对于新记录）
    op.alter_column('novels', 'cached_chapter_count', server_default='0')
    op.alter_column('novels', 'cached_word_count', server_default='0')


def downgrade() -> None:
    """Downgrade schema: 移除缓存字段"""
    op.drop_column('novels', 'cached_word_count')
    op.drop_column('novels', 'cached_chapter_count')
