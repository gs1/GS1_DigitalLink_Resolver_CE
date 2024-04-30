import json
import subprocess
import web_db


def _call_gs1_toolkit(ai_data_string):
    """
    This function calls the GS1 Digital Link Toolkit to validate the syntax of a GS1 Digital Link URL.
    :param ai_data_string:
    :return:
    """
    node_path = "/usr/bin/node"
    toolkit_path = "/app/gs1-digitallink-toolkit/calltoolkit.js"

    process = subprocess.Popen([node_path, toolkit_path, ai_data_string],
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE)

    stdout, stderr = process.communicate()

    if process.returncode != 0:
        print(f"_call_gs1_toolkit Error: {stderr.decode('utf-8')}")
        return False

    return True


def _test_gs1_digital_link_syntax(url):
    """
    This function tests the syntax of a GS1 Digital Link URL. It returns True if the URL is valid,
    and False if it is not.

    To do this we make a command line call to the GS1 Digital Link Validator at
    /app/gs1-digitallink-toolkit/calltoolkit.js and pass the URL as an ai data string parameter.
    For example /01/09521234543213/10/LOT/21/SERIAL becomes
    (01)09521234543213(10)LOT(21)SERIAL
    We then call the toolkit and return the true/false result.
    :param url:
    :return:
    """

    url_parts = url.split('/')

    # add the identifier
    ai_data_string = f"({url_parts[1]}){url_parts[2]}"

    # add the qualifiers (up to three - CPV, LOT and SERIAL for GTINs, or GLNX for GLNs)
    if len(url_parts) > 3:
        for i in range(3, len(url_parts), 2):
            ai_data_string += f"({url_parts[i]}){url_parts[i + 1]}"

    # call the toolkit
    return _call_gs1_toolkit(ai_data_string)


def _return_appropriate_linktype_doc(linktype_doc_list, accept_language_list, context, media_types_list):
    """
    This function returns the most appropriate linktype document from a list of linktype documents.
    It does this by checking if the linktype document matches the accept_language_list, context, and media_types_list.
    :param linktype_doc_list:
    :param accept_language_list:
    :param context:
    :param media_types_list:
    :return:
    """
    # First, can we find a match for all three of accept_language_list, context and media_type:
    # print("DEBUG Can we match on all three contexts?:", accept_language_list, context, media_types_list)
    for linktype_doc in linktype_doc_list:
        if 'hreflang' in linktype_doc:
            if any(value in accept_language_list for value in linktype_doc['hreflang']):
                if 'context' in linktype_doc:
                    if context in linktype_doc['context']:
                        if 'type' in linktype_doc:
                            if linktype_doc['type'] in media_types_list:
                                # print('DEBUG Found a match on all three contexts')
                                return linktype_doc

    # No? Then can we find a match for accept_language_list and context:
    # print("DEBUG Can we match on accept_language_list and context?:", accept_language_list, context)
    for linktype_doc in linktype_doc_list:
        if 'hreflang' in linktype_doc:
            if any(value in accept_language_list for value in linktype_doc['hreflang']):
                if 'context' in linktype_doc:
                    if context in linktype_doc['context']:
                        # print('DEBUG Found a match on accept_language_list and context')
                        return linktype_doc

    # Still no? Then can we find a match for accept_language_list and media_types_list:
    # print("DEBUG Can we match on accept_language_list and media_types_list?:", accept_language_list, media_types_list)
    for linktype_doc in linktype_doc_list:
        if 'hreflang' in linktype_doc:
            if any(value in accept_language_list for value in linktype_doc['hreflang']):
                if 'type' in linktype_doc:
                    if linktype_doc['type'] in media_types_list:
                        # print('DEBUG Found a match on accept_language_list and media_types_list')
                        return linktype_doc

    # Still no? Then can we find a match for context and media_types_list:
    # print("DEBUG Can we match on context and media_types_list?:", context, media_types_list)
    for linktype_doc in linktype_doc_list:
        if 'context' in linktype_doc:
            if context in linktype_doc['context']:
                if 'type' in linktype_doc:
                    if linktype_doc['type'] in media_types_list:
                        # print('DEBUG Found a match on context and media_types_list')
                        return linktype_doc

    # Still here? Then can we find a match for accept_language_list only:
    # print("DEBUG Can we match on accept_language_list only?:", accept_language_list)
    for linktype_doc in linktype_doc_list:
        if 'hreflang' in linktype_doc:
            if any(value in accept_language_list for value in linktype_doc['hreflang']):
                # print('DEBUG Found a match on accept_language_list')
                return linktype_doc

    # Still here? Then can we find a match for context only:
    # print("DEBUG Can we match on context only?:", context)
    for linktype_doc in linktype_doc_list:
        if 'context' in linktype_doc:
            if context in linktype_doc['context']:
                # print('DEBUG Found a match on context')
                return linktype_doc

    # Still here? Then can we find a match for media_types_list only:
    # print("DEBUG Can we match on media_types_list only?:", media_types_list)
    for linktype_doc in linktype_doc_list:
        if 'type' in linktype_doc:
            if linktype_doc['type'] in media_types_list:
                # print('DEBUG Found a match on media_types_list')
                return linktype_doc

    # Still here? Then can we find a match for no qualifiers:
    # print("DEBUG Can we match on no qualifiers?")
    for linktype_doc in linktype_doc_list:
        if 'hreflang' in linktype_doc:
            if linktype_doc['hreflang'] == 'und':
                # print('DEBUG Found a match on no qualifiers')
                return linktype_doc

    # We are out of reasonable options, return the first linktype_doc in the list:
    # print("DEBUG Returning the first linktype_doc in the list")
    return linktype_doc_list[0]


