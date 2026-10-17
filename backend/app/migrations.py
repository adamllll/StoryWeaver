"""Shared cached-count migration for startup and the Alembic revision."""
import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations


def migrate_cached_counts(connection):
    columns = {c['name']: c for c in sa.inspect(connection).get_columns('novels')}
    operations = Operations(MigrationContext.configure(connection))
    counts = {
        'cached_chapter_count': 'COUNT(*)',
        'cached_word_count': 'COALESCE(SUM(LENGTH(content)), 0)',
    }
    needs_default = [name for name in counts if name in columns and columns[name]['default'] is None]
    if needs_default and connection.dialect.name == 'sqlite':
        # Batch recreation must not cascade-delete rows referencing novels.
        if connection.exec_driver_sql('PRAGMA foreign_keys').scalar():
            raise RuntimeError('Disable SQLite foreign_keys before starting the migration transaction')
        if connection.exec_driver_sql("SELECT 1 FROM sqlite_master WHERE type='trigger' AND tbl_name='novels'").first():
            raise RuntimeError('Novel triggers require an explicit batch migration review')

    for name, expression in counts.items():
        missing = name not in columns
        if missing:
            operations.add_column('novels', sa.Column(name, sa.Integer(), nullable=True, server_default='0'))
        # Preserve completed backfills; recover NULLs left by an interrupted old revision.
        where = '' if missing else f' WHERE {name} IS NULL'
        connection.execute(sa.text(f'''UPDATE novels SET {name} = (
            SELECT {expression} FROM chapters WHERE chapters.novel_id = novels.id
        ){where}'''))

    if needs_default:
        with operations.batch_alter_table('novels') as batch:
            for name in needs_default:
                batch.alter_column(name, existing_type=sa.Integer(), server_default='0')
    if connection.dialect.name == 'sqlite' and connection.exec_driver_sql('PRAGMA foreign_key_check').first():
        raise RuntimeError('Foreign key integrity check failed during cached-count migration')
