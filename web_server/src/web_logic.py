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


def _match_all_three_contexts(linktype_doc_list, accept_language_list, context, media_types_list):
    wanted_doc_list = []
    print('DEBUG Can we match on all three contexts?:', accept_language_list, context, media_types_list)
    for linktype_doc in linktype_doc_list:
        if 'hreflang' in linktype_doc and \
                'context' in linktype_doc and \
                'type' in linktype_doc and \
                any(value in linktype_doc['hreflang'] for value in accept_language_list) and \
                context in linktype_doc['context'] and \
                linktype_doc['type'] in media_types_list:
            print('DEBUG Found a match on all three contexts')
            wanted_doc_list.append(linktype_doc)

    # If list is not empty, return it. Otherwise, return None
    return wanted_doc_list if wanted_doc_list else None


def _match_accept_language_and_context(linktype_doc_list, accept_language_list, context):
    wanted_doc_list = []
    print('DEBUG Can we match on accept_language_list and context?:', accept_language_list, context)
    for linktype_doc in linktype_doc_list:
        if 'hreflang' in linktype_doc and \
                'context' in linktype_doc and \
                any(value in linktype_doc['hreflang'] for value in accept_language_list) and \
                context in linktype_doc['context']:
            print('DEBUG Found a match on accept_language_list and context')
            wanted_doc_list.append(linktype_doc)

    # If list is not empty, return it. Otherwise, return None
    return wanted_doc_list if wanted_doc_list else None


def _match_accept_language_and_media_types(linktype_doc_list, accept_language_list, media_types_list):
    wanted_doc_list = []
    print('DEBUG Can we match on accept_language_list and media_types_list?:', accept_language_list, media_types_list)
    for linktype_doc in linktype_doc_list:
        if 'hreflang' in linktype_doc and \
                'type' in linktype_doc and \
                any(value in linktype_doc['hreflang'] for value in accept_language_list) and \
                linktype_doc['type'] in media_types_list:
            print('DEBUG Found a match on accept_language_list and media_types_list')
            wanted_doc_list.append(linktype_doc)

    # If list is not empty, return it. Otherwise, return None
    return wanted_doc_list if wanted_doc_list else None


def _match_context_and_media_types(linktype_doc_list, context, media_types_list):
    wanted_doc_list = []
    print('DEBUG Can we match on context and media_types_list?:', context, media_types_list)
    for linktype_doc in linktype_doc_list:
        if 'context' in linktype_doc and \
                'type' in linktype_doc and \
                context in linktype_doc['context'] and \
                (linktype_doc['type'] in media_types_list or 'und' in linktype_doc['type']):
            print('DEBUG Found a match on context and media_types_list')
            wanted_doc_list.append(linktype_doc)

    # If list is not empty, return it. Otherwise, return None
    return wanted_doc_list if wanted_doc_list else None


def _match_accept_language(linktype_doc_list, accept_language_list):
    wanted_doc_list = []
    print('DEBUG Can we match on accept_language_list?:', accept_language_list)
    for linktype_doc in linktype_doc_list:
        if 'hreflang' in linktype_doc and \
                any(value in linktype_doc['hreflang'] for value in accept_language_list):
            print('DEBUG Found a match on accept_language_list')
            wanted_doc_list.append(linktype_doc)

    # If list is not empty, return it. Otherwise, return None
    return wanted_doc_list if wanted_doc_list else None


def _match_context(linktype_doc_list, context):
    wanted_doc_list = []
    print('DEBUG Can we match on context?:', context)
    for linktype_doc in linktype_doc_list:
        if 'context' in linktype_doc and \
                context in linktype_doc['context']:
            print('DEBUG Found a match on context')
            wanted_doc_list.append(linktype_doc)

    # If list is not empty, return it. Otherwise, return None
    return wanted_doc_list if wanted_doc_list else None


def _match_media_type(linktype_doc_list, media_types_list):
    wanted_doc_list = []
    print('DEBUG Can we match on media_types_list?:', media_types_list)
    for linktype_doc in linktype_doc_list:
        if 'type' in linktype_doc and \
                (linktype_doc['type'] in media_types_list or 'und' in linktype_doc['type']):
            print('DEBUG Found a match on media_types_list')
            wanted_doc_list.append(linktype_doc)

    # If list is not empty, return it. Otherwise, return None
    return wanted_doc_list if wanted_doc_list else None