def _do_qualifiers_match(qualifier_path, doc_qualifiers):
    """
    Checks if there is a match between the qualifier path and the document qualifiers.
    If the document qualifiers include template variables, this function replaces them
    with their actual values from the qualifier path.

    qualifiers are lists in the document with up to three sets of AI codes and values:
          [{'aiCode1': 'aiValue1'}, {'aiCode2': 'value2'}, {'aiCode3': 'value3'}
     They may be in a different order, so we need to check for a match with the qualifier path

    :param qualifier_path: A qualifier path to be checked for a match.
    :param doc_qualifiers: Document qualifiers that may include template variables.

    :return: A tuple where the first value indicates if a match is found
             (True if a match found, False otherwise), and the second value is a
             list of dictionaries containing the template variables replaced with
             their matching actual values, if any. Returns False and None if no match found.
    """
    try:
        # Initialize the list to store template variables
        template_variable_list = []

        # Initialize the list to store qualifiers path
        qualifiers_path_list = []

        # Split the qualifier path into parts
        qualifier_path_parts = qualifier_path.split('/')

        # Iterate through qualifier path parts and construct the qualifiers path list
        for i in range(1, len(qualifier_path_parts), 2):
            qualifiers_path_list.append({qualifier_path_parts[i]: qualifier_path_parts[i + 1]})

        # Iterate through each doc qualifier
        for doc_qualifier in doc_qualifiers:
            # Process each key-value pair in the doc qualifier
            for key, value in doc_qualifier.items():
                # Check if the value is a template variable
                if value[0] == '{' and value[-1] == '}':
                    template_variable = value
                    # If the template variable is found in the qualifiers path list, replace it with the actual value
                    for qualifier_path_item in qualifiers_path_list:
                        if key in qualifier_path_item:
                            template_variable_list.append(
                                {
                                    'template_variable': template_variable,
                                    'value': qualifier_path_item[key]
                                })
                            doc_qualifier[key] = qualifier_path_item[key]

        # Check if qualifiers in the path list have a match in document qualifiers. If not, return False
        for qualifier_path_item in qualifiers_path_list:
            if qualifier_path_item not in doc_qualifiers:
                return False, None

        # If no issues encountered above, return True along with the template variable list
        return True, template_variable_list

    except KeyError as e:
        print(f"_do_qualifiers_match - KeyError occurred. Details: {str(e)}")
        return False, [f"KeyError occurred. Details: {str(e)}"]
    except TypeError as e:
        print(f"_do_qualifiers_match - TypeError occurred. Details: {str(e)}")
        return False, [f"TypeError occurred. Expected list or dictionary-like object. Details: {str(e)}"]
    except Exception as e:
        print(f"_do_qualifiers_match - Exception occurred. Details: {str(e)}")
        return False, [f"Unexpected error occurred. Details: {str(e)}"]


