import subprocess
import data_entry_db
import traceback


def _call_gs1_toolkit(ai_data_string):
    node_path = "/usr/bin/node"
    toolkit_path = "/app/gs1-digitallink-toolkit/callGS1encoder.js"

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
    # /app/gs1-digitallink-toolkit/callGS1encoder.js and pass the URL as an ai data string parameter.
    # For example /01/09521234543213/10/LOT/21/SERIAL becomes
    # (01)09521234543213(10)LOT(21)SERIAL
    # We then call the toolkit and return the true/false result.
    url_parts = url.split('/')
    # add the identifier
    ai_data_string = f"({url_parts[1]}){url_parts[2]}"

    # add the qualifiers (up to three - CPV, LOT and SERIAL for GTINs, or GLNX for GLNs)
    if len(url_parts) > 3:
        for i in range(3, len(url_parts), 2):
            ai_data_string += f"({url_parts[i]}){url_parts[i + 1]}"

    # call the toolkit
    return _call_gs1_toolkit(ai_data_string)


def _validata_data(data):
    # TODO - Implement data validation using latest GS1 Digital Link Toolkit
    return data


def _convert_v2_to_v3(data_entry_v2_doc):
    rec_v3 = {
        'anchor': "/" + data_entry_v2_doc['identificationKeyType'] + "/" + data_entry_v2_doc['identificationKey'],
        'itemDescription': data_entry_v2_doc['itemDescription'],
        'defaultLinktype': '',
        'qualifiers': [],
        'links': []
    }
    if 'qualifierPath' in data_entry_v2_doc and data_entry_v2_doc['qualifierPath'] != '/':
        key_pairs = data_entry_v2_doc['qualifierPath'][1:].split('/')
        rec_v3['qualifiers'] = [{key_pairs[i]: key_pairs[i + 1]} for i in range(0, len(key_pairs), 2)]
    else:
        del rec_v3['qualifiers']

    print('There are {} responses to process'.format(len(data_entry_v2_doc['responses'])))
    for response in data_entry_v2_doc['responses']:
        link = {
            'linktype': response['linkType'],
            'href': response['targetUrl'],
            'title': response['linkTitle'],
            'type': response['mimeType']
        }

        # This statement deals with the fact that GS1 Global Office Resolver data entry v2 format uses
        # 'language' and 'public' whereas the Resolver CE v2 format uses 'ianaLanguage' and 'active'.
        if 'language' in response:
            link['public'] = True
            link['hreflang'] = [response['language']]
        else:
            link['active'] = True
            link['hreflang'] = [response['ianaLanguage']]

        if 'context' in response and isinstance(response['context'], list):
            link['context'] = response['context']

        if 'defaultLinkType' in response:
            rec_v3['defaultLinktype'] = response['linkType']

        # Now we must see if rec_v3['links'] already has a link with the same linktype and the same href.
        # If so, we must append the hreflang to the hreflang list in that existing link.
        # If not, we must append the link to rec_v3['links'].
        found = False
        for link_existing in rec_v3['links']:
            if link_existing['linktype'] == link['linktype'] and link_existing['href'] == link['href']:
                # first make sure that the language is not already in the list
                if response['language'] not in link_existing['hreflang']:
                    link_existing['hreflang'].append(response['language'])
                found = True
                break

        if not found:
            rec_v3['links'].append(link)

    return rec_v3


