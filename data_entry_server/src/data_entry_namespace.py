import hmac
import os
from typing import Any

from flask import request, abort, Response
from flask_restx import Namespace, Resource, fields
import logging
import data_entry_logic
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

new_document_model, new_document_link_model = register_request_models(data_entry_namespace)
new_document_response_item_model = register_response_models(data_entry_namespace)

class TokenResource(Resource):
    @staticmethod
    def is_auth_token_ok() -> dict[str, bool | str]:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return {'result': False, 'message': "Missing Authorization Header"}

        # Remove 'Bearer ' from the start of the auth_header to get the token
        session_token = auth_header.replace('Bearer ', '')
        expected_token = os.environ.get('SESSION_TOKEN', '')
        if expected_token and hmac.compare_digest(session_token, expected_token):
            return {'result': True, 'message': "Token is valid"}

        return {'result': False, 'message': "Token is invalid"}


@data_entry_namespace.route('/heartbeat')
class HeartBeat(TokenResource):
    @data_entry_namespace.doc(description="Check if the server is running")
    def get(self) -> tuple[dict[str, str], int]:
        return {'response_message': 'Server is running!'}, 200


@data_entry_namespace.route('/new')
class NewDocOperations(TokenResource):
    @data_entry_namespace.doc(
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
    def post(self) -> tuple[Any, int] | Response:
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
            logger.warning('Error creating document: %s', e)
            abort(500, description="Error creating document:" + str(e))


@data_entry_namespace.route('/index')
class DocOperationsAll(Resource):
    @data_entry_namespace.doc(description="Get the index for all documents in the database")
    def get(self) -> tuple[dict[str, Any], int] | Response:
        try:
            response_data = data_entry_logic.read_index()
            return response_data, response_data['response_status']

        except Exception as e:
            logger.warning('Error getting document %s', e)
            abort(500, description="Error getting document index")


@data_entry_namespace.route('/<anchor_ai_code>/<anchor_ai>')
class DocOperations(TokenResource):
    @data_entry_namespace.doc(description="Retrieve a document using its anchor")
    def get(self, anchor_ai_code: str, anchor_ai: str) -> tuple[Any, int] | Response:
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
            logger.warning('Error getting document %s', e)
            abort(500, description="Error getting document")

    @data_entry_namespace.doc(description="Update a document using its anchor",
             params={'anchor': 'The anchor of the document to update'})
    def put(self, anchor_ai_code: str, anchor_ai: str) -> tuple[Any, int] | Response:
        try:
            token_result = self.is_auth_token_ok()
            if not token_result['result'] and token_result['message'] == "Missing Authorization Header":
                return token_result['message'], 401
            elif not token_result['result']:
                return token_result['message'], 403

            if not request.is_json:
                return "Request must be in JSON format", 415

            data = request.json
            document_id = f'{anchor_ai_code}_{anchor_ai}'
            response_data, http_response_status = data_entry_logic.update_document(document_id, data)
            return response_data, http_response_status

        except Exception as e:
            logger.warning('Error updating document: %s', e)
            abort(500, description="Error updating document:" + str(e))

    @data_entry_namespace.doc(description="Delete a document or remove specific links from it using its anchor. "
                         "If a JSON body with a 'links' list is provided, only the matching links "
                         "are removed (matched by linktype, hreflang and context). "
                         "If no body is provided, the entire document is deleted.",
             params={'anchor': 'The anchor of the document to delete or modify'})
    def delete(self, anchor_ai_code: str, anchor_ai: str) -> tuple[Any, int] | Response:
        try:
            token_result = self.is_auth_token_ok()
            if not token_result['result'] and token_result['message'] == "Missing Authorization Header":
                return token_result['message'], 401
            elif not token_result['result']:
                return token_result['message'], 403

            document_id = f'{anchor_ai_code}_{anchor_ai}'

            # If the request carries a JSON body with links, perform a partial delete
            # (remove only the specified links). Otherwise delete the whole document.
            if request.is_json and request.content_length:
                data = request.json
                if 'links' in data and len(data['links']) > 0:
                    response_data, http_response_status = data_entry_logic.delete_links(document_id, data)
                    return response_data, http_response_status

            response_data = data_entry_logic.delete_document(document_id)
            return response_data, response_data['response_status']

        except Exception as e:
            logger.warning('Error deleting document: %s', e)
            abort(500, description="Error deleting document")


@data_entry_namespace.route('/<anchor_ai_code>/<anchor_ai>/<path:extra_segments>')
class DocOperationsQualified(TokenResource):
    @data_entry_namespace.doc(description="Retrieve a document using its anchor")
    def get(self, anchor_ai_code: str, anchor_ai: str, extra_segments: str) -> tuple[Any, int] | Response:
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
            logger.warning('Error getting document %s', e)
            abort(500, description="Error getting document")