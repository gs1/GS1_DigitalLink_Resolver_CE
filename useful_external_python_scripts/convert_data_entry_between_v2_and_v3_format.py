import argparse
import json

# GS1 Global Office Resolver has a slightly different format for the data entry documents compared to the Resolver CE.
# Set this flag to True if you use the GS1 Global Office Resolver / Links Registry date entry format.
GO_RESOLVER_V2_FORMAT = False


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


def author_document_list(data_list, direction='v2_to_v3'):
    transformed_data_list = []
    print('There are {} documents to convert in {} direction'.format(len(data_list), direction))
    for data in data_list:
        if direction == 'v2_to_v3':
            transformed_data_list.append(convert_v2_to_v3(data))
        else:
            transformed_data_list.append(convert_v3_to_v2(data))

    return transformed_data_list


def convert_v3_to_v2(data_entry_v3_doc):
    rec_v2 = {
        'identificationKeyType': data_entry_v3_doc['anchor'].split('/')[1],
        'identificationKey': data_entry_v3_doc['anchor'].split('/')[2],
        'itemDescription': data_entry_v3_doc['itemDescription'],
        'qualifierPath': "/" + "/".join(
            [f"{list(q.keys())[0]}/{list(q.values())[0]}" for q in data_entry_v3_doc.get("qualifiers", [])]),
        'responses': []
    }

    if GO_RESOLVER_V2_FORMAT:
        rec_v2['public'] = True
    else:
        rec_v2['active'] = True

    if 'qualifiers' in data_entry_v3_doc:
        rec_v2['qualifierPath'] = '/' + '/'.join(
            [k + '/' + v for q in data_entry_v3_doc['qualifiers'] for k, v in q.items()])

    for link in data_entry_v3_doc['links']:
        response = {
            'linkType': link['linktype'],
            'targetUrl': link['href'],
            'linkTitle': link['title'],
            'mimeType': link['type'],
            'language': link['hreflang'][0],
            'defaultLinkType': False,
            'defaultContext': True,
            'defaultMimeType': True,
            'fwqs': True,
        }
        if GO_RESOLVER_V2_FORMAT:
            response['public'] = True
            response['language'] = link['hreflang'][0]
            response['defaultLanguage'] = True
        else:
            response['active'] = True
            response['ianaLanguage'] = link['hreflang'][0]
            response['defaultIanaLanguage'] = True

        if 'context' in link:
            response['context'] = link['context']

        if data_entry_v3_doc['defaultLinktype'] == link['linktype']:
            response['defaultLinkType'] = True
        else:
            response['defaultLinkType'] = False

        rec_v2['responses'].append(response)

    return rec_v2


def convert_v2_to_v3(data_entry_v2_doc):
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
            'type': response['mimeType'],
            'hreflang': [response['language']]
        }
        if GO_RESOLVER_V2_FORMAT:
            link['public'] = True
            link['hreflang'] = [response['language']]
        else:
            link['active'] = True
            link['hreflang'] = [response['ianaLanguage']]

        if 'context' in response and isinstance(response['context'], list):
            link['context'] = response['context']

        if response['defaultLinkType']:
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


def main():
    parser = argparse.ArgumentParser(
        description='Script to convert between Resolver data entry V2 and V3 formats')
    parser.add_argument('input_file', help='Path to input JSON file')
    parser.add_argument('output_file', help='Path to output JSON file')
    parser.add_argument('direction',
                        help='Direction of conversion (default "v2_to_v3", or "v3_to_v2")',
                        default='v2_to_v3')
    args = parser.parse_args()

    doc = read_file_and_convert_from_json(args.input_file)
    if 'error' in doc:
        print(doc['error'])
        return

    # if doc is a list of documents then process list
    if isinstance(doc, list):
        converted_doc = author_document_list(doc, args.direction)
    else:
        if args.direction == 'v2_to_v3':
            converted_doc = convert_v2_to_v3(doc)
        else:
            converted_doc = convert_v3_to_v2(doc)

    print(json.dumps(converted_doc, indent=2))
    write_to_file_as_json(args.output_file, converted_doc)
    print('conversion successful')


if __name__ == '__main__':
    main()