# Transforms the provided mongo linkset format into the more compact Resolver CE v3 data entry format.
def _convert_mongo_linkset_to_v3(mongo_linkset_format):
    """
    Transforms the provided mongo linkset format into the more compact Resolver CE v3 data entry format.
    """
    try:
        output_items = []

        for item in mongo_linkset_format['data']:
            output_item = {
                'anchor': "/" + mongo_linkset_format['_id'].replace('_', '/'),
                'itemDescription': '',
                'defaultLinktype': mongo_linkset_format['defaultLinktype'],
                'links': []
            }

            if 'qualifiers' in item:
                qualifiers = item['qualifiers']
            else:
                qualifiers = None

            for linkset in item['linkset']:
                for key in linkset:
                    if key.startswith(
                            'https://gs1.org/voc/') and key != 'https://gs1.org/voc/defaultLink' and key != 'https://gs1.org/voc/defaultLinkMulti':
                        linktype = 'gs1:' + key.split('/')[-1]
                        output_item['itemDescription'] = linkset['itemDescription']

                        # qualifiers are optional
                        if qualifiers is not None and qualifiers != []:
                            output_item['qualifiers'] = qualifiers

                        for link in linkset[key]:
                            if 'context' in link:
                                context = link['context']
                            else:
                                context = []

                            output_link = {
                                'linktype': linktype,
                                'href': link['href'],
                                'title': link['title'],
                                'type': link['type'],
                                'hreflang': link['hreflang'],
                            }

                            # context is optional
                            if context is not None and context != []:
                                output_link['context'] = context

                            output_item['links'].append(output_link)

                output_items.append(output_item)

        return output_items


    except KeyError as key_error:
        print(f'Missing key during conversion: {key_error}')
        return None
    except ValueError as value_error:
        print(f'Type error occured: {value_error}')
        return None
    except Exception as e:
        print(f'An unexpected error occurred during conversion: {e}')
        return None


def _author_db_linkset_document(data_entry_format):
    try:
        # First we must check if this a v2 or v3 document, and convert it to v3 if it's v2
        if 'identificationKeyType' in data_entry_format:
            print('Converting v2 to v3')
            data_entry_format = _convert_v2_to_v3(data_entry_format)
        elif 'anchor' in data_entry_format:
            print('Document is already in v3 format')
        else:
            return {"response_status": 400, "error": "Invalid data format: " + str(data_entry_format)}

        default_linktype = data_entry_format['defaultLinktype']

        doc_id = convert_path_to_document_id( data_entry_format["anchor"])

        database_doc = {
            "_id": doc_id,
            "defaultLinktype": default_linktype,
            "data": []
        }

        data = {
            "qualifiers": [],
            "linkset": []
        }

        if "qualifiers" in data_entry_format:
            data["qualifiers"] = data_entry_format["qualifiers"]

        # Now we construct the linkset object
        linkset_obj = {}

        for link in data_entry_format["links"]:
            linktype = "https://gs1.org/voc/" + link["linktype"].split(':')[1]
            if linktype not in linkset_obj:
                linkset_obj[linktype] = []

            linkset_entry = {
                "href": link["href"],
                "title": link["title"],
                "type": link.get("type"),
                "hreflang": link.get("hreflang"),
            }
            if "context" in link:
                linkset_entry["context"] = link["context"]

            linkset_obj[linktype].append(linkset_entry)

            # Check is this linktype is the default linktype:
            if default_linktype == link['linktype']:
                # If we are dealing with multiple languages, append 'defaultLinkMulti' to the linkset_obj
                if isinstance(linkset_entry['hreflang'], list) and len(linkset_entry['hreflang']) > 1:
                    linkset_obj['https://gs1.org/voc/defaultLinkMulti'] = linkset_entry

                # In any case we append 'defaultLink' to the linkset_obj with only linktype, href and title
                linkset_obj['defaultLink'] = {
                    "href": link['href'],
                    "title": link['title']
                }

        # finally we re-arrange 'defaultLink' to be the first element in the list and
        # defaultLinkMulti to be the second element in the list:
        rearranged_linkset_obj = {
            "anchor": data_entry_format["anchor"],
            "itemDescription": data_entry_format["itemDescription"],
            'https://gs1.org/voc/defaultLink': linkset_obj['defaultLink']
        }
        if 'defaultLinkMulti' in linkset_obj:
            rearranged_linkset_obj['defaultLinkMulti'] = linkset_obj['defaultLinkMulti']

        for key in linkset_obj:
            if key not in ['defaultLink', 'defaultLinkMulti']:
                rearranged_linkset_obj[key] = linkset_obj[key]

        linkset_obj = rearranged_linkset_obj
        data["linkset"].append(linkset_obj)

        database_doc["data"].append(data)

        return {"response_status": 200, "data": database_doc}

    except KeyError as key_error:
        print(f'Missing key during conversion: {key_error}')
        return {"response_status": 400, "error": f'Missing key during conversion: {key_error}'}

    except Exception as e:
        # If there's any exception during processing, return a server error response
        print('_author_linkset_document: Error processing document: ', str(e))
        print(traceback.format_exc())  # This will print the full traceback
        return {"response_status": 500, "error": "Internal Server Error - " + str(e)}


