import os

from flask import request, jsonify, abort
from flask_restx import Namespace, Resource, Api, fields
from functools import wraps
import logging
import data_entry_logic
from werkzeug.exceptions import UnsupportedMediaType
from models.request_models import register_request_models
from models.response_models import register_response_models

data_entry_namespace = Namespace(
    '', 
    description='Resolver data entry operations', 
    authorizations={
        'BearerAuth': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': 'Use format: Bearer <SESSION_TOKEN>'
        }
    }
)

logger = logging.getLogger(__name__)

api = Api()

new_document_model, new_document_link_model = register_request_models(data_entry_namespace)
new_document_response_item_model = register_response_models(data_entry_namespace)

class TokenResource(Resource):
    @staticmethod
    def is_auth_token_ok():
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return {'result': False, 'message': "Missing Authorization Header"}

        # Remove 'Bearer ' from the start of the auth_header to get the token
        session_token = auth_header.replace('Bearer ', '')
        if session_token == os.environ.get('SESSION_TOKEN'):
            return {'result': True, 'message': "Token is valid"}

        return {'result': False, 'message': "Token is invalid"}


@data_entry_namespace.route('/heartbeat')
class HeartBeat(TokenResource):
    @api.doc(description="Check if the server is running")
    def get(self):
        return {'response_message': 'Server is running!'}, 200


@data_entry_namespace.route('/new')
class NewDocOperations(TokenResource):
    @api.doc(
        description=(
            "Create or update one or more GS1 Digital Link resolver documents.\n\n"
            "The endpoint accepts the following payloads:\n"
            "- a single Resolver CE v3 data-entry document (see `NewDocument` model),\n"
            "- a list of Resolver CE v3 documents, or\n"
            "- the legacy Resolver v2 data-entry format, which will be converted to v3 automatically.\n\n"
            "If a document with the same anchor already exists in the database, the data is "
            "updated (upsert behaviour). Otherwise, a new document is created."
        ),
        body=new_document_model,
        responses={
            200: (
                'Document updated successfully.',
                new_document_response_item_model
            ),
            201: (
                'Documents created successfully.',
                fields.List(fields.Nested(new_document_response_item_model))
            ),
            400: 'Invalid data format. The payload could not be interpreted as v2 or v3 data-entry.',
            401: 'Missing Authorization Header',
            403: 'Token is invalid.',
            415: 'Request must be in JSON format (Content-Type must be application/json).',
            500: 'Internal server error'
        },
        security='BearerAuth'
    )
    def post(self):
        try:
            token_result = self.is_auth_token_ok()
            if not token_result['result'] and token_result['message'] == "Missing Authorization Header":
                return token_result['message'], 401
            elif not token_result['result']:
                return token_result['message'], 403

            if not request.is_json:
                return "Request must be in JSON format", 415

            data = request.json
            response_data, http_response_status = data_entry_logic.create_document(data)
            return response_data, http_response_status

        except Exception as e:
            logger.warning('Error creating document: ' + str(e))
            abort(500, description="Error creating document:" + str(e))


@data_entry_namespace.route('/index')
class DocOperationsAll(Resource):
    @api.doc(description="Get the index for all documents in the database")
    def get(self):
        try:
            response_data = data_entry_logic.read_index()
            return response_data, response_data['response_status']

        except Exception as e:
            logger.warning('Error getting document ' + str(e))
            abort(500, description="Error getting document index")


@data_entry_namespace.route('/<anchor_ai_code>/<anchor_ai>')
class DocOperations(TokenResource):
    @api.doc(description="Retrieve a document using its anchor")
    def get(self, anchor_ai_code, anchor_ai):
        try:
            token_result = self.is_auth_token_ok()
            if not token_result['result'] and token_result['message'] == "Missing Authorization Header":
                return token_result['message'], 401
            elif not token_result['result']:
                return token_result['message'], 403

            document_id = f'{anchor_ai_code}_{anchor_ai}'
            response_data = data_entry_logic.read_document(document_id)
            return response_data, response_data['response_status']

        except Exception as e:
            logger.warning('Error getting document ' + str(e))
            abort(500, description="Error getting document")

    @api.doc(description="Update a document using its anchor",
             params={'anchor': 'The anchor of the document to update'})
    def put(self, anchor_ai_code, anchor_ai):
        try:
            token_result = self.is_auth_token_ok()
            if not token_result['result'] and token_result['message'] == "Missing Authorization Header":
                return token_result['message'], 401
            elif not token_result['result']:
                return token_result['message'], 403

            if not request.is_json:
                return "Request must be in JSON format", 415

            data = request.json
            # Currently create and update are the same code - will change in future
            # to enable updating individual links
            response_data, http_response_status = data_entry_logic.create_document(data)
            return response_data, http_response_status

        except Exception as e:
            logger.warning('Error creating account: ' + str(e))
            abort(500, description="Error updating document:" + str(e))

    @api.doc(description="Delete a document using its anchor",
             params={'anchor': 'The anchor of the document to delete'})
    def delete(self, anchor_ai_code, anchor_ai):
        try:
            token_result = self.is_auth_token_ok()
            if not token_result['result'] and token_result['message'] == "Missing Authorization Header":
                return token_result['message'], 401
            elif not token_result['result']:
                return token_result['message'], 403

            document_id = f'{anchor_ai_code}_{anchor_ai}'
            response_data = data_entry_logic.delete_document(document_id)
            return response_data, response_data['response_status']

        except Exception as e:
            logger.warning('Error deleting document: ' + str(e))
            abort(450, description="Error deleting document")


@data_entry_namespace.route('/<anchor_ai_code>/<anchor_ai>/<path:extra_segments>')
class DocOperations(TokenResource):
    @api.doc(description="Retrieve a document using its anchor")
    def get(self, anchor_ai_code, anchor_ai, extra_segments):
        try:
            token_result = self.is_auth_token_ok()
            if not token_result['result'] and token_result['message'] == "Missing Authorization Header":
                return token_result['message'], 401
            elif not token_result['result']:
                return token_result['message'], 403

            document_id = data_entry_logic.convert_path_to_document_id(f"/{anchor_ai_code}/{anchor_ai}/{extra_segments}")
            response_data = data_entry_logic.read_document(document_id)
            return response_data, response_data['response_status']

        except Exception as e:
            logger.warning('Error getting document ' + str(e))
            abort(500, description="Error getting document")