import json
import logging
import os
import re
import subprocess
from typing import Any


import web_db

logger = logging.getLogger(__name__)

# Pattern for validating GS1 Digital Link path segments (AI codes + values).
# Allows alphanumeric characters, hyphens, dots, underscores, percent-encoded bytes, and parentheses.
_SAFE_GS1_PATTERN = re.compile(r'^[A-Za-z0-9\-._~%()/:+]+$')


def _validate_gs1_input(value: str) -> str:
    """Reject values containing shell-special or unexpected characters before passing to subprocess."""
    if not _SAFE_GS1_PATTERN.match(value):
        raise ValueError(f"Invalid characters in GS1 input: {value!r}")
    return value


def _call_gs1_toolkit(ai_data_string: str) -> bool:
    """
    This function calls the GS1 Digital Link Toolkit to validate the syntax of a GS1 Digital Link URL.
    :param ai_data_string:
    :return:
    """
    _validate_gs1_input(ai_data_string)
    node_path = "/usr/bin/node"
    toolkit_path = "/app/gs1-digitallink-toolkit/callGS1encoder.js"

    process = subprocess.Popen([node_path, toolkit_path, ai_data_string],
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE)

    stdout, stderr = process.communicate()

    if process.returncode != 0:
        logger.warning("_call_gs1_toolkit error: %s", stderr.decode('utf-8'))
        return False

    return True


def uncompress_gs1_digital_link(compressed_link: str) -> dict[str, Any]:
    """
    This function checks if the AI data string is a compressed GS1 Digital link.
    The only library that does this id the GS1 Digital Link Toolkit GS1DigitalLinkToolkit.js
    :param compressed_link: The compressed link to check
    :return: The uncompressed GS1 Digital Link if the AI data string is compressed, otherwise a failure message.
    """
    _validate_gs1_input(compressed_link)
    node_path = "/usr/bin/node"
    toolkit_path = "/app/gs1-digitallink-toolkit/callGS1toolkit.js"
    process = subprocess.Popen([node_path, toolkit_path, compressed_link, 'uncompress'],
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE)

    stdout, stderr = process.communicate()

    if process.returncode != 0:
        logger.warning("uncompress_gs1_digital_link error: %s", stderr.decode('utf-8'))
        return {'result': False, 'error': stderr.decode('utf-8')}

    logger.debug('Decompression stdout: %s', stdout)
    return json.loads(stdout)


def compress_gs1_digital_link(uncompressed_link: str) -> dict[str, Any]:
    """
    This function compresses a GS1 Digital Link URL.
    The only library that does this id the GS1 Digital Link Toolkit GS1DigitalLinkToolkit.js
    :param uncompressed_link: The uncompressed link to compress
    :return: The compressed GS1 Digital Link URL if successful, otherwise a failure message.
    """
    _validate_gs1_input(uncompressed_link)
    node_path = "/usr/bin/node"
    toolkit_path = "/app/gs1-digitallink-toolkit/callGS1toolkit.js"

    process = subprocess.Popen([node_path, toolkit_path, uncompressed_link, 'compress'],
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE)

    stdout, stderr = process.communicate()

    if process.returncode != 0:
        logger.warning("compress_gs1_digital_link error: %s", stderr.decode('utf-8'))
        return {'result': False, 'error': stderr.decode('utf-8')}

    return json.loads(stdout)


def _test_gs1_digital_link_syntax(url: str) -> bool:
    """
    This function tests the syntax of a GS1 Digital Link URL. It returns True if the URL is valid,
    and False if it is not.
    """

    try:
        url_parts = url.split('/')
        # Add the identifier
        ai_data_string = f"({url_parts[1]}){url_parts[2]}"

        # Add the qualifiers (up to three - CPV, LOT and SERIAL for GTINs, or GLNX for GLNs)
        if len(url_parts) > 3:
            for i in range(3, len(url_parts), 2):
                ai_data_string += f"({url_parts[i]}){url_parts[i + 1]}"

        # Call the toolkit
        return _call_gs1_toolkit(ai_data_string)

    except IndexError as e:
        logger.warning("URL is missing expected segments: %s", e)
        return False
    except KeyError as e:
        logger.warning("KeyError in _call_gs1_toolkit: %s", e)
        return False
    except Exception as e:
        logger.warning("Unexpected error in _test_gs1_digital_link_syntax: %s", e)
        return False