def _validate_and_fetch_document(identifiers, qualifier_path, doc_id):
    """
    Validates the syntax of the digital link and fetches the corresponding document for a given document ID.

    :param identifiers: The identifier portion of the digital link (e.g., '01/09550001563533')
    :param qualifier_path: The qualifier path of the digital link, if any (e.g., '/22/455')
    :param doc_id: The document ID to look up in the database.
    :return: A tuple where the first element is the result of the syntactic validation of the digital link,
             and the second element is the wanted_db_document from trying to read the document with the given doc_id from the database.
    """
    try:
        # Concatenate the identifiers and qualifier_path to form the complete digital link
        digital_link = identifiers + (qualifier_path if qualifier_path is not None else '')

        # Check if the digital link has valid syntax.
        dl_test_result = _test_gs1_digital_link_syntax(digital_link)

        # If the link syntax is invalid, return an error dictionary along with a `None` wanted_db_document.
        if not dl_test_result:
            return {"response_status": 400, "error": "Invalid Digital Link Syntax"}, None

        # If the link syntax is valid, attempt to fetch the corresponding document from the database.
        wanted_db_document = web_db.read_document(doc_id)

        return dl_test_result, wanted_db_document

    except ValueError as e:
        print(f"validate_and_fetch_document - ValueError occurred. Details: {str(e)}")
        return {"response_status": 400,
                "error": f"ValueError occurred. Possibly invalid identifiers or qualifier_path. Details: {str(e)}"}, None
    except TypeError as e:
        print(f"validate_and_fetch_document - TypeError occurred. Details: {str(e)}")
        return {"response_status": 400,
                "error": f"TypeError occurred. Expected string-like object. Details: {str(e)}"}, None
    except Exception as e:
        print(f"validate_and_fetch_document - Unexpected error occurred. Details: {str(e)}")
        return {"response_status": 500, "error": f"Unexpected error occurred. Details: {str(e)}"}, None


def _replace_linkset_template_variables(linkset, template_variables_list):
    """
    if template_variables_list is not empty, we need to replace the template variables in the linkset
    # with the actual values from the qualifier_path. Fortunately _do_qualifiers_match() has done the
    # hard work for us and we can now replace the template variables with the actual values.

    :param linkset: A dictionary that contains the linkset data.
    :param template_variables_list: A list of dictionaries that contain the template variables and their actual values.
    :return: The linkset dictionary with the template variables replaced with the actual values.
    """
    try:
        if len(template_variables_list) > 0:
            linkset_json = json.dumps(linkset)
            for template_variable in template_variables_list:
                linkset_json = linkset_json.replace(template_variable['template_variable'],
                                                    template_variable['value'])
            linkset = json.loads(linkset_json)
        return linkset

    except KeyError as e:
        return {"response_status": 400, "error": f"KeyError occurred - {str(e)}"}

    except TypeError as e:
        print(f"replace_linkset_template_variables - TypeError occurred. Details: {str(e)}")
        return {"response_status": 400,
                "error": f"TypeError occurred. Expected list or dictionary-like object - {str(e)}"}

    except json.JSONDecodeError as e:
        print(f"replace_linkset_template_variables - JSONDecodeError occurred. Details: {str(e)}")
        return {"response_status": 400, "error": f"JSONDecodeError occurred. Invalid JSON format - {str(e)}"}

    except Exception as e:
        print(f"replace_linkset_template_variables - Unexpected error occurred. Details: {str(e)}")
        return {"response_status": 500, "error": f"Unexpected error - {str(e)}"}


