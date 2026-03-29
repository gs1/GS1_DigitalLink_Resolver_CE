import logging
from typing import Any

from pymongo import errors
from pymongo.collection import Collection
from bson import errors as bson_errors
from mongo_db_init import mongo

logger = logging.getLogger(__name__)

# Cached collection reference — PyMongo handles connection pooling underneath
_resolver_collection: Collection | None = None


def _get_collection() -> Collection:
    global _resolver_collection
    if _resolver_collection is None:
        resolver_db = mongo.cx['resolver_ce']
        _resolver_collection = resolver_db['gs1resolver']
    return _resolver_collection


def _reformat_id(anchor_id: str) -> str:
    anchor_id = anchor_id.replace('/', '_')
    if anchor_id[:1] == '_':
        anchor_id = anchor_id[1:]
    return anchor_id


# Read a document from the 'gs1resolver' collection
def read_document(anchor: str) -> dict[str, Any]:
    try:
        resolver_coll = _get_collection()
        anchor = _reformat_id(anchor)
        document = resolver_coll.find_one({"_id": anchor})

        # Document not found
        if not document:
            return {"response_status": 404, "error": f"No document found for anchor: {anchor}"}

        return {"response_status": 200, "data": document}

    except bson_errors.InvalidId as e:
        logger.error("Invalid ID format: %s", e)
        return {"response_status": 500, "error": "Invalid ID format: " + str(e)}
    except errors.PyMongoError as e:
        logger.error("Database error: %s", e)
        return {"response_status": 500, "error": "Database error: " + str(e)}