def _do_qualifiers_match(qualifiers1, qualifiers2):
    # qualifiers are lists in the document with up to three sets of AI codes and values:
    #      [{'aiCode1': 'aiValue1'}, {'aiCode2': 'value2'}{'aiCode2': 'value2'}
    # They may be in a different order, so we need to check for a match.
    # Are they the same length?
    if len(qualifiers1) != len(qualifiers2):
        return False

    # Loop through each qualifier - are the qualifiers the same?
    for qualifier1 in qualifiers1:
        if qualifier1 not in qualifiers2:
            return False

    return True


# Process the document for insertion or update in the database
def _process_document_upsert(authored_doc):
    try:
        # Convert the incoming dictionary date entry item to a linkset-style document ("authored_doc")

        # Try to read the document from the database
        read_result = data_entry_db.read_document(authored_doc['_id'])

        # Document already exists with the id
        if read_result["response_status"] == 200:
            print('Document already exists in database: ', authored_doc['_id'])

            # Get the document from the read_result
            existing_db_document = read_result["data"]

            # Iterate through each key-value pair in the authored_doc
            for entry in authored_doc['data']:
                # each entry consists of qualifiers and linkset
                # what we need to do is to see if there is a match in the qualifiers, bearing in mind that the
                # qualifiers may be in a different order
                # if there is a match, we need to update the linkset
                # if there is no match, we need to add the entry to the document
                # First match the qualifiers:
                found = False
                for existing_db_entry in existing_db_document['data']:
                    if _do_qualifiers_match(existing_db_entry['qualifiers'], entry['qualifiers']):
                        # If the qualifiers match, update the linkset
                        existing_db_entry['linkset'].extend(entry['linkset'])
                        found = True
                        break

                if not found:
                    # If the qualifiers don't match, add the entry to the document
                    existing_db_document['data'].append(entry)

                update_result = data_entry_db.update_document(existing_db_document)

                # Build the result entry and return it along with update status 200 (as the doc was updated)
                return {"entry": authored_doc['_id'], "qualifiers": entry['qualifiers'], "result": update_result}, 200

        # Document doesn't exist, so we create it
        elif read_result["response_status"] == 404:
            print('Document does not exist: ', authored_doc['_id'])

            # Perform the document creation in the database
            create_result = data_entry_db.create_document(authored_doc)

            # Build the result entry and return it along with creation status 201
            return {"entry": authored_doc['_id'], "result": create_result}, 201

        # If response status is neither 200 nor 404, return the read_result and its status
        else:
            return read_result, read_result["response_status"]

    except Exception as e:
        # If there's any exception during processing, return a server error response
        print('_process_document_insert: Error processing document: ', str(e))
        print(traceback.format_exc())  # This will print the full traceback
        return {"response_status": 500, "error": "Internal Server Error - " + str(e)}, 500


def _author_db_linkset_list(data_list):
    try:
        transformed_data_list = []
        for data in data_list:
            linkset_result = _author_db_linkset_document(data)

            if linkset_result['response_status'] != 200:
                # If there's an error, return the linkset_result which contains the error status and message
                return linkset_result

            else:
                linkset_doc = linkset_result['data']

                # Now we check if there is already a document with the same '_id' in the transformed_data_list
                # If there is, we append the 'data' list to the existing document
                # If there isn't, we append the document to the transformed_data_list
                found = False
                for transformed_data in transformed_data_list:
                    if transformed_data['_id'] == linkset_doc['_id']:
                        transformed_data['data'].extend(linkset_doc['data'])
                        found = True
                        break
                if not found:
                    transformed_data_list.append(linkset_doc)

        return {"response_status": 200, "data": transformed_data_list}

    except Exception as e:
        # If there's any exception during processing, return a server error response
        print('_author_mongo_linkset_list: Error processing document: ', str(e))
        return {"response_status": 500, "error": "Internal Server Error - " + str(e)}

