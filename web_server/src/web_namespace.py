import json
import logging
import os

from flask import request, abort, Response, send_from_directory, jsonify, make_response
from flask_restx import Namespace, Resource, Api

import web_logic

web_namespace = Namespace('', description='Resolver web operations')
static_folder_path = os.path.join(os.getcwd(), 'public')

logger = logging.getLogger(__name__)

api = Api()


@web_namespace.route('/favicon.ico')
class Favicon(Resource):
    def get(self):
        """
        Serve the favicon.ico file.
        """
        return send_from_directory(static_folder_path, 'favicon.ico')

    def options(self):
        """
        Handle unsupported HTTP methods gracefully for /favicon.ico.
        """
        return {'error': 'Method not allowed'}, 405


@web_namespace.route('/robots.txt')
class RobotsTxt(Resource):
    def get(self):
        """
        Serve the robots.txt file.
        """
        return send_from_directory(static_folder_path, 'robots.txt')

    def options(self):
        """
        Handle unsupported HTTP methods gracefully for /robots.txt.
        """
        return {'error': 'Method not allowed'}, 405


@web_namespace.route('/heartbeat')
class Heartbeat(Resource):
    def get(self):
        """
        Return a simple heartbeat response to indicate the application is running.
        """
        return jsonify({'response_message': 'Server is running!'}), 200

    def head(self):
        """
        Handle HEAD requests for /heartbeat. Return headers without a body.
        """
        response = make_response('', 200)  # Empty body with status code 200
        return response

    def options(self):
        """
        Handle unsupported HTTP methods gracefully for /heartbeat.
        """
        return {'error': 'Method not allowed'}, 405

@web_namespace.route('/<non_gs1dl_request>')
class DocOperationsNonGS1DigitalLinkRequest(Resource):
    @api.doc(description="Process non GS1 Digital Link requests (which can include compressed GS1 DLs)")
    def get(self, non_gs1dl_request):
        response = self._handle_request(non_gs1dl_request)
        return response

    def head(self, non_gs1dl_request):
        response_tuple = self._handle_request(non_gs1dl_request)

        # If the response from GET is a tuple, unpack it
        if isinstance(response_tuple, tuple):
            response_data, status_code = response_tuple
            response = make_response(response_data, status_code)
        else:
            response = make_response(response_tuple)
        return response

    def options(self, non_gs1dl_request=None):
        """
        Handle HTTP OPTIONS requests. Returns allowed methods
        """
        # Constructs a response indicating available methods
        response = Response()
        response.headers['Allow'] = 'GET, HEAD, OPTIONS'
        return response

    def _handle_request(self, non_gs1dl_request):
        # Existing processing logic as outlined previously
        try:
            print('NON GS1DL REQUEST: ', non_gs1dl_request)
            decompress_result = web_logic.uncompress_gs1_digital_link(non_gs1dl_request)
            print('DEBUG ==> decompress_result: ', decompress_result)
            if decompress_result['SUCCESS']:
                # Process decompressed result
                anchor_ai_code = list(decompress_result['identifiers'][0].keys())[0]
                anchor_ai = list(decompress_result['identifiers'][0].values())[0]
                identifiers = f'/{anchor_ai_code}/{anchor_ai}'
                doc_id = f'{anchor_ai_code}_{anchor_ai}'
                qualifiers = ['{0}/{1}'.format(list(d.keys())[0], list(d.values())[0]) for d in decompress_result['qualifiers']]
                qualifier_path = '/' + '/'.join(qualifiers) if qualifiers else None
                return _process_response(doc_id, identifiers, qualifier_path or None)
            else:
                return jsonify({'error': decompress_result['error']}), 400

        except Exception as e:
            logger.warning('Error getting document ' + str(e))
            abort(500, description="Error getting document")


@web_namespace.route('/<anchor_ai_code>/<anchor_ai>')
class DocOperationsIdentifiersOnly(Resource):
    @api.doc(description="Get a document from the incoming URL (GS1 identifiers only)")
    def get(self, anchor_ai_code, anchor_ai):
        try:
            # Ensure that a Resolver Description File is returned
            if anchor_ai_code == '.well-known' and anchor_ai == 'gs1resolver':
                return send_from_directory(static_folder_path, 'gs1resolver.json')

            anchor_ai = _confirm_gtin_14(anchor_ai, anchor_ai_code)
            identifiers = f'/{anchor_ai_code}/{anchor_ai}'
            doc_id = f'{anchor_ai_code}_{anchor_ai}'
            print('GS1 identifiers only: ', identifiers)

            # Extract all query strings into a URL-compatible string
            query_strings = _extract_query_strings(request)

            compress = request.args.get('compress', None)
            return _process_response(doc_id, identifiers, compress=compress, query_strings=query_strings)

        except Exception as e:
            logger.warning('Error getting document ' + str(e))
            abort(500, description="Error getting document")

    def head(self, anchor_ai_code, anchor_ai):
        # Reuse the get logic to construct a proper Response object
        response_tuple = self.get(anchor_ai_code, anchor_ai)

        # If the response from GET is a tuple, unpack it
        if isinstance(response_tuple, tuple):
            response_data, status_code = response_tuple
            response = make_response(response_data, status_code)
        else:
            response = make_response(response_tuple)

        # Clear the body for the HEAD request
        response.data = ''
        return response

    def options(self, anchor_ai_code=None, anchor_ai=None):
        # Response with allowed methods
        response = Response()
        response.headers['Allow'] = 'GET, HEAD, OPTIONS'
        return response