def handle_link_type(linktype, linkset, accept_language_list, context, media_types_list):
    """
    This function handles different types of links. It takes in the linktype,
    linkset dictionary, and other related arguments, and determines which
    part of the linkset dictionary to return based on the linktype.

    :param linktype: This can be 'all', 'linkset', none, or a specific type of link.
    :param linkset: A dictionary that contains the linkset data.
    :param accept_language_list: Argument passed to the function that might be used to determine the link type doc.
    :param context: Argument passed to the function that might be used to determine the link type doc.
    :param media_types_list: Argument passed to the function that might be used to determine the link type doc.
    :return: A dictionary with `response_status` and either the linkset `data` or an `error` message.
    """
    try:
        if linktype == 'all' or linktype == 'linkset':
            return {"response_status": 200, "data": linkset}

        full_linktype = 'https://gs1.org/voc/defaultLink' if linktype is None else f'https://gs1.org/voc/{linktype}'

        if full_linktype in linkset:
            linktype_doc_list = linkset[full_linktype]

            if isinstance(linktype_doc_list, list):
                wanted_linktype_doc = _return_appropriate_linktype_doc(linktype_doc_list, accept_language_list,
                                                                       context, media_types_list)
            else:
                wanted_linktype_doc = linktype_doc_list

            if wanted_linktype_doc is not None:
                return {"response_status": 307, "data": wanted_linktype_doc}
            else:
                return {"response_status": 404, "error": f"No linkset found for linktype: {full_linktype}"}
        return {"response_status": 404, "error": f"No linkset found for linktype: {linktype}"}

    except KeyError as e:
        print(f"handle_link_type - KeyError occurred. Details: {str(e)}")
        return {"response_status": 400, "error": f"KeyError occurred. Details: {str(e)}"}

    except TypeError as e:
        print(f"handle_link_type - TypeError occurred. Details: {str(e)}")
        return {"response_status": 400,
                "error": f"TypeError occurred. Expected list or dictionary-like object. Details: {str(e)}"}

    except Exception as e:
        print(f"handle_link_type - Unexpected error occurred. Details: {str(e)}")
        return {"response_status": 500, "error": f"Unexpected error occurred. Details: {str(e)}"}


def read_document(identifiers, doc_id, qualifier_path='/', linktype=None, accept_language_list=None, context=None,
                  media_types_list=None):
    """
    Reads a document from the data source and returns the most appropriate link data.

    :param identifiers: Identifier portion of the digital link.
    :param doc_id: Unique document ID used to fetch the document from the database.
    :param qualifier_path: Qualifier path portion of the digital link. Defaults to "/".
    :param linktype: Type of link in linktype document.
    :param accept_language_list: List of acceptable languages which influences the selection of the linktype document.
    :param context: Context information passed in from the caller.
    :param media_types_list: List of acceptable media links which influences the selection of the linktype document.
    :return: A response dictionary which includes the response status and either the link data or error message.
    """
    try:
        # Validate the digital link and fetch the associated document.
        dl_test_result, response = _validate_and_fetch_document(identifiers, qualifier_path, doc_id)

        # If the digital link syntax is invalid, or a database erros / document not found occurs
        # then return the error response.
        if not dl_test_result or response['response_status'] != 200:
            return response

        # If the response is successful, proceed with processing.
        if response and response['response_status'] == 200:
            database_doc = response['data']

            # If qualifier_path is NoneType or '/', we look for an instance in the document
            # where there are no qualifiers.
            if qualifier_path is None or qualifier_path == '/':
                for data in database_doc['data']:
                    if len(data['qualifiers']) == 0:
                        linkset = data['linkset'][0]
                        response = handle_link_type(linktype, linkset, accept_language_list, context, media_types_list)

                        # If a valid response is prepared return it.
                        return response

            # If we are here then there are qualifiers to process.
            # Iterate through each data item in the document.
            for data in database_doc['data']:
                # Iterate through each data item in the document and check if any qualifiers
                # in the data item match the qualifier path.
                yes_qualifiers_match, template_variables_list = _do_qualifiers_match(qualifier_path, data['qualifiers'])

                # If qualifiers match, replace template variables and process the linkset.
                if yes_qualifiers_match:
                    linkset = data['linkset'][0]
                    if len(template_variables_list) > 0:
                        linkset = _replace_linkset_template_variables(linkset, template_variables_list)

                    # Use handle_link_type to either return the appropriate linktype document
                    # or proceed to the next data item.
                    response = handle_link_type(linktype, linkset, accept_language_list, context, media_types_list)

                    # If a valid response is prepared return it.
                    if response:
                        return response

            # If a necessary linkset was not found, return an error.
            return {"response_status": 404, "error": f"No linkset found for linktype: {linktype}"}

    except Exception as e:
        # Log the exception and return a server error response.
        print('read_document: Internal Server Error - ', str(e))
        return {"response_status": 500, "error": "Internal Server Error: " + str(e)}