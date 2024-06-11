import json
from pymongo import errors
from bson import errors as bson_errors
from bson.objectid import ObjectId
import os
import logging
from pymongo import MongoClient
from mongo_db_init import mongo


# This script provides the four CRUD functions to interact with the MongoDB database

def _init_connection():
    resolver_db = mongo.cx['resolver_ce']
    resolver_collection = resolver_db['gs1resolver']
    return resolver_collection


def _reformat_id(id):
    id = id.replace('/', '_')
    if id[:1] == '_':
        id = id[1:]
    return id


# Create a new document in the 'gs1resolver' collection
def create_document(data):
    # Ensure 'data['_id']' (_id) is provided in 'data'
    if '_id' not in data:
        return {"response_status": 400, "error": "Missing '_id' in data"}

    try:
        resolver_coll = _init_connection()
        # Check if a document with same '_id' exists
        if resolver_coll.find_one({"_id": data['_id']}):
            return {"response_status": 409, "error": f"Document with id {data['_id']} already exists"}

        # No matching document exists, proceed with creation
        result = resolver_coll.insert_one(data)
        return {"response_status": 201, "data": f"Document with id {str(result.inserted_id)} created successfully"}

    except errors.DuplicateKeyError as e:
        return {"response_status": 409, "error": "Duplicate key error: " + str(e)}

    except errors.PyMongoError as e:
        # General PyMongo Error
        return {"response_status": 500, "error": "Database error: " + str(e)}

    except Exception as e:
        return {"response_status": 500, "error": "Internal Server Error - " + str(e)}


# Read a document from the 'gs1resolver' collection
def read_document(document_id):
    try:
        resolver_coll = _init_connection()
        document_id = _reformat_id(document_id)
        document = resolver_coll.find_one({"_id": document_id})

        # Document not found
        if not document:
            return {"response_status": 404, "error": f"No document found for anchor: {document_id}"}

        return {"response_status": 200, "data": document}

    except bson_errors.InvalidId as e:
        return {"response_status": 400, "error": "Invalid ID format: " + str(e)}

    except errors.PyMongoError as e:
        # General PyMongo Error
        return {"response_status": 500, "error": "Database error: " + str(e)}


def read_index():
    try:
        resolver_coll = _init_connection()
        document_ids = [doc['_id'] for doc in resolver_coll.find({}, {'_id': 1})]

        # Document ids not found
        if not document_ids:
            return {"response_status": 404, "error": f"No document ids found"}

        return {"response_status": 200, "data": document_ids}

    except bson_errors.InvalidId as e:
        return {"response_status": 400, "error": "Invalid ID format: " + str(e)}

    except errors.PyMongoError as e:
        # General PyMongo Error
        return {"response_status": 500, "error": "Database error: " + str(e)}


# Update an existing document in the 'gs1resolver' collection
def update_document(data):
    try:
        resolver_coll = _init_connection()

        result = resolver_coll.replace_one({"_id": data["_id"]}, data)
        if result.matched_count == 0:
            return {"response_status": 404, "error": f"No document found with id: {data['_id']}"}  # Document not found

        return {"response_status": 200, "data": f"Document with anchor {data['_id']} updated successfully"}

    except bson_errors.InvalidId as e:
        print('update_document: Invalid ID format: ', str(e))
        return {"response_status": 400, "error": "Invalid ID format: " + str(e)}

    except errors.PyMongoError as e:
        # General PyMongo Error
        print('update_document: PyMongoError error: ', str(e))
        return {"response_status": 500, "error": "Database error: " + str(e)}

    except Exception as e:
        print('update_document: Internal Server Error - ', str(e))
        return {"response_status": 500, "error": "Internal Server Error - " + str(e)}


# Delete a document from the 'gs1resolver' collection
def delete_document(document_id):
    # Using the 'gs1resolver' collection

    try:
        resolver_coll = _init_connection()
        document_id = _reformat_id(document_id)
        result = resolver_coll.delete_one({"_id": document_id})

        if result.deleted_count == 0:
            return {"response_status": 404, "error": f"No document found with id: {document_id}"}  # Document not found

        # Operation was successful and the document was deleted
        return {"response_status": 200, "data": f"Document with anchor {document_id} deleted successfully"}

    except bson_errors.InvalidId as e:
        return {"response_status": 400, "error": "Invalid ID format: " + str(e)}
    except errors.PyMongoError as e:
        # General PyMongo Error
        return {"response_status": 500, "error": "Database error: " + str(e)}
    except Exception as e:
        return {"response_status": 500, "error": "Internal Server Error - " + str(e)}
