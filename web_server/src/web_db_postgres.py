import logging
from typing import Any

import psycopg

from postgres_db_init import TABLE_NAME, get_pool
from web_db_ids import reformat_id_for_db

logger = logging.getLogger(__name__)


# Read a document from the 'gs1resolver' table
def read_document(anchor: str) -> dict[str, Any]:
    try:
        anchor = reformat_id_for_db(anchor)
        with get_pool().connection() as conn:
            row = conn.execute(f"SELECT doc FROM {TABLE_NAME} WHERE id = %s", (anchor,)).fetchone()

        # Document not found
        if row is None:
            return {"response_status": 404, "error": f"No document found for anchor: {anchor}"}

        return {"response_status": 200, "data": row[0]}

    except psycopg.Error as e:
        logger.error("Database error: %s", e)
        return {"response_status": 500, "error": "Database error: " + str(e)}
