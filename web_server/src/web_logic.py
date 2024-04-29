import json
import subprocess
import web_db


def _call_gs1_toolkit(ai_data_string):
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
    # To do this we make a command line call to the GS1 Digital Link Validator at
    # /app/gs1-digitallink-toolkit/calltoolkit.js and pass the URL as an ai data string parameter.
    # For example /01/09521234543213/10/LOT/21/SERIAL becomes
    # (01)09521234543213(10)LOT(21)SERIAL
    # We then call the toolkit and return the true/false result.
    url_parts = url.split('/')
    print('DEBUG _test_gs1_digital_link_syntax: url_parts:', url_parts)
    # add the identifier
    ai_data_string = f"({url_parts[1]}){url_parts[2]}"
    print(f"DEBUG _test_gs1_digital_link_syntax: ai_data_string: {ai_data_string}")

    # add the qualifiers (up to three - CPV, LOT and SERIAL for GTINs, or GLNX for GLNs)
    if len(url_parts) > 3:
        for i in range(3, len(url_parts), 2):
            ai_data_string += f"({url_parts[i]}){url_parts[i+1]}"

    print(f"DEBUG _test_gs1_digital_link_syntax: ai_data_string: {ai_data_string}")
    # call the toolkit
    return _call_gs1_toolkit(ai_data_string)


def _return_appropriate_linktype_doc(linktype_doc_list, accept_language_list, context, media_types_list):
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


def _search_template_variables(database_doc, qualifier_path):
    # This function seeks to see if any of the template variables in the qualifier_path can be matched to a qualifier
    # in the database_doc. If so, it returns the linkset for that qualifier. If not, it returns None.
    # Example:
    # qualifier_path = '/10/12345/21/12345678' and
    # one of the keys in database_doc is '/10/{lotnumber}/21/{serialnumber}'
    # so we match the two and replace {lotnumber} with 12345 and {serialnumber} with 12345678
    # throughout the database_doc and return the linkset for '/10/12345/21/12345678'

    # parse the url to get the path
    qualifier_path_parts = qualifier_path.split('/')
    for key in database_doc:
        if '{' in key and '}' in key:
            # we have a template variable in the key
            key_parts = key.split('/')
            if len(key_parts) == len(qualifier_path_parts):
                # In this example, key_parts = ['', '10', '{lotnumber}', '21', '{serialnumber}']
                # and qualifier_path_parts = ['', '10', '12345', '21', '12345678']
                # the first element in both lists is always empty, so we can ignore it, but
                # we need to match on the second, fourth and sixth elements (cpv, lot and serial number) depending on
                # the length of the lists. In this case, we need to match on the second and fourth elements,
                # so we need to match on:
                # key_parts[1] =  qualifier_path_parts[1] and key_parts[3] = qualifier_path_parts[3]
                # if we have a match, we can replace the template variables in the key with the values in the
                # qualifier_path and return the linkset for the new key
                # Let's go one step at a time. Firstly, do the ALL the numeric qualifier codes match?
                match_counter = 0
                for i in range(1, len(key_parts), 2):
                    if key_parts[i] == qualifier_path_parts[i]:
                        match_counter += 1

                if match_counter == int(len(key_parts) / 2):
                    # we have a complete match, so now we need to replace the template variables in the key
                    # with the values in the qualifier_path. To this we will create an object with the
                    # key = template_variable and value = value_in_qualifier_path
                    template_obj = {}
                    for i in range(2, len(key_parts), 2):
                        template_obj[key_parts[i]] = qualifier_path_parts[i]

                    # At this point we would have:
                    #   template_obj = {'{lotnumber}': '12345', '{serialnumber}': '12345678'}
                    # So now we can replace the template variables in the key with the values throughout database_doc.
                    # For ease, we will convert database_doc to a string and then replace the template variables
                    # with the values in the template_obj and then convert the string back to a dictionary.
                    # To JSON string:
                    database_doc_str = json.dumps(database_doc)

                    # Replace template variables with associated values throughout the string
                    for template_key in template_obj:
                        database_doc_str = database_doc_str.replace(template_key, template_obj[template_key])

                    # Back to dictionary
                    database_doc = json.loads(database_doc_str)

                    # Now we can return the linkset for the new key, as the template variables have been replaced
                    # with the values in the qualifier_path and the new key is now in the database_doc
                    return database_doc[qualifier_path]['linkset'][0]

    return None


def read_document(identifiers, doc_id, qualifier_path='/', linktype=None, accept_language_list=None, context=None,
                  media_types_list=None):
    try:
        if qualifier_path == '/':
            dl_test_result = _test_gs1_digital_link_syntax(identifiers)
        else:
            dl_test_result = _test_gs1_digital_link_syntax(identifiers + qualifier_path)

        if not dl_test_result:
            return {"response_status": 400, "error": "Invalid Digital Link Syntax"}

        response = web_db.read_document(doc_id)
        print('DEBUG read_document: doc_id:', doc_id)

        if response['response_status'] == 200:
            database_doc = response['data']
            print('DEBUG read_document: database_doc:', json.dumps(database_doc, indent=2))

            if qualifier_path is not None:

                if qualifier_path in database_doc:
                    linkset = database_doc[qualifier_path]['linkset'][0]  # there is only ever one entry in a linkset list
                else:
                    # Here we are looking for a qualifier that is not present in the database_doc - but could we get
                    # a template variable to match the request?
                    linkset = _search_template_variables(database_doc, qualifier_path)
            else:
                linkset = database_doc['/']['linkset'][0]

            if linktype == 'all' or linktype is 'linkset':
                return {"response_status": 200, "data": linkset}

            elif linktype is None:
                full_linktype = 'https://gs1.org/voc/defaultLink'

            else:
                full_linktype = f'https://gs1.org/voc/{linktype}'

            if full_linktype in linkset:
                linktype_doc_list = linkset[full_linktype]
                # is linktype_doc_list a list of dictionaries or a single dictionary?
                if isinstance(linktype_doc_list, list):
                    # we need to find the most appropriate dictionary in the list for the incoming request
                    wanted_linktype_doc = _return_appropriate_linktype_doc(linktype_doc_list,
                                                                           accept_language_list,
                                                                           context, media_types_list)
                else:
                    # we only have one dictionary to return
                    wanted_linktype_doc = linktype_doc_list

                if wanted_linktype_doc is not None:
                    return {"response_status": 307, "data": wanted_linktype_doc}
                else:
                    return {"response_status": 404, "error": f"No linkset found for linktype: {full_linktype}"}

            else:
                return {"response_status": 404, "error": f"No linkset found for linktype: {full_linktype}"}

        else:
            return response

    except Exception as e:
        print('read_document: Internal Server Error - ', str(e))
        return {"response_status": 500, "error": "Internal Server Error: " + str(e)}
