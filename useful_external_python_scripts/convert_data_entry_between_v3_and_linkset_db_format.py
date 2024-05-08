import argparse
import json


def read_file_and_convert_from_json(file_path):
    try:
        with open(file_path, 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        return {"error": "File not found"}
    except json.JSONDecodeError:
        return {"error": "Invalid JSON format"}


def write_to_file_as_json(file_path, data):
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=2)


def author_mongo_linkset_list(data_list):
    transformed_data_list = []
    for data in data_list:
        linkset_doc = author_mongo_linkset_document(data)
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
            transformed_data_list.append(author_mongo_linkset_document(data))

    return transformed_data_list


def author_v3_data_entry_list(data_list):
    transformed_data_list = []
    for data in data_list:
        transformed_data_list.append(convert_mongo_linkset_to_v3(data))

    return transformed_data_list


def convert_mongo_linkset_to_v3(mongo_linkset_format):
    """
    Transforms the provided mongo linkset format into the more compact Resolver CE v3 data entry format.
    """
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


def author_mongo_linkset_document(data_entry_format):
    default_linktype = data_entry_format['defaultLinktype']

    database_doc = {
        "_id": data_entry_format["anchor"].split('/')[-2] + '_' + data_entry_format["anchor"].split('/')[-1],
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

    return database_doc


def handle_data(action, item):
    switches = {
        'data_entry_to_mongo_linkset_list': author_mongo_linkset_list,
        'mongo_linkset_to_data_entry_list': author_v3_data_entry_list,
        'data_entry_to_mongo_linkset_document': author_mongo_linkset_document,
        'mongo_linkset_to_data_entry_document': convert_mongo_linkset_to_v3
    }

    return switches.get(action, lambda: "Invalid direction")(item)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Script to convert between Resolver CE v3 data entry and mongo linkset formats')
    parser.add_argument('input_file', help='Path to input JSON file')
    parser.add_argument('output_file', help='Path to output JSON file')
    parser.add_argument('direction',
                        help='Direction of conversion (default "data_entry_to_mongo_linkset", or "mongo_linkset_to_data_entry")',
                        default='data_entry_to_mongo_linkset')
    args = parser.parse_args()
    print('Resolver v3.0 Convertor')
    print("Input file:", args.input_file)
    print("Output file:", args.output_file)
    print("Format direction:", args.direction)

    doc = read_file_and_convert_from_json(args.input_file)
    if 'error' in doc:
        print(doc['error'])
        exit(1)

    # if doc is a list of documents
    if isinstance(doc, list):
        converted_doc = handle_data(args.direction + '_list', doc)
    else:
        converted_doc = handle_data(args.direction + '_document', doc)

    write_to_file_as_json(args.output_file, converted_doc)
    print('conversion successful')