def _match_all_three_contexts(linktype_doc_list: list[dict[str, Any]], accept_language_list: list[str], context: str | None, media_types_list: list[str] | None) -> list[dict[str, Any]] | None:
    wanted_doc_list = []
    logger.debug('Matching all three contexts: %s, %s, %s', accept_language_list, context, media_types_list)
    for value in accept_language_list:  # iterate accept_language_list first
        for linktype_doc in linktype_doc_list:
            if 'hreflang' in linktype_doc and 'context' in linktype_doc and 'type' in linktype_doc and \
                    context in linktype_doc['context'] and \
                    linktype_doc['type'] in media_types_list and \
                    value in linktype_doc['hreflang']:
                # found a match, append it
                logger.debug('Matched all three contexts: %s', value)
                wanted_doc_list.append(linktype_doc)
                break
        else:
            continue
        break

    # If list is not empty, return it. Otherwise, return None
    return wanted_doc_list if wanted_doc_list else None


def _match_accept_language_and_context(linktype_doc_list: list[dict[str, Any]], accept_language_list: list[str], context: str | None) -> list[dict[str, Any]] | None:
    wanted_doc_list = []
    logger.debug('Matching accept_language and context: %s, %s', accept_language_list, context)
    for value in accept_language_list:  # iterate accept_language_list first
        for linktype_doc in linktype_doc_list:
            if 'hreflang' in linktype_doc and 'context' in linktype_doc and \
                    context in linktype_doc['context'] and \
                    value in linktype_doc['hreflang']:
                logger.debug('Matched accept_language and context: %s', value)
                wanted_doc_list.append(linktype_doc)
                break
        else:
            continue
        break

    # If list is not empty, return it. Otherwise, return None
    return wanted_doc_list if wanted_doc_list else None


def _match_accept_language_and_media_types(linktype_doc_list: list[dict[str, Any]], accept_language_list: list[str], media_types_list: list[str] | None) -> list[dict[str, Any]] | None:
    wanted_doc_list = []
    logger.debug('Matching accept_language and media_types: %s, %s', accept_language_list, media_types_list)
    for value in accept_language_list:  # iterate accept_language_list first
        for linktype_doc in linktype_doc_list:
            if 'hreflang' in linktype_doc and 'type' in linktype_doc and \
                    linktype_doc['type'] in media_types_list and \
                    value in linktype_doc['hreflang']:
                logger.debug('Matched accept_language and media_types: %s', value)
                wanted_doc_list.append(linktype_doc)
                break
        else:
            continue
        break

    # If list is not empty, return it. Otherwise, return None
    return wanted_doc_list if wanted_doc_list else None


def _match_context_and_media_types(linktype_doc_list: list[dict[str, Any]], context: str | None, media_types_list: list[str] | None) -> list[dict[str, Any]] | None:
    wanted_doc_list = []
    logger.debug('Matching context and media_types: %s, %s', context, media_types_list)
    for linktype_doc in linktype_doc_list:
        if 'context' in linktype_doc and \
                'type' in linktype_doc and \
                context in linktype_doc['context'] and \
                (linktype_doc['type'] in media_types_list or 'und' in linktype_doc['type']):
            logger.debug('Matched context and media_types')
            wanted_doc_list.append(linktype_doc)

    # If list is not empty, return it. Otherwise, return None
    return wanted_doc_list if wanted_doc_list else None