def _match_und_hreflang(linktype_doc_list):
    wanted_doc_list = []
    for linktype_doc in linktype_doc_list:
        if 'hreflang' in linktype_doc and 'und' in linktype_doc['hreflang']:
            print('DEBUG Found a "und" match in linktype_doc[hreflang]')
            wanted_doc_list.append(linktype_doc)
    if wanted_doc_list:
        return wanted_doc_list


def _match_und_media_type(linktype_doc_list):
    wanted_doc_list = []
    for linktype_doc in linktype_doc_list:
        if 'type' in linktype_doc and 'und' in linktype_doc['type']:
            print('DEBUG Found a "und" match in linktype_doc[type]')
            wanted_doc_list.append(linktype_doc)
    if wanted_doc_list:
        return wanted_doc_list


def _get_appropriate_linktype_docs_list(linktype_doc_list, accept_language_list, context, media_types_list):
    """
    This function returns the most appropriate linktype document from a list of linktype documents.
    It does this by checking if the linktype document matches the accept_language_list, context, and media_types_list.
    :param linktype_doc_list:
    :param accept_language_list:
    :param context:
    :param media_types_list:
    :return wanted_doc_list:
    """
    if match := _match_all_three_contexts(linktype_doc_list, accept_language_list, context, media_types_list):
        return match
    elif match := _match_accept_language_and_context(linktype_doc_list, accept_language_list, context):
        return match
    elif match := _match_accept_language_and_media_types(linktype_doc_list, accept_language_list, media_types_list):
        return match
    elif match := _match_context_and_media_types(linktype_doc_list, context, media_types_list):
        return match
    elif match := _match_accept_language(linktype_doc_list, accept_language_list):
        return match
    elif match := _match_context(linktype_doc_list, context):
        return match
    elif match := _match_media_type(linktype_doc_list, media_types_list):
        return match
    elif match := _match_und_hreflang(linktype_doc_list):
        return match
    elif match := _match_und_media_type(linktype_doc_list):
        return match
    # We are out of reasonable options, return the first linktype_doc in the list:
    print('DEBUG Returning the first linktype_doc in the list')
    return linktype_doc_list


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
        # Importantly, we return true if ANY qualifier in the path list is in the document qualifiers.
        # In resolver 1.x and 2.x, ALL qualifiers in the path list must be in the document qualifiers.
        no_qualifiers_match = True
        for qualifier_path_item in qualifiers_path_list:
            if qualifier_path_item in doc_qualifiers:
                no_qualifiers_match = False
                break

        if no_qualifiers_match:
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


def _process_serialised_identifier(identifier):
    """
    Processes the serialised component of the identifier and returns the wanted_db_document. It works by
    removing more and more of the serialised component until either:
        1) a match is found AND the linkset documents has {0} or {1} template variables present, OR
        2) The identifier, including '/<ai-code>/', is reduced to 12 characters.

    If a match is found, it will return the wanted_db_document with the serialised component processed.
    If no match is found, it will return None.

    :param identifier: The identifier portion of the digital link .e.g. '/8004/0950600013430000001'
    :return: The wanted_db_document with the serialised component processed, or None if no match found.
    """
    for i in range(len(identifier) - 1, 11, -1):
        wanted_db_document = web_db.read_document(identifier[:i])
        if wanted_db_document['response_status'] == 200:
            # Partial matches MUST have a template variable in the href property. If not, we reject the match.
            # We have found a partial match, but we need to check for the presence of
            # special template variable:
            #    {0} in the href property (which means we redirect using the full identifier)
            #    {1} which means we redirect using the partial identifier.
            #  We can either traverse the linkset object or we can just convert the entire object to a string
            #  and search for the template variable. We will do the latter unless we find it slower!
            wanted_json = json.dumps(wanted_db_document['data'])

            if '{0}' not in wanted_json and '{1}' not in wanted_json:
                # No template variables found in the linkset - this is not a partial match because we cannot
                # substitute the template variable part of the href redirect with a template variable.
                continue

            # we need to extract the value part of the identifier after the second '/'
            ai_value = identifier[:i].split('/')[2]
            # remove the partial match from the full incoming identifier to get the remainder of the value.
            # For example if ai_value (matched with the DB entry because it responded with '200') is
            # '095060001343' and the incoming identifier is '/8004/095060001343999999'
            # then ai_partial_value is '999999'.
            ai_partial_value = identifier.split('/')[2].replace(ai_value, '')

            # Now we need to replace the template variables {0} and {1} with the actual values
            while '{0}' in wanted_json:
                wanted_json = wanted_json.replace('{0}', ai_value)
            while '{1}' in wanted_json:
                wanted_json = wanted_json.replace('{1}', ai_partial_value)

            # convert the json string back to a dictionary
            wanted_db_document['data'] = json.loads(wanted_json)
            return wanted_db_document

    return None


