import os

from flask import request, jsonify, abort
from flask_restx import Namespace, Resource, Api, fields
from functools import wraps
import logging
import data_entry_logic
from werkzeug.exceptions import UnsupportedMediaType

data_entry_namespace = Namespace('', description='Resolver data entry operations')

logger = logging.getLogger(__name__)

api = Api()


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
    @api.doc(description="Create a new document")
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
            logger.warning('Error creating account: ' + str(e))
            abort(500, description="Error creating document:" + str(e))


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

            anchor = f'{anchor_ai_code}/{anchor_ai}'
            print('GET', anchor)
            response_data = data_entry_logic.read_document(anchor)
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

            anchor = f'/{anchor_ai_code}/{anchor_ai}'
            print('PUT', anchor)
            if not request.is_json:
                return "Request must be in JSON format", 415

            data = request.json
            response_data = data_entry_logic.update_document(anchor, data)
            return response_data, response_data['response_status']
        except Exception as e:
            logger.warning('Error updating document: ' + str(e))
            abort(500, description="Error updating document: " + str(e))

    @api.doc(description="Delete a document using its anchor",
             params={'anchor': 'The anchor of the document to delete'})
    def delete(self, anchor_ai_code, anchor_ai):
        try:
            token_result = self.is_auth_token_ok()
            if not token_result['result'] and token_result['message'] == "Missing Authorization Header":
                return token_result['message'], 401
            elif not token_result['result']:
                return token_result['message'], 403

            anchor = f'/{anchor_ai_code}/{anchor_ai}'
            print('DELETE', anchor)
            response_data = data_entry_logic.delete_document(anchor)
            return response_data, response_data['response_status']
        except Exception as e:
            logger.warning('Error deleting document: ' + str(e))
            abort(450, description="Error deleting document")
