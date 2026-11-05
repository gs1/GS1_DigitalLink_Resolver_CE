import logging
import os

import psycopg
from psycopg_pool import ConnectionPool

logger = logging.getLogger(__name__)

# Documents are stored as JSON (not JSONB, which does not preserve the key order of objects)
# in a single table: the id column holds the document id
# (e.g. '01_09506000134369') and the doc column holds the whole linkset document.
TABLE_NAME = 'gs1resolver'

_pool: ConnectionPool | None = None


def init_postgres() -> None:
    global _pool
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is not set")
    # Log the host only — do not log credentials
    database_host = database_url.split('@')[-1] if '@' in database_url else database_url
    logger.info("Connecting to PostgreSQL at %s", database_host)

    # autocommit: every database function runs a single statement, so there is no transaction to manage
    _pool = ConnectionPool(database_url,
                           min_size=1,
                           max_size=int(os.getenv('DB_POOL_MAX_SIZE', '10')),
                           kwargs={'autocommit': True},
                           open=False)
    # The database container may still be starting up, so wait for the first connection
    _pool.open(wait=True, timeout=float(os.getenv('DB_CONNECT_TIMEOUT', '60')))

    try:
        with _pool.connection() as conn:
            conn.execute(f"CREATE TABLE IF NOT EXISTS {TABLE_NAME} (id TEXT PRIMARY KEY, doc JSON NOT NULL)")
    except (psycopg.errors.UniqueViolation, psycopg.errors.DuplicateTable):
        # The other server created the table at the same moment
        pass
    logger.info("PostgreSQL connection initialised")


def get_pool() -> ConnectionPool:
    if _pool is None:
        raise RuntimeError("PostgreSQL connection pool is not initialised")
    return _pool