def _validate_and_fetch_document(identifier, qualifier_path, doc_id):
    """
    searches for a partial identifier match and returns the wanted_db_document if found.
    If not found, it will return the same wanted_db_document as before.

    :param identifier: The identifier portion of the digital link (e.g., '01/09550001563533')
    :param qualifier_path: The qualifier path of the digital link, if any (e.g., '/22/455') only used to validate syntax
    :param doc_id: The document ID to look up in the database.
    :return: A tuple where the first element is the result of the syntactic validation of the digital link,
             and the second element is the wanted_db_document from trying to read the document with the given doc_id
             from the database.
    """
    try:
        # Concatenate the identifiers and qualifier_path to form the complete digital link
        digital_link = identifier + (qualifier_path if qualifier_path is not None else '')

        # Check if the digital link has valid syntax.
        dl_test_result = _test_gs1_digital_link_syntax(digital_link)

        # If the link syntax is invalid, return an error dictionary along with a `None` wanted_db_document.
        if not dl_test_result:
            return {"response_status": 400, "error": "Invalid Digital Link Syntax"}, None

        # If the link syntax is valid, attempt to fetch the corresponding document from the database.
        print('identifier:', identifier)
        wanted_db_document = web_db.read_document(doc_id)

        if wanted_db_document['response_status'] == 200:
            # document found - there is nothing more we need to do here.
            return dl_test_result, wanted_db_document

        # If we are being asked to search for GIAIs (8004), GRAIs (8003) or SSCCs (00) then an exact match may not
        # be immediately available as these are serialised identifiers.
        # _process_serialised_component() will search for a partial match and return
        # the wanted_db_document if found. If not found, it will return the same wanted_db_document as before.
        # If you wish you can add other AI codes to this list if you think you would like to apply the same
        # logic to them. For example, partial GTINs (01) might be useful. If so, just add their AI code with a
        # leading and trailing forward-slash to the 'prefixes' list below. e.g. adding GTIN:
        #     if any(identifier.startswith(prefix) for prefix in  = ['/8003/', '/8004/', '/00/', '/01/']):
        # We include both leading and trailing forward-slashes to ensure we are matching the AI code and not
        # a partial match of the AI value.
        if any(identifier.startswith(prefix) for prefix in ['/8003/', '/8004/', '/00/']):
            serialised_document = _process_serialised_identifier(identifier)
            if serialised_document is not None:
                return dl_test_result, serialised_document

        # We have searched and there is no partial match that has template variables {0} or {1}
        return {"response_status": 404, "error": f"No document found for anchor: {doc_id}"}, None

    except ValueError as e:
        print(f"_validate_and_fetch_document - ValueError occurred. Details: {str(e)}")
        return {"response_status": 400,
                "error": f"ValueError occurred. Possibly invalid identifiers or qualifier_path. Details: {str(e)}"}, None
    except TypeError as e:
        print(f"_validate_and_fetch_document - TypeError occurred. Details: {str(e)}")
        return {"response_status": 400,
                "error": f"TypeError occurred. Expected string-like object. Details: {str(e)}"}, None
    except Exception as e:
        print(f"_validate_and_fetch_document - Unexpected error occurred. Details: {str(e)}")
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


def _handle_link_type(linktype, default_linktype, linkset, accept_language_list, context, media_types_list,
                      linkset_requested=False):
    try:
        if linkset_requested or linktype in ['all', 'linkset']:
            return {"response_status": 200, "data": linkset}

        if linktype is None:
            default_full_linktype = f'https://gs1.org/voc/{default_linktype.replace("gs1:", "")}'
            wanted_linktype_entry = linkset[0][default_full_linktype]
        else:
            wanted_linktype_entry = linkset[0][f'https://gs1.org/voc/{linktype.replace("gs1:", "")}']

        wanted_linktype_docs_list = _get_appropriate_linktype_docs_list(
            wanted_linktype_entry,
            accept_language_list,
            context,
            media_types_list) if isinstance(wanted_linktype_entry, list) else wanted_linktype_entry

        if not wanted_linktype_docs_list:
            response_status, data, error_msg = 404, None, f"No linkset found for linktype: {wanted_linktype_entry}"
        else:
            if len(wanted_linktype_docs_list) == 1:
                response_status, data, error_msg = 307, wanted_linktype_docs_list[0], None
            else:
                response_status, data, error_msg = 300, wanted_linktype_docs_list, None

        return {"response_status": response_status, "data": data, "error": error_msg} if error_msg else {
            "response_status": response_status, "data": data}

    except KeyError as e:
        print(f"handle_link_type - Linktype not found in linkset. Details: {str(e)}")
        return {"response_status": 404, "error": f"Linktype not found in linkset. Details: {str(e)}"}

    except TypeError as e:
        print(f"handle_link_type - TypeError occurred. Details: {str(e)}")
        return {"response_status": 400,
                "error": f"TypeError occurred. Expected list or dictionary-like object. Details: {str(e)}"}

    except Exception as e:
        print(f"handle_link_type - Unexpected error occurred. Details: {str(e)}")
        return {"response_status": 500, "error": f"Unexpected error occurred. Details: {str(e)}"}


