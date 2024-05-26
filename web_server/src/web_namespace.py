from flask import request, jsonify, abort, Response
import json
from flask_restx import Namespace, Resource, Api, fields
import logging
import web_logic
from werkzeug.exceptions import UnsupportedMediaType

data_entry_namespace = Namespace('', description='Resolver web operations')

logger = logging.getLogger(__name__)

api = Api()


# This route serves anything from the root of the server which is stored in src/public
@api.route('/')
class Home(Resource):
    @api.doc(description="Serve the home page")
    def get(self):
        return api.send_static_file('index.html')


@api.route('/<path:path>')
class StaticFiles(Resource):
    @api.doc(description="Serve static files")
    def get(self, path):
        return api.send_static_file(path)


@api.route('/favicon.ico')
class Favicon(Resource):
    @api.doc(description="Serve the favicon")
    def get(self):
        return api.send_static_file('favicon.ico')


@api.route('/robots.txt')
class Robots(Resource):
    @api.doc(description="Serve the robots.txt")
    def get(self):
        return api.send_static_file('robots.txt')


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

            return _process_response(doc_id, identifiers)

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

                qualifier_path = f'/{qualifier_1_code}/{qualifier_1}'

                return _process_response(doc_id, identifiers, qualifier_path)

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
                qualifier_path = f'/{qualifier_1_code}/{qualifier_1}/{qualifier_2_code}/{qualifier_2}'

                return _process_response(doc_id, identifiers, qualifier_path)

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

                qualifier_path = f'/{qualifier_1_code}/{qualifier_1}/{qualifier_2_code}/{qualifier_2}/{qualifier_3_code}/{qualifier_3}'

                return _process_response(doc_id, identifiers, qualifier_path)

            except Exception as e:
                logger.warning('Error getting document ' + str(e))
                abort(500, description="Error getting document")


# This function is used to extract the query strings from the request and return them as a list of parameters
# as well obtain the three contexts that are used in the web_logic.py file. Note that the decision to
# return a linkset rather than attempt a 307 redirect is made here by setting the linkset_requested variable
# should the 'Accept' header contain 'application/linkset+json' or 'application/json'
def _get_request_parameters():
    query_strings = request.args

    # do we have a 'linktype' query string?
    linktype = query_strings.get('linktype', None)

    # is 'context' in the query string?
    context = query_strings.get('context', None)

    # construct the response_query_string
    response_query_string = '&'.join(f'{key}={value}' for key, value in query_strings.items())

    # do we have an 'accept-language' header?
    accept_language_list = request.headers.get('Accept-Language', 'und').split(',')

    # do we have an 'accept' header?
    if request.headers.get('Accept'):
        media_types_list = request.headers['Accept'].split(',')
        linkset_requested = 'application/linkset+json' in media_types_list or 'application/json' in media_types_list
    else:
        media_types_list = None
        linkset_requested = False

    return accept_language_list, context, linktype, media_types_list, linkset_requested


def _process_response(doc_id, identifiers, qualifier_path=None):
    accept_language_list, context, linktype, media_types_list, linkset_requested = _get_request_parameters()
    response_data = web_logic.read_document(identifiers,
                                            doc_id,
                                            qualifier_path,
                                            linktype,
                                            accept_language_list,
                                            context,
                                            media_types_list,
                                            linkset_requested)

    response = Response(
        response=json.dumps(response_data),  # Set response data
        status=response_data['response_status'],  # Set status code
    )
    # if the accept header is application/json or application/linkset+json, return the response header
    # 'Content-Type with the SAME value as the request 'Accept' header,
    print('Accept header:', request.headers['Accept'])
    if 'application/json' in request.headers['Accept'] or 'application/linkset+json' in request.headers['Accept']:
        response.headers['Content-Type'] = request.headers['Accept']
        return response

    # If response_data['status'] is 307, we need to return a redirect response
    if response_data['response_status'] == 307:
        response.headers['Location'] = response_data['data']['href']
        return response

    elif response_data['response_status'] == 300:
        return {'linkset': response_data['data']}, 300

    return response