@web_namespace.route('/<anchor_ai_code>/<anchor_ai>/<path:extra_segments>')
class DocOperationsResource(Resource):
    def get(self, anchor_ai_code, anchor_ai, extra_segments=None):
        try:
            # Process the extra segments
            # This will include everything after the anchor_ai, such as 'foo', qualifiers, etc.
            print("Extra segments:", extra_segments)

            anchor_ai = _confirm_gtin_14(anchor_ai, anchor_ai_code)
            identifiers = f'/{anchor_ai_code}/{anchor_ai}'
            doc_id = f'{anchor_ai_code}_{anchor_ai}'

            if extra_segments:
                qualifier_path = f'/{extra_segments}'
            else:
                qualifier_path = ''

            print('Processed identifiers and qualifiers:', identifiers + qualifier_path)

            # Extract all query strings into a URL-compatible string
            query_strings = _extract_query_strings(request)

            compress = request.args.get('compress', None)
            return _process_response(doc_id, identifiers, qualifier_path=qualifier_path, compress=compress, query_strings=query_strings)

        except Exception as e:
            logger.warning('Error getting document: ' + str(e))
            abort(500, description="Error getting document")

    def head(self, anchor_ai_code, anchor_ai, extra_segments=None):
        response_tuple = self.get(anchor_ai_code, anchor_ai, extra_segments)
        if isinstance(response_tuple, tuple):
            response_data, status_code = response_tuple
            response = make_response(response_data, status_code)
        else:
            response = make_response(response_tuple)

        response.data = ''
        return response

    def options(self, anchor_ai_code=None, anchor_ai=None, extra_segments=None):
        response = Response()
        response.headers['Allow'] = 'GET, HEAD, OPTIONS'
        return response


# This function is used to extract the query strings from the request and return them as a list of parameters
# as well obtain the three contexts that are used in the web_logic.py file. Note that the decision to
# return a linkset rather than attempt a 307 redirect is made here by setting the linkset_requested variable
# should the 'Accept' header contain 'application/linkset+json' or 'application/json'
def _get_request_parameters():
    query_strings = request.args

    # do we have a 'linktype' query string? Bear in mind it might be in mixed case such as 'linkType'
    # so we will need to parse the list looking for a match where we compare lowercase values
    linktype = next((value for key, value in query_strings.items() if key.lower() == 'linktype'), None)

    # is 'context' in the query string? Do the same as for linkype to avoid case mismatch.
    context = next((value for key, value in query_strings.items() if key.lower() == 'context'), None)

    # construct the response_query_string
    response_query_string = '&'.join(f'{key}={value}' for key, value in query_strings.items())

    # do we have an 'accept-language' header?
    accept_language_list = request.headers.get('Accept-Language', 'und').split(',')

    # do we have an 'accept' header?
    if request.headers.get('Accept'):
        media_types_list = request.headers['Accept'].split(',')
        linkset_requested = 'application/linkset+json' in media_types_list or 'application/json' in media_types_list or linktype == 'all' or linktype == 'linkset'
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


def _extract_query_strings(request):
    # Extract all query strings into a URL-compatible string
    query_strings = ''
    for key, value in request.args.items():
        query_strings += f"{key}={value}&"
    # Remove the trailing '&' character
    query_strings = query_strings[:-1]
    return query_strings


def _process_response(doc_id, identifiers, qualifier_path=None, compress=None, query_strings=''):
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
    response_data, link_header = web_logic.read_document(identifiers,
                                            doc_id,
                                            qualifier_path,
                                            linktype,
                                            accept_language_list,
                                            context,
                                            media_types_list,
                                            linkset_requested)


    # if the response status is 400 or greater, we need to return the response_data and the response status
    if response_data['response_status'] >= 400:
        return response_data, response_data['response_status']


    # The final link header entry should be to the JSON-LD context source as requested by the GS1 Resolver
    # Standard document. This is a mandatory requirement.
    link_header += ',<http://www.w3.org/ns/json-ld#context;type=application/ld+json>; rel=http://www.w3.org/ns/json-ld#context; type="text/html"'

    # if the linkset is requested, we need to format thw response to include json-ld
    # and add our document to a 'linkset' property.
    if linkset_requested:
        # We need to include JSON-LD to add context to the response
        response_linkset = web_logic.format_linkset_for_external_use(response_data, identifiers)

        response = Response(
            response=json.dumps(response_linkset),  # Set response data
            status=response_data['response_status'],  # Set status code
        )

    else: # linkset was not requested
        response = Response(
            response=json.dumps(response_data),  # Set response data
            status=response_data['response_status'],  # Set status code
        )



    # add the link header, ensuring will survive over an HTTP 1.0 or 1.1 which allows latin-1 characters only.
    if link_header is not None:
        try:
            response.headers['Link'] = link_header.encode('latin-1').decode('ascii')
        except UnicodeEncodeError:
            response.headers['Link'] = link_header.encode('unicode_escape').decode('ascii')

    # if the accept header is application/json or application/linkset+json, return the response header
    # 'Content-Type with the SAME value as the request 'Accept' header,
    print('Accept header:', request.headers['Accept'])
    if 'application/json' in request.headers['Accept'] or 'application/linkset+json' in request.headers['Accept']:
        response.headers['Content-Type'] = request.headers['Accept']
        return response


    # If response_data['status'] is 307, we need to return a redirect response
    if response_data['response_status'] == 307:
        response.headers['Location'] = response_data['data']['href']
        # if we have any query_strings then we need to append them to response.headers['Location']:
        if query_strings:
            response.headers['Location'] += '?' + query_strings

        return response

    elif response_data['response_status'] == 300:
        return {'linkset': response_data['data']}, 300

    return response