def read_document(identifiers, doc_id, qualifier_path='/', linktype=None, accept_language_list=None, context=None,
                  media_types_list=None, linkset_requested=False):
    """
    Reads a document from the data source and returns the most appropriate link data.

    :param identifiers: Identifier portion of the digital link.
    :param doc_id: Unique document ID used to fetch the document from the database.
    :param qualifier_path: Qualifier path portion of the digital link. Defaults to "/".
    :param linktype: Type of link in linktype document.
    :param accept_language_list: List of acceptable languages which influences the selection of the linktype document.
    :param context: Context information passed in from the caller.
    :param media_types_list: List of acceptable media links which influences the selection of the linktype document.
    :param linkset_requested: if true, the entire linkset for the entry is returned
    :return: A response dictionary which includes the response status and either the link data or error message.
    """
    try:
        # Validate the digital link and fetch the associated document.
        dl_test_result, response = _validate_and_fetch_document(identifiers, qualifier_path, doc_id)

        # If the digital link syntax is invalid, or a database errors / document not found occurs
        # then return the error response.
        if not dl_test_result or response['response_status'] != 200:
            return response

        # If the response is successful, proceed with processing.
        if response and response['response_status'] == 200:
            database_doc = response['data']

            # If qualifier_path is NoneType or '/', we look for an instance in the document
            # where there are no qualifiers.
            if qualifier_path is None or qualifier_path == '/':
                for entry in database_doc['data']:
                    if len(entry['qualifiers']) == 0:
                        print('read_document: No qualifiers found in the document')
                        return _handle_link_type(linktype,
                                                 database_doc['defaultLinktype'],
                                                 entry['linkset'],
                                                 accept_language_list,
                                                 context,
                                                 media_types_list,
                                                 linkset_requested
                                                 )

            # If we are here then there are qualifiers to process.
            # Iterate through each data item in the document.
            response_links_list = []
            for entry in database_doc['data']:
                # Iterate through each data item in the document and check if any qualifiers
                # in the data item match the qualifier path.
                yes_qualifiers_match, template_variables_list = _do_qualifiers_match(qualifier_path,
                                                                                     entry['qualifiers'])

                print('yes_qualifiers_match:', yes_qualifiers_match)
                # If qualifiers match, replace template variables and process the linkset.
                if yes_qualifiers_match:
                    if len(template_variables_list) > 0:
                        entry['linkset'] = _replace_linkset_template_variables(entry['linkset'],
                                                                               template_variables_list)

                    # Use handle_link_type to either return the appropriate linktype document
                    # or proceed to the next data item.
                    response_links_list.append(_handle_link_type(linktype,
                                                                 database_doc['defaultLinktype'],
                                                                 entry['linkset'],
                                                                 accept_language_list,
                                                                 context,
                                                                 media_types_list,
                                                                 linkset_requested
                                                                 ))

            print('response_links_list:', response_links_list)
            if not response_links_list:
                # If execution arrives here, a necessary linkset was not found, return a 404 Not Found.
                return {"response_status": 404, "error": f"No linkset found for linktype: {linktype}"}

            # If a single valid response is prepared, return it.
            if len(response_links_list) == 1 and response_links_list[0]['response_status'] == 307:
                return response_links_list[0]

            # If multiple valid responses are prepared, return a 300 response with the linkset data.
            if len(response_links_list) == 1 and response_links_list[0]['response_status'] == 300:
                return response_links_list[0]

            # If multiple valid responses are prepared, return a 200 response with the linkset data.
            return {"response_status": 200, "data": response_links_list}

    except Exception as e:
        # Log the exception and return a server error response.
        print('read_document: Internal Server Error - ', str(e))
        return {"response_status": 500, "error": "Internal Server Error: " + str(e)}