def _match_accept_language(linktype_doc_list: list[dict[str, Any]], accept_language_list: list[str]) -> list[dict[str, Any]] | None:
    wanted_doc_list = []
    for value in accept_language_list:
        for linktype_doc in linktype_doc_list:
            if 'hreflang' in linktype_doc and value in linktype_doc['hreflang']:
                wanted_doc_list.append(linktype_doc)
                break  # This breaks the inner linktype_doc_list loop
        else:
            continue  # Continue if the inner loop wasn't broken.
        break  # Break the outer loop if the inner one was broken

    # If list is not empty, return it. Otherwise, return None
    return wanted_doc_list if wanted_doc_list else None


def _match_context(linktype_doc_list: list[dict[str, Any]], context: str | None) -> list[dict[str, Any]] | None:
    wanted_doc_list = []
    logger.debug('Matching context: %s', context)
    for linktype_doc in linktype_doc_list:
        if 'context' in linktype_doc and \
                context in linktype_doc['context']:
            logger.debug('Matched context')
            wanted_doc_list.append(linktype_doc)

    # If list is not empty, return it. Otherwise, return None
    return wanted_doc_list if wanted_doc_list else None


def _match_media_type(linktype_doc_list: list[dict[str, Any]], media_types_list: list[str] | None) -> list[dict[str, Any]] | None:
    wanted_doc_list = []
    logger.debug('Matching media_types: %s', media_types_list)
    for linktype_doc in linktype_doc_list:
        if 'type' in linktype_doc and \
                (linktype_doc['type'] in media_types_list or 'und' in linktype_doc['type']):
            logger.debug('Matched media_type')
            wanted_doc_list.append(linktype_doc)

    # If list is not empty, return it. Otherwise, return None
    return wanted_doc_list if wanted_doc_list else None


def _match_und_hreflang(linktype_doc_list: list[dict[str, Any]]) -> list[dict[str, Any]] | None:
    wanted_doc_list = []
    for linktype_doc in linktype_doc_list:
        if 'hreflang' in linktype_doc and 'und' in linktype_doc['hreflang']:
            logger.debug('Found und match in hreflang')
            wanted_doc_list.append(linktype_doc)
    if wanted_doc_list:
        return wanted_doc_list


def _match_und_media_type(linktype_doc_list: list[dict[str, Any]]) -> list[dict[str, Any]] | None:
    wanted_doc_list = []
    for linktype_doc in linktype_doc_list:
        if 'type' in linktype_doc and 'und' in linktype_doc['type']:
            logger.debug('Found und match in type')
            wanted_doc_list.append(linktype_doc)
    if wanted_doc_list:
        return wanted_doc_list


