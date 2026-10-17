"""Runnable regression for fresh, legacy and interrupted cached-count upgrades."""
import importlib.util
from pathlib import Path

import pytest
import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations

from app.migrations import migrate_cached_counts


@pytest.mark.parametrize('partial', [0, 1, 2, 3])
def test_cached_count_upgrade(partial):
    engine = sa.create_engine('sqlite:///:memory:')
    with engine.connect() as conn:
        conn.exec_driver_sql('CREATE TABLE novels (id INTEGER PRIMARY KEY)')
        conn.exec_driver_sql('CREATE TABLE chapters (id INTEGER PRIMARY KEY, novel_id INTEGER REFERENCES novels(id), content TEXT)')
        conn.exec_driver_sql('INSERT INTO novels VALUES (1), (2)')
        conn.exec_driver_sql("INSERT INTO chapters VALUES (1, 1, '你好abc'), (2, 1, NULL), (3, 1, '')")
        if partial:
            conn.exec_driver_sql('ALTER TABLE novels ADD COLUMN cached_chapter_count INTEGER')
        if partial >= 2:
            conn.exec_driver_sql('ALTER TABLE novels ADD COLUMN cached_word_count INTEGER')
        if partial == 3:
            conn.exec_driver_sql('UPDATE novels SET cached_chapter_count=3, cached_word_count=5 WHERE id=1')
        conn.commit()
        conn.exec_driver_sql('BEGIN IMMEDIATE')
        migrate_cached_counts(conn)
        conn.commit()
        expected = [(1, 3, 5), (2, 0, 0)]
        assert list(conn.exec_driver_sql('SELECT * FROM novels ORDER BY id')) == expected
        assert conn.exec_driver_sql('SELECT count(*) FROM chapters').scalar() == 3
        assert not list(conn.exec_driver_sql('PRAGMA foreign_key_check'))
        assert conn.exec_driver_sql('PRAGMA quick_check').scalar() == 'ok'
        assert all(c['default'] is not None for c in sa.inspect(conn).get_columns('novels')[1:])
        conn.commit()
        # Exercise the shipped Alembic entry too, twice, not a second implementation.
        path = Path(__file__).parents[1] / 'alembic/versions/4189a0c4123b_add_cached_counts_to_novels.py'
        spec = importlib.util.spec_from_file_location('counts_revision', path)
        revision = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(revision)
        for _ in range(2):
            with conn.begin(), Operations.context(MigrationContext.configure(conn)):
                revision.upgrade()
        assert list(conn.exec_driver_sql('SELECT * FROM novels ORDER BY id')) == expected
        conn.exec_driver_sql('INSERT INTO novels (id) VALUES (3)')
        assert tuple(conn.exec_driver_sql('SELECT * FROM novels WHERE id=3').one()) == (3, 0, 0)


def test_batch_refuses_enabled_foreign_keys():
    engine = sa.create_engine('sqlite:///:memory:')
    with engine.connect() as conn:
        conn.exec_driver_sql('PRAGMA foreign_keys=ON')
        conn.exec_driver_sql('CREATE TABLE novels (id INTEGER PRIMARY KEY, cached_chapter_count INTEGER)')
        with pytest.raises(RuntimeError, match='Disable SQLite foreign_keys'):
            migrate_cached_counts(conn)


def test_sqlite_ddl_and_backfill_rollback():
    engine = sa.create_engine('sqlite:///:memory:')
    with engine.connect() as conn:
        conn.exec_driver_sql('CREATE TABLE novels (id INTEGER PRIMARY KEY)')
        # Missing chapters causes the real backfill to fail after its first ALTER.
        conn.commit()
        conn.exec_driver_sql('BEGIN IMMEDIATE')
        with pytest.raises(sa.exc.OperationalError):
            migrate_cached_counts(conn)
        conn.rollback()
        assert [c['name'] for c in sa.inspect(conn).get_columns('novels')] == ['id']
