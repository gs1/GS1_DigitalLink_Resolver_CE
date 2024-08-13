from flask import request, jsonify, abort, Response
import json
from flask_restx import Namespace, Resource, Api, fields
import logging
import web_logic
from werkzeug.exceptions import UnsupportedMediaType
import subprocess

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


@data_entry_namespace.route('/<compressed_link>')
class DocOperationsCompressedLink(Resource):
    @api.doc(description="Get a document from the incoming URL (compressed GS1 DL only)")
    def get(self, compressed_link):
        try:
            print('COMPRESSED LINK: ', compressed_link)
            decompress_result = web_logic.uncompress_gs1_digital_link(compressed_link)
            print('DEBUG ==> decompress_result: ', decompress_result)
            if decompress_result['SUCCESS']:
                # Example of decompress_result:
                # {
                #   "identifiers": [{"01": "05392000229648"}],
                #   "qualifiers": [{"10": "LOT01"}, {"21": "SER1234"}],
                #   "dataAttributes": [],
                #   "other": [{"expirydate": "20240724"}],
                # }
                anchor_ai_code = list(decompress_result['identifiers'][0].keys())[0]
                anchor_ai = list(decompress_result['identifiers'][0].values())[0]
                identifiers = f'/{anchor_ai_code}/{anchor_ai}'
                doc_id = f'{anchor_ai_code}_{anchor_ai}'
                qualifiers = ['{0}/{1}'.format(list(d.keys())[0], list(d.values())[0]) for d in decompress_result['qualifiers']]
                qualifier_path = '/' + '/'.join(qualifiers) if qualifiers else None

                print('UNCOMPRESSED LINK: ', doc_id + qualifier_path)

                return _process_response(doc_id, identifiers, qualifier_path or None)

            else:
                return {'error': decompress_result['error']}, 400

        except Exception as e:
            logger.warning('Error getting document ' + str(e))
            abort(500, description="Error getting document")


@data_entry_namespace.route('/<anchor_ai_code>/<anchor_ai>')
class DocOperationsIdentifiersOnly(Resource):
    @api.doc(description="Get a document from the incoming URL (GS1 identifiers only)")
    def get(self, anchor_ai_code, anchor_ai):
        try:
            anchor_ai = _confirm_gtin_14(anchor_ai, anchor_ai_code)
            identifiers = f'/{anchor_ai_code}/{anchor_ai}'
            doc_id = f'{anchor_ai_code}_{anchor_ai}'
            print('GS1 identifiers only: ', identifiers)

            compress = request.args.get('compress', None)
            return _process_response(doc_id, identifiers, compress=compress)

        except Exception as e:
                logger.warning('Error getting document ' + str(e))
                abort(500, description="Error getting document")


@data_entry_namespace.route('/<anchor_ai_code>/<anchor_ai>/<qualifier_1_code>/<qualifier_1>')
class DocOperationsIdentifiersAndOneQualifier(Resource):
    @api.doc(description="Get a document from the incoming URL (GS1 identifiers plus one qualifier)")
    def get(self, anchor_ai_code, anchor_ai, qualifier_1_code, qualifier_1):
        try:

            anchor_ai = _confirm_gtin_14(anchor_ai, anchor_ai_code)
            identifiers = f'/{anchor_ai_code}/{anchor_ai}'
            doc_id = f'{anchor_ai_code}_{anchor_ai}'
            qualifier_path = f'/{qualifier_1_code}/{qualifier_1}'
            print('GS1 identifiers plus one qualifier: ', identifiers + qualifier_path)

            compress = request.args.get('compress', None)
            return _process_response(doc_id, identifiers, qualifier_path=qualifier_path, compress=compress)


        except Exception as e:
                logger.warning('Error getting document ' + str(e))
                abort(500, description="Error getting document")


@data_entry_namespace.route(
    '/<anchor_ai_code>/<anchor_ai>/<qualifier_1_code>/<qualifier_1>/<qualifier_2_code>/<qualifier_2>')
class DocOperationsIdentifiersAndTwoQualifiers(Resource):
    @api.doc(description="Get a document from the incoming URL (GS1 identifiers plus two qualifiers)")
    def get(self, anchor_ai_code, anchor_ai, qualifier_1_code, qualifier_1, qualifier_2_code, qualifier_2):
        try:
            anchor_ai = _confirm_gtin_14(anchor_ai, anchor_ai_code)
            identifiers = f'/{anchor_ai_code}/{anchor_ai}'
            doc_id = f'{anchor_ai_code}_{anchor_ai}'
            qualifier_path = f'/{qualifier_1_code}/{qualifier_1}/{qualifier_2_code}/{qualifier_2}'
            print('GS1 identifiers plus two qualifiers: ', identifiers + qualifier_path)

            compress = request.args.get('compress', None)
            return _process_response(doc_id, identifiers, qualifier_path=qualifier_path, compress=compress)

        except Exception as e:
            logger.warning('Error getting document ' + str(e))
            abort(500, description="Error getting document")


@data_entry_namespace.route(
    '/<anchor_ai_code>/<anchor_ai>/<qualifier_1_code>/<qualifier_1>/<qualifier_2_code>/<qualifier_2>/<qualifier_3_code>/<qualifier_3>')
class DocOperationsIdentifiersAndThreeQualifiers(Resource):
    @api.doc(description="Get a document from the incoming URL (GS1 identifiers plus three qualifiers)")
    def get(self, anchor_ai_code, anchor_ai, qualifier_1_code, qualifier_1, qualifier_2_code, qualifier_2,
            qualifier_3_code, qualifier_3):
        try:
            anchor_ai = _confirm_gtin_14(anchor_ai, anchor_ai_code)
            identifiers = f'/{anchor_ai_code}/{anchor_ai}'
            doc_id = f'{anchor_ai_code}/{anchor_ai}'
            qualifier_path = f'/{qualifier_1_code}/{qualifier_1}/{qualifier_2_code}/{qualifier_2}/{qualifier_3_code}/{qualifier_3}'
            print('GS1 identifiers plus three qualifiers: ', identifiers + qualifier_path)

            compress = request.args.get('compress', None)
            return _process_response(doc_id, identifiers, qualifier_path=qualifier_path, compress=compress)

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


def _confirm_gtin_14(anchor_ai, anchor_ai_code):
    # if the anchor_ai_code is '01' and the length of the anchor_ai is 13, add a leading zero
    # to cope with GRIN-13 entries
    if anchor_ai_code == '01' and len(anchor_ai) == 13:
        anchor_ai = '0' + anchor_ai
    return anchor_ai


def _process_response(doc_id, identifiers, qualifier_path=None, compress=None):
    accept_language_list, context, linktype, media_types_list, linkset_requested = _get_request_parameters()

    # if compress is present and set to true, we return the compressed version of a
    # compressed GS1 Digital Link
    if compress:
        uncompressed_link = identifiers
        if qualifier_path:
            uncompressed_link += qualifier_path
        print(f'Compressing link {uncompressed_link}...')
        response_data = web_logic.get_compressed_link(uncompressed_link)
        return response_data, 200

    # ... otherwise we search for and process the requested document as normal:
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