def _get_appropriate_linktype_docs_list(linktype_doc_list: list[dict[str, Any]], accept_language_list: list[str], context: str | None, media_types_list: list[str] | None) -> list[dict[str, Any]]:
    """
    This function returns the most appropriate linktype document from a list of linktype documents.
    It does this by checking if the linktype document matches the accept_language_list, context, and media_types_list.
    Matching is logged at DEBUG level for diagnostic visibility.
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
    logger.debug('No match found, returning first linktype_doc')
    return linktype_doc_list


def _do_qualifiers_match(qualifier_path: str | None, doc_qualifiers: list[dict[str, str]]) -> tuple[bool, list[dict[str, str]] | None]:
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
        # Handle the case where qualifier_path is None or empty
        if qualifier_path is None or qualifier_path == '/':
            # Return True only if doc_qualifiers is also empty
            return len(doc_qualifiers) == 0, []

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
        logger.warning('_do_qualifiers_match KeyError: %s', e)
        return False, [f"KeyError occurred. Details: {str(e)}"]
    except TypeError as e:
        logger.warning('_do_qualifiers_match TypeError: %s', e)
        return False, [f"TypeError occurred. Expected list or dictionary-like object. Details: {str(e)}"]
    except Exception as e:
        logger.warning('_do_qualifiers_match error: %s', e)
        return False, [f"Unexpected error occurred. Details: {str(e)}"]


def _author_link_header_with_pointer_to_linkset(linkset: list[dict[str, Any]]) -> str:
    """
    This function creates a Link header with a pointer to the linkset.
    This a change from previous versions of the GS1 Resolver Standard that tries to out all relevant links from
    the linkset into the Link header. This is not practical for large linksets and can overwhelm some web clients
    with the header size! This function replaces _author_compact_links_for_link_header(linkset) which did this.
    Example: Link: <{current URL, minus query string, + linkType=linkset>; rel="application/linkset"; type="application/linkset"; title="Linkset for {identifiers}"
    :param linkset (list): The input JSON data - to make this function backwards-compatible with _author_compact_links_for_link_header()
    :return: The Link header with a pointer to the linkset.
    """
    identifiers = linkset[0].get("anchor")
    return f'<https://{os.getenv("FQDN", "set-domain-name-in-env-variable-FQDN.com")}{identifiers}?linkType=linkset>; rel="application/linkset"; type="application/linkset"; title="Linkset for {identifiers}"'



def _process_serialised_identifier(identifier: str) -> dict[str, Any] | None:
    """
    Processes the serialised component of the identifier using binary search to find
    the longest prefix that matches a database document with template variables.

    Uses binary search over the identifier length to minimise DB calls (O(log n) instead of O(n)).
    After finding the boundary between found/not-found, it scans downward from the longest
    match to find one with template variables {0} or {1}.

    :param identifier: The identifier portion of the digital link .e.g. '/8004/0950600013430000001'
    :return: The wanted_db_document with the serialised component processed, or None if no match found.
    """
    min_len = 12
    max_len = len(identifier) - 1

    if max_len <= min_len:
        return None

    # Binary search: find the longest prefix that exists in the DB
    longest_found = -1
    lo, hi = min_len + 1, max_len
    while lo <= hi:
        mid = (lo + hi) // 2
        result = web_db.read_document(identifier[:mid])
        if result['response_status'] == 200:
            longest_found = mid
            lo = mid + 1  # try longer
        else:
            hi = mid - 1  # try shorter

    if longest_found == -1:
        return None

    # From the longest found match, scan downward looking for template variables
    for i in range(longest_found, min_len, -1):
        if i == longest_found:
            wanted_db_document = web_db.read_document(identifier[:i])
        else:
            wanted_db_document = web_db.read_document(identifier[:i])
        if wanted_db_document['response_status'] != 200:
            continue

        wanted_json = json.dumps(wanted_db_document['data'])

        if '{0}' not in wanted_json and '{1}' not in wanted_json:
            continue

        # Extract the matched value and the remainder
        ai_value = identifier[:i].split('/')[2]
        ai_partial_value = identifier.split('/')[2].replace(ai_value, '')

        # Replace template variables with actual values
        wanted_json = wanted_json.replace('{0}', ai_value)
        wanted_json = wanted_json.replace('{1}', ai_partial_value)

        wanted_db_document['data'] = json.loads(wanted_json)
        return wanted_db_document

    return None


def _validate_and_fetch_document(identifier: str, qualifier_path: str | None, doc_id: str) -> dict[str, Any]:
    """
    searches for a partial identifier match and returns the wanted_db_document if found.
    If not found, it will return the same wanted_db_document as before.

    :param identifier: The identifier portion of the digital link (e.g., '01/09550001563533')
    :param qualifier_path: The qualifier path of the digital link, if any (e.g., '/22/455') only used to validate syntax
    :param doc_id: The document ID to look up in the database.
    :return: the wanted_db_document from trying to read the document with the given doc_id
             from the database - or an error message if the document is not found.
    """
    try:
        # Concatenate the identifiers and qualifier_path to form the complete digital link
        digital_link = identifier + (qualifier_path if qualifier_path is not None else '')

        # Check if the digital link has valid syntax.
        dl_test_result = _test_gs1_digital_link_syntax(digital_link)

        # If the link syntax is invalid, return an error dictionary along with a `None` wanted_db_document.
        if not dl_test_result:
            logger.debug('Invalid GS1 Digital Link Syntax')
            return {"response_status": 400, "error": f"Invalid GS1 Digital Link syntax: {digital_link}"}

        # If the link syntax is valid, attempt to fetch the corresponding document from the database.
        logger.debug('identifier: %s', identifier)
        wanted_db_document = web_db.read_document(doc_id)

        if wanted_db_document['response_status'] == 200:
            # document found - there is nothing more we need to do here.
            return wanted_db_document

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
                return serialised_document

        # We have searched and there is no partial match that has template variables {0} or {1}
        return {"response_status": 404, "error": f"No document found for anchor: {doc_id}"}

    except ValueError as e:
        logger.warning('_validate_and_fetch_document ValueError: %s', e)
        return {"response_status": 400,
                "error": f"ValueError occurred. Possibly invalid identifiers or qualifier_path. Details: {str(e)}"}

    except TypeError as e:
        logger.warning('_validate_and_fetch_document TypeError: %s', e)
        return {"response_status": 400,
                "error": f"TypeError occurred. Expected string-like object. Details: {str(e)}"}

    except Exception as e:
        logger.error('_validate_and_fetch_document error: %s', e)
        return {"response_status": 500, "error": f"Unexpected error occurred. Details: {str(e)}"}


def _replace_linkset_template_variables(linkset: list[dict[str, Any]], template_variables_list: list[dict[str, str]]) -> list[dict[str, Any]] | dict[str, Any]:
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
        logger.warning('replace_linkset_template_variables TypeError: %s', e)
        return {"response_status": 400,
                "error": f"TypeError occurred. Expected list or dictionary-like object - {str(e)}"}

    except json.JSONDecodeError as e:
        logger.warning('replace_linkset_template_variables JSONDecodeError: %s', e)
        return {"response_status": 400, "error": f"JSONDecodeError occurred. Invalid JSON format - {str(e)}"}

    except Exception as e:
        logger.error('replace_linkset_template_variables error: %s', e)
        return {"response_status": 500, "error": f"Unexpected error - {str(e)}"}


def _handle_link_type(linktype: str | None, default_linktype: str, linkset: list[dict[str, Any]], accept_language_list: list[str], context: str | None, media_types_list: list[str] | None,
                      linkset_requested: bool = False) -> dict[str, Any]:
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
        logger.debug('handle_link_type - Linktype not found: %s', e)
        return {"response_status": 404, "error": f"Linktype not found in linkset. Details: {str(e)}"}

    except TypeError as e:
        logger.warning('handle_link_type TypeError: %s', e)
        return {"response_status": 400,
                "error": f"TypeError occurred. Expected list or dictionary-like object. Details: {str(e)}"}

    except Exception as e:
        logger.error('handle_link_type error: %s', e)
        return {"response_status": 500, "error": f"Unexpected error occurred. Details: {str(e)}"}


def get_compressed_link(uncompressed_link: str) -> dict[str, Any]:
    try:
        compressed_link = compress_gs1_digital_link(uncompressed_link)
        if compressed_link.get('SUCCESS'):
            return {'response_status': 200, 'COMPRESSED_LINK': compressed_link['COMPRESSED']}
        return {'response_status': 400,
                'error': 'Compression failed. Check GS1 Digital Link syntax is correct before compressing'}

    except Exception as e:
        logger.warning('get_compressed_link error: %s', e)
        return {'response_status': 400,
                'error': 'Unexpected error occurred. Check GS1 Digital Link syntax is correct before compressing'}


def _clean_q_values_from_header_entries(header_values_list: list[str]) -> list[str]:
    """
    Returns a new list with quality-value parameters stripped (e.g., ';q=0.8').
    Does not mutate the input list.
    :param header_values_list:
    :return: cleaned list
    """
    return [entry.split(';')[0] for entry in header_values_list]


def format_linkset_for_external_use(response_data: dict[str, Any], identifiers: str) -> dict[str, Any]:
    ai_code = identifiers.split('/')[1]
    ai_value = identifiers.split('/')[2]

    response_linkset = {
        "@context": {
            "schema": "https://schema.org/",
            "gs1": "http://gs1.org/voc/",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "owl": "http://www.w3.org/2002/07/owl#",
            "dcterms": "http://purl.org/dc/terms/",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "skos": "http://www.w3.org/2004/02/skos/core#",
            "gs1:value": {
                "@type": "xsd:float"
            },
            "@protected": True,
            "href": "@id",
            "hreflang": {
                "@id": "dcterms:language",
                "@container": "@set"
            },
            "title": {
                "@id": "dcterms:title"
            },
            "title*": {
                "@id": "dcterms:title",
                "@container": "@set"
            },
            "type": {
                "@id": "dcterms:format"
            },
            "modified": {
                "@id": "dcterms:modified"
            },
            "itemDescription": {
                "@id": "rdfs:comment"
            },
            "linkset": "@nest"
        },
        "@id": f"/{ai_code}/{ai_value}",
        "@type": [
            "rdfs:Class",
            "owl:Class",
            "gs1:Product",
            "schema:Product"
        ],
        "gs1:elementStrings": f"({ai_code}){ai_value}",
    }

    if ai_code == '01':
        response_linkset['@context']['gs1:gtin'] = ai_value
        response_linkset['@context']['schema:gtin'] = ai_value

    #  add the linkset to the response
    response_linkset['linkset'] = response_data['data']

    # adjust the anchor value to include the fully qualified domain name 'FQDN' (specified in Dockerfile but can be
    # moved to other environment variable lists depending on your installation needs)
    response_linkset['linkset'][0]['anchor'] = f"https://{os.getenv('FQDN', 'replace_with_environment_variable_FQDN_see_README.com')}{response_linkset['linkset'][0]['anchor']}"

    # Iterate through the linkset and remove "und" from hreflang lists, Although 'und' (for 'undefined') is a valid
    # value for the 'hreflang' attribute for internal processing, it is not allowed in the linkset response.
    for link in response_linkset['linkset']:
        # Recursively check keys in the link objects
        for key, value in link.items():
            if isinstance(value, list):  # Check if the value is a list
                for entry in value:
                    if isinstance(entry, dict) and 'hreflang' in entry:  # Check for `hreflang` in a dictionary entry
                        if 'und' in entry['hreflang']:
                            entry['hreflang'].remove('und')  # Remove "und" if it exists
                        # check if the list is now empty and remove the key if it is
                        if not entry['hreflang']:
                            del entry['hreflang']


    # Internally, default_link does not have to be an array for ease of processing, but for external use, it must be
    # an array (list). Standards conformant!
    default_link = response_linkset['linkset'][0].get('https://gs1.org/voc/defaultLink')
    if default_link is not None and not isinstance(default_link, list):
        response_linkset['linkset'][0]['https://gs1.org/voc/defaultLink'] = [default_link]


    return response_linkset


def read_document(gs1dl_identifier: str, doc_id: str, qualifier_path: str | None = '/', linktype: str | None = None, accept_language_list: list[str] | None = None, context: str | None = None,
                  media_types_list: list[str] | None = None, linkset_requested: bool = False) -> tuple[dict[str, Any], str | None] | dict[str, Any]:
    """
    Reads a document from the data source and returns the most appropriate link data based on the linktype, accept_language_list, context, and media_types_list.
    If the linkset_requested is True, the entire linkset for the entry is returned.

    :param gs1dl_identifier: Identifier portion of the digital link.
    :param doc_id: Unique document ID used to fetch the document from the database.
    :param qualifier_path: Qualifier path portion of the digital link. Defaults to "/".
    :param linktype: Type of link in linktype document.
    :param accept_language_list: List of acceptable languages which influences the selection of the linktype document.
    :param context: Context information passed in from the caller.
    :param media_types_list: List of acceptable media links which influences the selection of the linktype document.
    :param linkset_requested: if true, the entire linkset for the entry is returned
    :return: Two elements: A response dictionary which includes the response status and either the link data or error message (all of which will be showin the body of the response
                           A string to be placed into the 'Link' header of the response.
    """
    try:
        # Validate the digital link and fetch the associated document.
        doc_data = _validate_and_fetch_document(gs1dl_identifier, qualifier_path, doc_id)

        # If the digital link syntax is invalid, or a database errors / document not found occurs
        # then return the error response which is stored in doc_data.
        if doc_data['response_status'] != 200:
            return doc_data, None

        else:
            database_doc = doc_data['data']

            accept_language_list = _clean_q_values_from_header_entries(accept_language_list)
            media_types_list = _clean_q_values_from_header_entries(media_types_list)

            # If qualifier_path is NoneType or '/', we look for an instance in database_doc
            # where there are no qualifiers.
            if qualifier_path is None or qualifier_path == '/':
                for entry in database_doc['data']:
                    if len(entry['qualifiers']) == 0:
                        logger.debug('read_document: No qualifiers found in the document')
                        return _handle_link_type(linktype,
                                                 database_doc['defaultLinktype'],
                                                 entry['linkset'],
                                                 accept_language_list,
                                                 context,
                                                 media_types_list,
                                                 linkset_requested
                                                 ), _author_link_header_with_pointer_to_linkset(entry['linkset'])

            # If we are here then there are qualifiers to process.
            # Iterate through each data item in the document.
            response_links_list = []
            link_header_list = []
            for entry in database_doc['data']:
                # Iterate through each data item in the document and check if any qualifiers
                # in the data item match the qualifier path.
                yes_qualifiers_match, template_variables_list = _do_qualifiers_match(qualifier_path,
                                                                                     entry['qualifiers'])

                # If qualifiers match, replace template variables and process the linkset.
                # For linkset requests, also include entries with no qualifiers (GTIN-only entries).
                if yes_qualifiers_match or (linkset_requested and len(entry['qualifiers']) == 0):
                    if template_variables_list and len(template_variables_list) > 0:
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
                    link_header_list.append(_author_link_header_with_pointer_to_linkset(entry['linkset']))


            if not response_links_list:
                # If execution arrives here, a necessary linkset was not found, return a 404 Not Found.
                return {"response_status": 404, "error": f"No linkset found for linktype: {linktype}"}

            # If a single valid response is prepared, return it.
            if len(response_links_list) == 1 and response_links_list[0]['response_status'] == 307:
                return response_links_list[0], link_header_list[0]

            # If multiple valid responses are prepared, return a 300 response with the linkset data.
            if len(response_links_list) == 1 and response_links_list[0]['response_status'] == 300:
                return response_links_list[0], link_header_list[0]

            # For linkset requests, merge all linksets into a single array
            # This handles both single and multiple entries
            if linkset_requested and len(response_links_list) > 0:
                merged_linkset = []
                for response in response_links_list:
                    if response['response_status'] == 200 and 'data' in response:
                        # response['data'] is the linkset array, extend it to merged_linkset
                        merged_linkset.extend(response['data'])
                return {"response_status": 200, "data": merged_linkset}, ','.join(link_header_list)

            # If multiple valid responses are prepared, return a 200 response with the linkset data.
            return {"response_status": 200, "data": response_links_list}, ','.join(link_header_list)

    except Exception as e:
        # Log the exception and return a server error response.
        logger.error('read_document: Internal Server Error', exc_info=True)

        return {"response_status": 500, "error": "Internal Server Error: " + str(e)}
