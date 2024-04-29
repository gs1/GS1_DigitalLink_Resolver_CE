import json
import subprocess
import data_entry_db
import traceback


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
    # Initial assignment and empty dictionary initialization
    output_item = {}
    qualifier_path = '/'

    # If the key '/' is in the 'item' dictionary, populate the 'output_item' dictionary with appropriate values
    # including an empty 'links' list.
    if '/' in mongo_linkset_format:
        output_item = {'anchor': mongo_linkset_format['/']['linkset'][0]['anchor'],
                       'itemDescription': mongo_linkset_format['/']['linkset'][0]['itemDescription'],
                       'defaultLinktype': 'gs1:not_yet_set',
                       'links': []}

    # If the key '/' is not in the 'item' dictionary, find the dictionary name starting with '/' and having length > 1
    # and split it by '/' to get the qualifiers.
    else:
        for key, value in mongo_linkset_format.items():
            if key.startswith('/') and len(key) > 1:
                qualifier_path = key
                qualifier_path_items = qualifier_path.strip('/').split('/')
                qualifiers = [{qualifier_path_items[i]: qualifier_path_items[i + 1]} for i in
                              range(0, len(qualifier_path_items), 2)]

                # Populate 'output_item' dictionary
                output_item = {'anchor': mongo_linkset_format[qualifier_path]['linkset'][0]['anchor'],
                               'itemDescription': mongo_linkset_format[qualifier_path]['linkset'][0]['itemDescription'],
                               'defaultLinktype': 'gs1:pip',
                               'qualifiers': qualifiers,
                               'links': []}

    # Iterate over the 'linkset' items, ignoring 'default' keys and updating remaining with a specific prefix.
    for key, value in mongo_linkset_format[qualifier_path]['linkset'][0].items():
        if key.startswith('https://gs1.org/voc/'):
            if key in ['https://gs1.org/voc/defaultLink', 'https://gs1.org/voc/defaultLinkMulti']:
                continue
            linktype = 'gs1:' + key.split('/')[-1]
            for sub_item in value:
                # Reorder the sub_item dictionary ensuring linktype is the first key, then
                # append it to the 'links' list in the 'output_item' dictionary.
                reordered_sub_item = {"linktype": linktype,
                                      "href": sub_item["href"],
                                      "title": sub_item["title"],
                                      "type": sub_item["type"],
                                      "hreflang": sub_item["hreflang"]}

                if 'context' in sub_item and sub_item['context']:
                    reordered_sub_item['context'] = sub_item['context']

                output_item['links'].append(reordered_sub_item)

    return output_item


def _author_linkset_document(data_entry_format):
    try:
        # First we must check if this a v2 or v3 document, and convert it to v3 if it's v2
        if 'identificationKeyType' in data_entry_format:
            print('Converting v2 to v3')
            item = _convert_v2_to_v3(data_entry_format)
        elif 'anchor' in data_entry_format:
            print('Document is already in v3 format')
        else:
            return {"response_status": 400, "error": "Invalid data format: " + str(data_entry_format)}

        # Create the database document with the anchor as the document id
        database_doc = {
            "_id": data_entry_format["anchor"].split('/')[-2] + '_' + data_entry_format["anchor"].split('/')[-1],
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
            if data_entry_format['defaultLinktype'] == link['linktype']:
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

        return database_doc

    except Exception as e:
        # If there's any exception during processing, return a server error response
        print('_author_linkset_document: Error processing document: ', str(e))
        print(traceback.format_exc())  # This will print the full traceback
        return {"response_status": 500, "error": "Internal Server Error - " + str(e)}


# Process the document for insertion or update in the database
def _process_document_upsert(item):
    try:
        # Convert the incoming dictionary date entry item to a linkset-style document ("authored_doc")
        authored_doc = _author_linkset_document(item)
        if "error" in authored_doc:
            return authored_doc, 400

        # print("DEBUG Authored doc: ", json.dumps(authored_doc, indent=2))

        # Log the _id of the document that's being processed
        # print('DEBUG Processing item: ', authored_doc['_id'])

        # Try to read the document from the database
        read_result = data_entry_db.read_document(authored_doc['_id'])

        # Document already exists with the id
        if read_result["response_status"] == 200:
            print('Document already exists in database: ', authored_doc['_id'])

            # Get the document from the read_result
            db_document = read_result["data"]

            # Iterate through each key-value pair in the authored_doc
            for key, value in authored_doc.items():
                if key[:1] == '/':
                    print('DEBUG: Key: ', key, 'Value: ', json.dumps(value, indent=2))

                    # Log which key we're updating
                    print('Updating document: ', authored_doc['_id'], 'with key', key)

                    # Update the value in the database document with the new value
                    db_document[key] = authored_doc[key]

                    # Perform the update operation in the database
                    update_result = data_entry_db.update_document(db_document)

                    # Build the result entry and return it along with update status 201
                    return {"entry": authored_doc['_id'], "qualifiers": key, "result": update_result}, 201

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


def create_document(data):
    try:
        # If 'data' is a list
        if isinstance(data, list):
            print('Processing list of items: ', len(data))
            create_results_list = []  # Initialize a list to store results

            # Iterate over each item in the data list
            for item in data:
                validated_doc = _validata_data(item)
                # Process each 'item' in the list for insertion using the helper function we created
                # and get the result and status
                result, status = _process_document_upsert(validated_doc)
                print('Result: ', result, 'Status: ', status)

                # If the status is not 201 (successful creation) or 200 (successful update)
                # return the results list so far and the status
                if status not in [200, 201]:
                    return create_results_list, status

                # If the item was successfully processed, append it to the result list
                create_results_list.append(result)

            # Once all items have been processed, return the total result list and the successful status 201
            return create_results_list, 201

        # If 'data' is a dictionary (i.e., a single entry and not a list)
        elif isinstance(data, dict):
            validated_doc = _validata_data(data)

            # Process the single 'data' entry for insertion using the helper function and get the result and status
            result, status = _process_document_upsert(validated_doc)
            return result, status  # Return the result and status

        # If 'data' is not a list nor a dictionary, return an error response.
        else:
            return {"response_status": 400, "error": "Invalid data format: " + str(data)}

    except Exception as e:
        # If there's any exception during processing, return a server error response
        return {"response_status": 500, "error": "Internal Server Error - " + str(e)}


def read_document(anchor):
    try:
        # get the document from the database
        result = data_entry_db.read_document(anchor)

        # If found in the database, convert the document to the v3 format.
        # If not found, return the result as is (with the 404 status)
        if result['response_status'] == 200:
            result['data'] = _convert_mongo_linkset_to_v3(result['data'])

        return result

    except Exception as e:
        return {"response_status": 500, "error": "Internal Server Error"}


def update_document(anchor, data):
    # currently update_document is not implemented in a different form from create_document
    # although this can change, for now we just call create_document
    return create_document(data)


def delete_document(anchor):
    try:
        result = data_entry_db.delete_document(anchor)
        return result

    except Exception as e:
        return {"response_status": 500, "error": "Internal Server Error"}