def convert_path_to_document_id(path: str):
    if path.count('/') < 2:
        print("Error: path fomrant error")
        raise ValueError("Error: path fomrant error")

    parts = path.strip().split('/')
    parts = [p for p in parts if p != '']

    return '_'.join(parts)


def create_document(data):
    try:
        # If 'data' is a list
        if isinstance(data, list):
            print(f'Processing list of {len(data)} items: ')
            create_results_list = []  # Initialize a list to store results

            authored_db_linkset_result = _author_db_linkset_list(data)

            if authored_db_linkset_result['response_status'] != 200:
                return authored_db_linkset_result, authored_db_linkset_result['response_status']

            else:
                authored_db_linkset_docs = authored_db_linkset_result['data']

                # Iterate over each item in the data list
                for item in authored_db_linkset_docs:
                    print('Processing item: ', item['_id'])
                    validated_doc = _validata_data(item)

                    # Before we insert, we must delete - this is a create not update action
                    delete_result = data_entry_db.delete_document(item['_id'])
                    if delete_result['response_status'] == 200 or delete_result['response_status'] == 404:
                        # 200 means the document was deleted, 404 means it didn't exist.
                        # Process each 'item' in the list for insertion using the helper function we created
                        # and get the result and status
                        create_result, status = _process_document_upsert(validated_doc)
                        print('Result: ', create_result, 'Status: ', status)

                        # Append the result to the results list
                        create_results_list.append(create_result)
                    else:
                        print('Error deleting document before we create the new version: ', item['_id'])
                        create_results_list.append(delete_result)

                # Once all items have been processed, return the total result list and the successful status 201
                return create_results_list, 201

            # If 'data' is a dictionary (i.e., a single entry and not a list)
        elif isinstance(data, dict):
            authored_linkset_doc = _author_db_linkset_document(data)
            validated_doc = _validata_data(authored_linkset_doc)

            # Process the single 'data' entry for insertion using the helper function and get the result and status
            create_result, status = _process_document_upsert(validated_doc['data'])
            return create_result, status  # Return the result and status

        # If 'data' is not a list nor a dictionary, return an error response.
        else:
            return {"response_status": 400, "error": "Invalid data format: " + str(data)}

    except Exception as e:
        # If there's any exception during processing, return a server error response
        return {"response_status": 500, "error": "Internal Server Error - " + str(e)}


def read_document(document_id):
    try:
        # get the document from the database
        result = data_entry_db.read_document(document_id)

        # If found in the database, convert the document to the v3 format.
        # If not found, return the result as is (with the 404 status)
        if result['response_status'] == 200:
            result['data'] = _convert_mongo_linkset_to_v3(result['data'])

        return result

    except Exception as e:
        return {"response_status": 500, "error": "Internal Server Error"}


def read_index():
    try:
        # get the document index from the database
        result = data_entry_db.read_index()

        if result['response_status'] == 200:
            # format the list to include the '/' at the beginning and replace the '_' with '/'
            formatted_list = []
            for item in result['data']:
                formatted_list.append('/{}'.format(item.replace('_', '/')))
            result['data'] = formatted_list

        return result

    except Exception as e:
        return {"response_status": 500, "error": "Internal Server Error"}


def update_document(document_id, data):
    # currently update_document is not implemented in a different form from create_document
    # although this can change, for now we just call create_document
    return create_document(data)


def delete_document(anchor):
    try:
        result = data_entry_db.delete_document(anchor)
        return result

    except Exception as e:
        return {"response_status": 500, "error": "Internal Server Error"}
