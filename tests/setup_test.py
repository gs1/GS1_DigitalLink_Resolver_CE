import unittest
import requests
import json


class APITestCase(unittest.TestCase):
    def setUp(self):
        self.resolver_url = 'http://localhost:8080'
        self.api_url = self.resolver_url + '/api'
        self.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer secret'
        }
        self.data_entry = [
              {
                "anchor": "/01/09506000134376",
                "itemDescription": "Dal Giardino Medicinal Compound 50 x 200mg Capsules",
                "defaultLinktype": "gs1:pip",
                "links": [
                  {
                    "linktype": "gs1:pip",
                    "href": "https://dalgiardino.com/medicinal-compound/pil.html",
                    "title": "Dal Giardino Medicinal Compound 50 x 200mg Capsules page on dalgiardino.com",
                    "type": "text/html",
                    "hreflang": [
                      "en"
                    ],
                    "context": [
                      "sales",
                      "marketing"
                    ]
                  }
                ]
              },
              {
                "anchor": "/01/09506000134376",
                "itemDescription": "Dal Giardino Medicinal Compound 50 x 200mg Capsules (serialized)",
                "defaultLinktype": "gs1:pip",
                "qualifiers": [
                  {
                    "21": "{serialnumber}"
                  }
                ],
                "links": [
                  {
                    "linktype": "gs1:pip",
                    "href": "https://dalgiardino.com/medicinal-compound/pil.html?serial={serialnumber}",
                    "title": "Serialised Dal Giardino Medicinal Compound 50 x 200mg Capsules page on dalgiardino.com",
                    "type": "text/html",
                    "hreflang": [
                      "en"
                    ],
                    "context": [
                      "sales",
                      "marketing"
                    ]
                  },
                  {
                    "linktype": "gs1:certificationInfo",
                    "href": "https://dalgiardino.com/medicinal-compound/product.html?serial={serialnumber}&cert=1",
                    "title": "Certificate 1 for serialised Dal Giardino Medicinal Compound 50 x 200mg Capsules product page on dalgiardino.com",
                    "type": "text/html",
                    "hreflang": [
                      "en"
                    ],
                    "context": [
                      "sales",
                      "marketing"
                    ]
                  }
                ]
              }
            ]

    def test_data_entry_CRUD_cycle(self):
        print('Running Create / Read / Update / Delete cycle test on data entry')

        print('To start test, first delete any existing entry with anchor /01/09506000134376')
        # First, make sure no such entry exists in the database
        response = requests.delete(self.api_url + '/01/09506000134376',
                                   headers=self.headers)

        # We want to make sure we get a 200 status code to denote that the entry was deleted
        # or a 404 status code to denote that the entry was not found
        self.assertIn(response.status_code, [200, 404], 'Create test (initial delete): '
                                                        'Server did not return 200 (OK) or 404 (Not Found) status code')

        print('Now create a new entry with anchor /01/09506000134376')
        # Now create the entry
        response = requests.post(self.api_url + "/new",
                                 headers=self.headers,
                                 data=json.dumps(self.data_entry))

        # Check that the status code is 200 (or other expected value)
        self.assertEqual(response.status_code, 201, 'Create test: '
                                                    'Server did not return 201 (Created) status code')

        # Or assert other things about the response, for example that the content is not empty
        self.assertNotEqual(response.content, '')

        print('Now read the entry with anchor /01/09506000134376')
        response = requests.get(self.api_url + '/01/09506000134376',
                                headers=self.headers)

        # Check that the status code is 200 (or other expected value)
        self.assertEqual(response.status_code, 200, 'Read test: '
                                                    'Server did not return 200 (OK) status code')

        # Or assert other things about the response, for example that the content is not empty
        self.assertNotEqual(response.content, '')

        # test if content matches expected content
        data_entry = json.loads(response.content)
        self.assertEqual(data_entry['data'], self.data_entry, 'Read test: '
                                                              'Data entry does not match expected data entry')

        print('Now find the entry with anchor /01/09506000134376 using the Resolver frontend web server')

        # let's find the entry using the Resolver frontend web server - we should get a 307 redirect to
        # web address: "https://dalgiardino.com/medicinal-compound/pil.html"
        gs1_digital_link = self.resolver_url + '/01/09506000134376'
        print('Requesting: ', gs1_digital_link)
        web_response = requests.get(gs1_digital_link, allow_redirects=False)  # important to prevent auto-redirect

        self.assertEqual(web_response.status_code, 307, 'Read test: '
                                                    'Frontend server did not return 307 (Temporary Redirect) status code')
        print(web_response.headers)
        self.assertEqual(web_response.headers['Location'], 'https://dalgiardino.com/medicinal-compound/pil.html',
                         'Link was not directed correctly')

        # let's do the same for the serialized entry - we should get a 307 redirect to:
        # "https://dalgiardino.com/medicinal-compound/pil.html?serial=HELLOWORLD"
        web_response = requests.get(self.resolver_url + '/01/09506000134376/21/HELLOWORLD', allow_redirects=False)
        self.assertEqual(web_response.status_code, 307, 'Read test: '
                                                    'Frontend server did not return 307 (Temporary Redirect) status code')
        self.assertEqual(web_response.headers['Location'], 'https://dalgiardino.com/medicinal-compound/pil.html?serial=HELLOWORLD',
                         'Link was not directed correctly with serial number')

        # Now let's get the JSON linkset for this entry -
        # both by requesting application/json and application/linkset+json
        for accept_type in ['application/json', 'application/linkset+json']:
            headers = self.headers.copy()
            headers['Accept'] = accept_type
            response = requests.get(self.api_url + '/01/09506000134376', headers=headers)
            self.assertEqual(response.status_code, 200, 'Read test: '
                                                        'Server did not return 200 (OK) status code')
            # self.assertEqual(response.headers['Content-Type'], accept_type, 'Response was not of type ' + accept_type)
            self.assertNotEqual(response.content, '', 'Response content was empty')
            linkset = json.loads(response.content)['data'][0]
            print('Linkset: ', linkset)
            self.assertEqual(linkset['anchor'], '/01/09506000134376', 'Linkset anchor does not match expected value')

        # UPDATE ####
        # UPDATE is buggy and needs working on in the API. For now use GET / DELETE / (update yourself) / POST
        # print('Now update the entry with anchor /01/09506000134376')


        print('Now delete the entry with anchor /01/09506000134376')
        response = requests.delete(self.api_url + '/01/09506000134376',
                                   headers=self.headers)

        # Check that the status code is 200 (or other expected value)
        self.assertEqual(response.status_code, 200, 'Delete test: '
                                                    'Server did not return 200 (OK) status code')

        # Or assert other things about the response, for example that the content is not empty
        self.assertNotEqual(response.content, '')

        # Now attempt to read the entry
        response = requests.get(self.api_url + '/01/09506000134376',
                                headers=self.headers)

        self.assertEqual(response.status_code, 404, 'Delete test: Server says entry was not deleted')

        print('Data entry CRUD cycle test completed successfully')


if __name__ == '__main__':
    unittest.main()
