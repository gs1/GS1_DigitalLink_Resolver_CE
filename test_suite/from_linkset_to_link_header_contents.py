import json


def author_compact_links_for_link_header(linkset):
    """
    Convert GS1 JSON data to a compact link format.

    Args:
        linkset (list): The input JSON data - one entry.

    Returns:
        str: The compact link format.
    """
    links = []
    same_as_link = None

    # Extract owl:sameAs link
    anchor = linkset[0].get("anchor")
    if anchor:
        same_as_link = f"<{anchor}>; rel=\"owl:sameAs\""

    #As linkset is always a single list entry let's just make it syntacically easier to code!
    linkset = linkset[0]

    # Iterate over the linkset
    for entry in linkset:
        # Iterate over the links
        if isinstance(linkset[entry], list):
            # Handle special cases
            link_type = "gs1:" + entry.rsplit('/', 1)[-1]

            # Extract link information
            for link in linkset[entry]:
                href = link.get("href")
                title = link.get("title", "")
                type_ = link.get("type", "")
                hreflang = ", ".join(link.get("hreflang", []))

                # Create the compact link format
                link_str = f"<{href}>; rel=\"{link_type}\""
                if type_:
                    link_str += f"; type=\"{type_}\""
                if hreflang:
                    link_str += f"; hreflang=\"{hreflang}\""
                if title:
                    link_str += f"; title=\"{title}\""

                links.append(link_str)

    # Add owl:sameAs link to the end of the list, if present
    if same_as_link:
        links.append(same_as_link)

    return ", ".join(links)



# Example usage with the provided JSON dictionary
linkset = json.loads("""
[
    {
        "anchor": "https://id.gs1.org/01/09506000134376",
        "itemDescription": "Dal Giardino Medicinal Compound 50 x 200mg",
        "https://gs1.org/voc/defaultLink": [
            {
                "href": "https://dalgiardino.com/medicinal-compound/",
                "title": "Product information",
                "fwqs": true,
                "public": true
            }
        ],
        "https://gs1.org/voc/epil": [
            {
                "href": "https://dalgiardino.com/medicinal-compound/pil.html",
                "title": "Information for patients",
                "fwqs": true,
                "public": true,
                "type": "text/html",
                "hreflang": [
                    "en"
                ],
                "context": [
                    "xx"
                ]
            }
        ],
        "https://gs1.org/voc/pip": [
            {
                "href": "https://dalgiardino.com/medicinal-compound/",
                "title": "Product information",
                "fwqs": true,
                "public": true,
                "type": "text/html",
                "hreflang": [
                    "en"
                ]
            },
            {
                "href": "https://dalgiardino.com/medicinal-compound/index.html.ja",
                "title": "Product information",
                "fwqs": true,
                "public": true,
                "type": "text/html",
                "hreflang": [
                    "ja"
                ]
            },
            {
                "href": "https://dalgiardino.com/medicinal-compound/",
                "title": "Product information",
                "fwqs": true,
                "public": true,
                "type": "text/html",
                "hreflang": [
                    "en"
                ],
                "context": [
                    "xx"
                ]
            },
            {
                "href": "https://dalgiardino.com/medicinal-compound/index.html.ja",
                "title": "Product information",
                "fwqs": true,
                "public": true,
                "type": "text/html",
                "hreflang": [
                    "ja"
                ],
                "context": [
                    "xx"
                ]
            }
        ],
        "https://gs1.org/voc/defaultLinkMulti": [
            {
                "href": "https://dalgiardino.com/medicinal-compound/",
                "title": "Product information",
                "fwqs": true,
                "public": true,
                "type": "text/html",
                "hreflang": [
                    "en"
                ]
            },
            {
                "href": "https://dalgiardino.com/medicinal-compound/index.html.ja",
                "title": "Product information",
                "fwqs": true,
                "public": true,
                "type": "text/html",
                "hreflang": [
                    "ja"
                ]
            },
            {
                "href": "https://dalgiardino.com/medicinal-compound/",
                "title": "Product information",
                "fwqs": true,
                "public": true,
                "type": "text/html",
                "hreflang": [
                    "en"
                ]
            },
            {
                "href": "https://dalgiardino.com/medicinal-compound/index.html.ja",
                "title": "Product information",
                "fwqs": true,
                "public": true,
                "type": "text/html",
                "hreflang": [
                    "ja"
                ]
            }
        ]
    }
]
""")

print('original')
print('<https://dalgiardino.com/medicinal-compound/pil.html>; rel="gs1:epil"; type="text/html"; hreflang="en"; title="Information for patients", <https://dalgiardino.com/medicinal-compound/pil.html>; rel="gs1:epil"; type="text/html"; hreflang="en"; title="Information for patients", <https://dalgiardino.com/medicinal-compound/>; rel="gs1:pip"; type="text/html"; hreflang="en"; title="Product information", <https://dalgiardino.com/medicinal-compound/index.html.ja>; rel="gs1:pip"; type="text/html"; hreflang="ja"; title="Product information", <https://dalgiardino.com/medicinal-compound/>; rel="gs1:pip"; type="text/html"; hreflang="en"; title="Product information", <https://dalgiardino.com/medicinal-compound/index.html.ja>; rel="gs1:pip"; type="text/html"; hreflang="ja"; title="Product information", <https://id.gs1.org/01/09506000134376>; rel="owl:sameAs"')
print('\n\nllama3.1:70b second go')
text_output = author_compact_links_for_link_header(linkset)
print(text_output)
