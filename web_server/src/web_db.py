from pymongo import errors
from bson import errors as bson_errors
from mongo_db_init import mongo


def _init_connection():
    resolver_db = mongo.cx['resolver_ce']
    resolver_collection = resolver_db['gs1resolver']
    return resolver_collection


def _reformat_id(id):
    id = id.replace('/', '_')
    if id[:1] == '_':
        id = id[1:]
    return id


# Read a document from the 'gs1resolver' collection
def read_document(anchor):
    try:
        resolver_coll = _init_connection()
        anchor = _reformat_id(anchor)
        document = resolver_coll.find_one({"_id": anchor})

        # Document not found
        if not document:
            return {"response_status": 404, "error": f"No document found for anchor: {anchor}"}

        return {"response_status": 200, "data": document}

    except bson_errors.InvalidId as e:
        return {"response_status": 400, "error": "Invalid ID format: " + str(e)}
    except errors.PyMongoError as e:
        # General PyMongo Error
        return {"response_status": 500, "error": "Database error: " + str(e)}
