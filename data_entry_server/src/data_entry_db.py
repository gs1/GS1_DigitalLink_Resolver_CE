import logging

from pymongo import errors
from bson import errors as bson_errors
from mongo_db_init import mongo

logger = logging.getLogger(__name__)

# Cached collection reference — PyMongo handles connection pooling underneath
_resolver_collection = None


def _get_collection():
    global _resolver_collection
    if _resolver_collection is None:
        resolver_db = mongo.cx['resolver_ce']
        _resolver_collection = resolver_db['gs1resolver']
    return _resolver_collection


# This script provides the four CRUD functions to interact with the MongoDB database

# This function reformats the document id to be used in the database.
# Example: '/01/05392000229648' -> '01_05392000229648'. The leading '/' is removed
# and any other '/' characters are replaced with '_'. This is because some
# document database systems do not allow '/' characters in the primary identifier.
# This function survives keeping the correct format if called with a format that is already the internal format!
def _reformat_id_for_db(document_id):
    document_id = document_id.replace('/', '_')
    if document_id[:1] == '_':
        document_id = document_id[1:]
    return document_id


# This function reverses the reformatting performed by _reformat_id_for_db().
# Example: '01_05392000229648' -> '/01/05392000229648'. The leading '_' is replaced
# with a '/' and any other '_' characters are replaced with '/'. This is because
# we should be consistent with external views of id'.
# Note that, like function _reformat_id_for_db(), this function survives keeping the
# correct format should it be called with the external format already!
def _reformat_id_for_external_use(document_id):
    if document_id[0:1] == '/':
        return document_id.replace('_', '/')
    else:
        return '/' + document_id.replace('_', '/')


# Create a new document in the 'gs1resolver' collection
def create_document(data):
    # Ensure 'data['_id']' (_id) is provided in 'data'
    if '_id' not in data:
        return {"response_status": 400, "error": "Missing '_id' in data"}

    try:
        resolver_coll = _get_collection()
        # Check if a document with same '_id' exists
        if resolver_coll.find_one({"_id": data['_id']}):
            return {"response_status": 409, "error": f"Document with id {data['_id']} already exists"}

        # No matching document exists, proceed with creation
        result = resolver_coll.insert_one(data)
        return {"response_status": 201, "data": f"Document with id {str(result.inserted_id)} created successfully"}

    except errors.DuplicateKeyError as e:
        return {"response_status": 409, "error": "Duplicate key error: " + str(e)}

    except errors.PyMongoError as e:
        logger.error("Database error in create_document: %s", e)
        return {"response_status": 500, "error": "Database error: " + str(e)}

    except Exception as e:
        logger.error("Internal error in create_document: %s", e)
        return {"response_status": 500, "error": "Internal Server Error - " + str(e)}


# Read a document from the 'gs1resolver' collection
def read_document(document_id):
    try:
        resolver_coll = _get_collection()
        internal_document_id = _reformat_id_for_db(document_id)
        document = resolver_coll.find_one({"_id": internal_document_id})

        # Document not found
        if not document:
            return {"response_status": 404,
                    "error": f"No document found for anchor: {_reformat_id_for_external_use(document_id)}"}

        return {"response_status": 200, "data": document}

    except bson_errors.InvalidId as e:
        return {"response_status": 400, "error": "Invalid ID format: " + str(e)}

    except errors.PyMongoError as e:
        logger.error("Database error in read_document: %s", e)
        return {"response_status": 500, "error": "Database error: " + str(e)}


def read_index():
    try:
        resolver_coll = _get_collection()
        document_ids = [doc['_id'] for doc in resolver_coll.find({}, {'_id': 1})]

        # Document ids not found
        if not document_ids:
            return {"response_status": 404, "error": "No document ids found"}

        return {"response_status": 200, "data": document_ids}

    except bson_errors.InvalidId as e:
        return {"response_status": 400, "error": "Invalid ID format: " + str(e)}

    except errors.PyMongoError as e:
        logger.error("Database error in read_index: %s", e)
        return {"response_status": 500, "error": "Database error: " + str(e)}


# Update an existing document in the 'gs1resolver' collection
def update_document(data):
    try:
        resolver_coll = _get_collection()

        result = resolver_coll.replace_one({"_id": data["_id"]}, data)
        if result.matched_count == 0:
            return {"response_status": 404, "error": f"No document found with id: {data['_id']}"}  # Document not found

        return {"response_status": 200, "data": f"Document with anchor {data['_id']} updated successfully"}

    except bson_errors.InvalidId as e:
        logger.warning("update_document: Invalid ID format: %s", e)
        return {"response_status": 400, "error": "Invalid ID format: " + str(e)}

    except errors.PyMongoError as e:
        logger.error("update_document: Database error: %s", e)
        return {"response_status": 500, "error": "Database error: " + str(e)}

    except Exception as e:
        logger.error("update_document: Internal error: %s", e)
        return {"response_status": 500, "error": "Internal Server Error - " + str(e)}


# Delete a document from the 'gs1resolver' collection
def delete_document(document_id):
    try:
        resolver_coll = _get_collection()
        document_id = _reformat_id_for_db(document_id)
        result = resolver_coll.delete_one({"_id": document_id})

        if result.deleted_count == 0:
            return {"response_status": 404, "error": f"No document found with id: {document_id}"}  # Document not found

        # Operation was successful and the document was deleted
        return {"response_status": 200, "data": f"Document with anchor {document_id} deleted successfully"}

    except bson_errors.InvalidId as e:
        return {"response_status": 400, "error": "Invalid ID format: " + str(e)}
    except errors.PyMongoError as e:
        logger.error("delete_document: Database error: %s", e)
        return {"response_status": 500, "error": "Database error: " + str(e)}
    except Exception as e:
        logger.error("delete_document: Internal error: %s", e)
        return {"response_status": 500, "error": "Internal Server Error - " + str(e)}
