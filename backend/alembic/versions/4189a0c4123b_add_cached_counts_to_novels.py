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
    """Upgrade existing databases, including interrupted older attempts."""
    from app.migrations import migrate_cached_counts
    migrate_cached_counts(op.get_bind())


def downgrade() -> None:
    """Downgrade schema: 移除缓存字段"""
    op.drop_column('novels', 'cached_word_count')
    op.drop_column('novels', 'cached_chapter_count')
