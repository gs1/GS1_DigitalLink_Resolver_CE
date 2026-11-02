import logging
from typing import Any

import psycopg
from psycopg.types.json import Json

from data_entry_db_ids import reformat_id_for_db, reformat_id_for_external_use
from postgres_db_init import TABLE_NAME, get_pool

logger = logging.getLogger(__name__)


# This script provides the CRUD functions to interact with the PostgreSQL database. It mirrors
# data_entry_db_mongo.py: same functions, same response dictionaries and status codes.


# Create a new document in the 'gs1resolver' table
def create_document(data: dict[str, Any]) -> dict[str, Any]:
    # Ensure 'data['_id']' (_id) is provided in 'data'
    if '_id' not in data:
        return {"response_status": 400, "error": "Missing '_id' in data"}

    try:
        with get_pool().connection() as conn:
            result = conn.execute(f"INSERT INTO {TABLE_NAME} (id, doc) VALUES (%s, %s) ON CONFLICT (id) DO NOTHING",
                                  (data['_id'], Json(data)))
            # A document with same '_id' exists
            if result.rowcount == 0:
                return {"response_status": 409, "error": f"Document with id {data['_id']} already exists"}

        return {"response_status": 201, "data": f"Document with id {data['_id']} created successfully"}

    except psycopg.errors.DataError as e:
        return {"response_status": 400, "error": "Invalid data: " + str(e)}

    except psycopg.Error as e:
        logger.error("Database error in create_document: %s", e)
        return {"response_status": 500, "error": "Database error: " + str(e)}

    except Exception as e:
        logger.error("Internal error in create_document: %s", e)
        return {"response_status": 500, "error": "Internal Server Error - " + str(e)}


# Read a document from the 'gs1resolver' table
def read_document(document_id: str) -> dict[str, Any]:
    try:
        internal_document_id = reformat_id_for_db(document_id)
        with get_pool().connection() as conn:
            row = conn.execute(f"SELECT doc FROM {TABLE_NAME} WHERE id = %s", (internal_document_id,)).fetchone()

        # Document not found
        if row is None:
            return {"response_status": 404,
                    "error": f"No document found for anchor: {reformat_id_for_external_use(document_id)}"}

        return {"response_status": 200, "data": row[0]}

    except psycopg.Error as e:
        logger.error("Database error in read_document: %s", e)
        return {"response_status": 500, "error": "Database error: " + str(e)}


def read_index() -> dict[str, Any]:
    try:
        with get_pool().connection() as conn:
            document_ids = [row[0] for row in conn.execute(f"SELECT id FROM {TABLE_NAME} ORDER BY id")]

        # Document ids not found
        if not document_ids:
            return {"response_status": 404, "error": "No document ids found"}

        return {"response_status": 200, "data": document_ids}

    except psycopg.Error as e:
        logger.error("Database error in read_index: %s", e)
        return {"response_status": 500, "error": "Database error: " + str(e)}


# Update an existing document in the 'gs1resolver' table
def update_document(data: dict[str, Any]) -> dict[str, Any]:
    try:
        with get_pool().connection() as conn:
            result = conn.execute(f"UPDATE {TABLE_NAME} SET doc = %s WHERE id = %s", (Json(data), data["_id"]))
            if result.rowcount == 0:
                return {"response_status": 404, "error": f"No document found with id: {data['_id']}"}  # Document not found

        return {"response_status": 200, "data": f"Document with anchor {data['_id']} updated successfully"}

    except psycopg.errors.DataError as e:
        logger.warning("update_document: Invalid data: %s", e)
        return {"response_status": 400, "error": "Invalid data: " + str(e)}

    except psycopg.Error as e:
        logger.error("update_document: Database error: %s", e)
        return {"response_status": 500, "error": "Database error: " + str(e)}

    except Exception as e:
        logger.error("update_document: Internal error: %s", e)
        return {"response_status": 500, "error": "Internal Server Error - " + str(e)}


# Delete a document from the 'gs1resolver' table
def delete_document(document_id: str) -> dict[str, Any]:
    try:
        document_id = reformat_id_for_db(document_id)
        with get_pool().connection() as conn:
            result = conn.execute(f"DELETE FROM {TABLE_NAME} WHERE id = %s", (document_id,))
            if result.rowcount == 0:
                return {"response_status": 404, "error": f"No document found with id: {document_id}"}  # Document not found

        # Operation was successful and the document was deleted
        return {"response_status": 200, "data": f"Document with anchor {document_id} deleted successfully"}

    except psycopg.Error as e:
        logger.error("delete_document: Database error: %s", e)
        return {"response_status": 500, "error": "Database error: " + str(e)}
    except Exception as e:
        logger.error("delete_document: Internal error: %s", e)
        return {"response_status": 500, "error": "Internal Server Error - " + str(e)}
