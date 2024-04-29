from flask import request, jsonify, abort, Response
import json
from flask_restx import Namespace, Resource, Api, fields
import logging
import web_logic
from werkzeug.exceptions import UnsupportedMediaType

data_entry_namespace = Namespace('', description='Resolver web operations')

logger = logging.getLogger(__name__)

api = Api()


@data_entry_namespace.route('/heartbeat')
class HeartBeat(Resource):
    @api.doc(description="Check if the server is running")
    def get(self):
        return {'response_message': 'Server is running!'}, 200


@data_entry_namespace.route('/<anchor_ai_code>/<anchor_ai>')
class DocOperationsIdentifiersOnly(Resource):
    @api.doc(description="Get a document its anchor (GS1 identifiers only)")
    def get(self, anchor_ai_code, anchor_ai):
        try:
            identifiers = f'/{anchor_ai_code}/{anchor_ai}'
            doc_id = f'{anchor_ai_code}_{anchor_ai}'
            print('GET', doc_id)
            # now get any query strings

            accept_language_list, context, linktype, media_types_list = _get_request_parameters()

            response_data = web_logic.read_document(identifiers,
                                                    doc_id,
                                                    None,
                                                    linktype,
                                                    accept_language_list,
                                                    context,
                                                    media_types_list)

            response = Response(
                response=json.dumps(response_data),  # Set response data
                status=response_data['response_status'],  # Set status code
                mimetype='application/json'  # Set MIME type
            )

            if response_data['response_status'] == 307:
                response.headers['Location'] = response_data['data']['href']

            return response

        except Exception as e:
            logger.warning('Error getting document ' + str(e))
            abort(500, description="Error getting document")

    @data_entry_namespace.route('/<anchor_ai_code>/<anchor_ai>/<qualifier_1_code>/<qualifier_1>')
    class DocOperationsIdentifiersAndOneQualifier(Resource):
        @api.doc(description="Get a document its anchor (GS1 identifiers plus one qualifier)")
        def get(self, anchor_ai_code, anchor_ai, qualifier_1_code, qualifier_1):
            try:
                identifiers = f'/{anchor_ai_code}/{anchor_ai}'
                doc_id = f'{anchor_ai_code}_{anchor_ai}'
                print('GET', doc_id)
                # now get any query strings

                accept_language_list, context, linktype, media_types_list = _get_request_parameters()
                qualifier_path = f'/{qualifier_1_code}/{qualifier_1}'

                response_data = web_logic.read_document(identifiers,
                                                        doc_id,
                                                        qualifier_path,
                                                        linktype,
                                                        accept_language_list,
                                                        context,
                                                        media_types_list)

                response = Response(
                    response=json.dumps(response_data),  # Set response data
                    status=response_data['response_status'],  # Set status code
                    mimetype='application/json'  # Set MIME type
                )

                if response_data['response_status'] == 307:
                    response.headers['Location'] = response_data['data']['href']

                return response

            except Exception as e:
                logger.warning('Error getting document ' + str(e))
                abort(500, description="Error getting document")

    @data_entry_namespace.route(
        '/<anchor_ai_code>/<anchor_ai>/<qualifier_1_code>/<qualifier_1>/<qualifier_2_code>/<qualifier_2>')
    class DocOperationsIdentifiersAndTwoQualifiers(Resource):
        @api.doc(description="Get a document its anchor (GS1 identifiers plus two qualifiers)")
        def get(self, anchor_ai_code, anchor_ai, qualifier_1_code, qualifier_1, qualifier_2_code, qualifier_2):
            try:
                identifiers = f'/{anchor_ai_code}/{anchor_ai}'
                doc_id = f'{anchor_ai_code}_{anchor_ai}'
                print('GET', doc_id)
                # now get any query strings

                accept_language_list, context, linktype, media_types_list = _get_request_parameters()
                qualifier_path = f'/{qualifier_1_code}/{qualifier_1}/{qualifier_2_code}/{qualifier_2}'

                response_data = web_logic.read_document(identifiers,
                                                        doc_id,
                                                        qualifier_path,
                                                        linktype,
                                                        accept_language_list,
                                                        context,
                                                        media_types_list)

                response = Response(
                    response=json.dumps(response_data),  # Set response data
                    status=response_data['response_status'],  # Set status code
                    mimetype='application/json'  # Set MIME type
                )

                if response_data['response_status'] == 307:
                    response.headers['Location'] = response_data['data']['href']

                return response

            except Exception as e:
                logger.warning('Error getting document ' + str(e))
                abort(500, description="Error getting document")

    @data_entry_namespace.route(
        '/<anchor_ai_code>/<anchor_ai>/<qualifier_1_code>/<qualifier_1>/<qualifier_2_code>/<qualifier_2>/<qualifier_3_code>/<qualifier_3>')
    class DocOperationsIdentifiersAndThreeQualifiers(Resource):
        @api.doc(description="Get a document its anchor (GS1 identifiers plus three qualifiers)")
        def get(self, anchor_ai_code, anchor_ai, qualifier_1_code, qualifier_1, qualifier_2_code, qualifier_2,
                qualifier_3_code, qualifier_3):
            try:
                identifiers = f'/{anchor_ai_code}/{anchor_ai}'
                doc_id = f'{anchor_ai_code}/{anchor_ai}'
                print('GET', doc_id)
                # now get any query strings

                accept_language_list, context, linktype, media_types_list = _get_request_parameters()
                qualifier_path = f'/{qualifier_1_code}/{qualifier_1}/{qualifier_2_code}/{qualifier_2}/{qualifier_3_code}/{qualifier_3}'

                response_data = web_logic.read_document(identifiers,
                                                        doc_id,
                                                        qualifier_path,
                                                        linktype,
                                                        accept_language_list,
                                                        context,
                                                        media_types_list)

                response = Response(
                    response=json.dumps(response_data),  # Set response data
                    status=response_data['response_status'],  # Set status code
                    mimetype='application/json'  # Set MIME type
                )

                if response_data['response_status'] == 307:
                    response.headers['Location'] = response_data['data']['href']

                return response

            except Exception as e:
                logger.warning('Error getting document ' + str(e))
                abort(500, description="Error getting document")


# This function is used to extract the query strings from the request and return them as a list of parameters
# as well obtain the three contexts that are used in the web_logic.py file.
def _get_request_parameters():
    query_strings = request.args

    # do we have a 'linktype' query string?
    if 'linktype' in query_strings:
        linktype = query_strings['linktype']
    else:
        linktype = None

    # store the remaining query strings as a concatenated string to append
    # to the response when the time comes.
    response_query_string = ''
    for key in query_strings:
        response_query_string += f'{key}={query_strings[key]}&'
    # remove the last '&' from the string
    response_query_string = response_query_string[:-1]

    # is 'context' in the query string?
    if 'context' in query_strings:
        context = query_strings['context']
    else:
        context = None

    # do we have an 'accept-language' header?
    if 'Accept-Language' in request.headers:
        accept_language_list = request.headers['Accept-Language'].split(',')
    else:
        accept_language_list = ['und']  # default to undefined

    # do we have a 'accept' header that we can use to check required media types?
    media_types_list = []
    if 'Accept' in request.headers:
        media_types_list = request.headers['Accept'].split(',')
    else:
        media_types_list = None

    return accept_language_list, context, linktype, media_types_list
