import unittest
import requests
import json
import os


class APITestCase(unittest.TestCase):
    def setUp(self):
        self.resolver_url = 'http://localhost:8080'
        self.api_url = self.resolver_url + '/api'
        self.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer secret'
        }
        self.data_entries = []

        # Create a list of data entries to test from files starting with 'test_' and ending '.json'
        for file in os.listdir('.'):
            if file.startswith('test_') and file.endswith('.json'):
                with open(file, 'r') as f:
                    self.data_entries.append(json.load(f))

    def test_data_entry_CRUD_cycle(self):
        print('Running Create / Read / Update / Delete cycle test on data entry')
        # Welcome to this test script. Its aim is to test the CRUD cycle of a data entry in the Resolver database.
        # It will also walk you through the features and behaviours of the Resolver API and its frontend server.
        # if you want to keep the data entries in Mongo DB at the wnd of the test, set this flag to False:
        DELETE_ENTRIES_ON_COMPLETION = False

        #### INITIAL DELETES TO START THE TEST ####
        for entry in self.data_entries:
            # First, make sure no such entry exists in the database
            if isinstance(entry, list):
                print('Initially delete the entry with anchor', entry[0]['anchor'], 'using DELETE /entry')
                response = requests.delete(self.api_url + entry[0]['anchor'], headers=self.headers)
            else:
                print('Initially delete the entry with anchor', entry['anchor'], 'using DELETE /entry')
                response = requests.delete(self.api_url + entry['anchor'], headers=self.headers)

            # We want to make sure we get a 200 status code to denote that the entry was deleted
            # or a 404 status code to denote that the entry was not found (and therefore not deleted)
            self.assertIn(response.status_code, [200, 404], 'Create test (initial delete): '
                                                            'Server did not return 200 (OK) or 404 (Not Found) status code')

        #### CREATE ENTRIES ####
        for entry in self.data_entries:
            if not isinstance(entry, list):
                entry = [entry]

            for e in entry:
                print('Now create the entry with anchor', e['anchor'], 'using POST /new')

                # Now create the entry
                response = requests.post(self.api_url + "/new",
                                         headers=self.headers,
                                         data=json.dumps(e))

                # Check that the status code is 200 or 201
                assert response.status_code in [200,
                                                201], (f'Create test: Server returned {response.status_code} instead of'
                                                       ' 200 (OK) or 201 (Created) status code')

                # Or assert other things about the response, for example that the content is not empty
                self.assertNotEqual(response.content, '')

        #### READ ENTRIES ####
        for entry in self.data_entries:
            if not isinstance(entry, list):
                entry = [entry]

            for e in entry:
                print('Now read the entry with anchor', e['anchor'])
                response = requests.get(self.api_url + e['anchor'],
                                        headers=self.headers)

                # Check that the status code is 200 (or other expected value)
                self.assertEqual(response.status_code, 200, 'Read test: '
                                                            'Server did not return 200 (OK) status code')

                # Or assert other things about the response, for example that the content is not empty
                self.assertNotEqual(response.content, '', 'Read test: Server returned empty response')

                # test if content matches expected content
                data_entry = json.loads(response.content)
                self.assertEqual(data_entry['data'], entry, 'Read test: Data entry does not match expected data entry')

        #### FIND ENTRIES USING THE RESOLVER FRONTEND SERVER ####
        # let's find the same entry using the Resolver frontend web server - we should get a 307 redirect to
        # web address: "https://dalgiardino.com/medicinal-compound/pil.html" which we can check for
        print('Now find the entry with anchor /01/09506000134376 using the Resolver frontend web server')
        gs1_digital_link = self.resolver_url + '/01/09506000134376'
        print('Requesting: ', gs1_digital_link)
        web_response = requests.get(gs1_digital_link, allow_redirects=False)  # important to prevent auto-redirect

        self.assertEqual(web_response.status_code, 307, 'Read test: '
                                                        f'Frontend server did not return 307 (Temporary Redirect) status code, instead sending HTTP {web_response.status_code}')
        self.assertEqual(web_response.headers['Location'], 'https://dalgiardino.com/medicinal-compound/pil.html',
                         'Link was not directed correctly')

        # let's do the same for the serialised entry - we should get a 307 redirect to:
        # "https://dalgiardino.com/medicinal-compound/pil.html?serial=HELLOWORLD"
        print('Now find the serialised entry /01/09506000134376/21/HELLOWORLD using the Resolver frontend web server')
        web_response = requests.get(self.resolver_url + '/01/09506000134376/21/HELLOWORLD', allow_redirects=False)
        self.assertEqual(web_response.status_code, 307, 'Read test: '
                                                        'Frontend server did not return 307 (Temporary Redirect) status code')
        self.assertEqual(web_response.headers['Location'],
                         'https://dalgiardino.com/medicinal-compound/pil.html?serial=HELLOWORLD',
                         'Link was not directed correctly with serial number')

        # let's do the same for the lot numbered entry - we should get a 307 redirect to:
        # "https://dalgiardino.com/medicinal-compound/pil.html?lot=LOT01"
        print('Now find the lot numbered entry /01/09506000134376/10/LOT01 using the Resolver frontend web server')
        web_response = requests.get(self.resolver_url + '/01/09506000134376/10/LOT01', allow_redirects=False)
        self.assertEqual(web_response.status_code, 307, 'Read test: '
                                                        'Frontend server did not return 307 (Temporary Redirect) status code')
        self.assertEqual(web_response.headers['Location'],
                         'https://dalgiardino.com/medicinal-compound/pil.html?lot=LOT01',
                         'Link was not directed correctly with lot number')

        # Let's compress this GS1 Digital Link /01/09506000134376/10/LOT01
        # ...which compressed is: /ARFKk4XB0CDKWcnpq
        print('Now compress this GS1 Digital Link /01/09506000134376/10/LOT01 using the Resolver frontend web server')
        web_response = requests.get(self.resolver_url + '/01/09506000134376/10/LOT01?compress=true',
                                    allow_redirects=False)
        self.assertEqual(web_response.status_code, 200, 'Read test: Frontend server did not return 200 (OK)')

        # we will take the response.content, convert from JSON to dictionary and remove the value of 'data' key
        # then we will compare the result with the expected value:
        compressed_link = json.loads(web_response.content)['COMPRESSED_LINK']
        self.assertEqual(compressed_link, '/ARFKk4XB0CDKWcnpq',
                         'Link was not compressed correctly, instead returned was:' + compressed_link)

        # Now let's call the web server using the compressed version of this GS1 Digital Link:
        print('Now find compressed entry using the Resolver frontend web server')
        web_response = requests.get(self.resolver_url + compressed_link, allow_redirects=False)
        self.assertEqual(web_response.status_code, 307, 'Read test: '
                                                        'Frontend server did not return 307 (Temporary Redirect) status code')
        self.assertEqual(web_response.headers['Location'],
                         'https://dalgiardino.com/medicinal-compound/pil.html?lot=LOT01',
                         'Link was not directed correctly with lot number')

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
            self.assertEqual(linkset['anchor'], '/01/09506000134376', 'Linkset anchor does not match expected value')
            self.assertEqual(linkset['itemDescription'], 'Dal Giardino Medicinal Compound 50 x 200mg Capsules',
                             'Linkset anchor does not match expected value')

        # Now we test the same entry with different linktypes and languages.
        # The test data for GTIN 09506000134352 has links in three linktypes and four languages, Those links
        # deliberately end with the linktype and language included in the URL, so we can check that the correct
        # link is returned by the Resolver frontend server. Example ending is: '?test_lt=gs1:recipeInfo&test_lang=en'
        for linktype in ['gs1:hasRetailers', 'gs1:pip', 'gs1:recipeInfo', 'gs1:sustainabilityInfo']:
            for language in ['en', 'es', 'vi', 'ja']:
                print('Now find the entry with anchor /01/09506000134352 using the Resolver frontend web server')
                print('that has Linktype:', linktype, ' and Language:', language)
                headers = self.headers.copy()
                headers['Accept-Language'] = language
                headers['Accept'] = '*/*'
                web_response = requests.get(self.resolver_url + '/01/09506000134352?linktype=' + linktype,
                                            allow_redirects=False, headers=headers)
                wanted_test_linktype = f'test_lt={linktype}'
                wanted_test_language = f'test_lang={language}'
                self.assertEqual(web_response.status_code, 307,
                                 'Read test: Frontend server did not return 307 (Temporary Redirect) status code')
                self.assertTrue(wanted_test_linktype in web_response.headers['Location'],
                                f'Location link was "{web_response.headers["Location"]}" and so did not include "{wanted_test_linktype}"')
                self.assertTrue(wanted_test_language in web_response.headers['Location'],
                                f'Location link was "{web_response.headers["Location"]}" and so did not include "{wanted_test_language}"')

        # For this language test we will use the 'Accept-Language' header to request the language in a way that is more
        # realistic for web browsers, which request several languages in the 'Accept-Language' header. The Resolver
        # frontend server should return the link in the language that is most preferred by the web browser.
        # For this test, 'Accept-Language' header is set to three variations of typical Accept-Language values.
        # For example 'en-GB,en;q=0.9,en-US;q=0.8,en-IE;q=0.7' which is interpreted as:
        #     'en-GB' is most preferred, then 'en', then 'en-US', then 'en-IE'.
        # GTIN 09506000134376 has 'gs1:registerProduct' links separately for 'en-US', 'en-IE' and
        # ('en-GB' and 'en' combined).
        # At the end of each link is '?register=en-GB', '?register=en-US', '?register=en-IE'.
        # This test will check that the Resolver frontend server returns the correct link for the
        # most preferred language.
        # Note that the last test is a negative test, where the 'Accept-Language' header does not include 'en-??'
        # instead it includes 'fr-??' and so the Resolver frontend server should return the 'en-GB' link because it
        # is the first link in the list of links for gs1:registerProduct. This is an example of the Resolver
        # frontend server returning the default language link when the requested language is not available.
        # UPDATE: Not the en-IE test which has 'q' values in every entry. Resolver should be removing these
        #         as otherwise matching will fail, as no language entries should have 'q' values.
        #         See: https://github.com/gs1/GS1_DigitalLink_Resolver_CE/issues/97

        language_tests = [
            {'accept-language': 'en-GB,en;q=0.9,en-US;q=0.8,en-IE;q=0.7', 'expected': 'en-GB'},
            {'accept-language': 'en,en-US;q=0.8,en-IE;q=0.7', 'expected': 'en-GB'},
            {'accept-language': 'en-US,en;q=0.9,en-GB;q=0.8,en-IE;q=0.7', 'expected': 'en-US'},
            {'accept-language': 'en-IE;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6', 'expected': 'en-IE'},
            {'accept-language': 'fr-BE,fr-FR;q=0.8,fr;q=0.7', 'expected': 'non-English'}
        ]

        for test in language_tests:
            print('Now find the entry with anchor /01/09506000134376 using the Resolver frontend web server')
            print('that has Linktype: gs1:registerProduct and "Accept-Language" header: ' + test['accept-language'])

            headers = self.headers.copy()
            headers['Accept-Language'] = test['accept-language']
            headers['Accept'] = '*/*'

            expected_href_register_querystring = f'register={test["expected"]}'

            web_response = requests.get(self.resolver_url + '/01/09506000134376?linktype=gs1:registerProduct',
                                        allow_redirects=False, headers=headers)

            self.assertEqual(web_response.status_code, 307, 'Read test: '
                                                            'Frontend server did not return 307 ' +
                                                            '(Temporary Redirect) status code for header: ' +
                                                            test['accept-language'] + ' instead returned ' +
                                                            str(web_response.status_code) + ' status code' +
                                                            ' with content: ' + json.dumps(json.loads(web_response.content.decode('utf-8')), indent=2))

            self.assertTrue(expected_href_register_querystring in web_response.headers['Location'],
                             f'Location link "{web_response.headers["Location"]}" is not "{expected_href_register_querystring}"'
                             f' for request header: {test["accept-language"]}')


        # At this point we should take a moment to send a request that is not in GS1 Digital Link format just to check
        # that the server returns an HTTP 400 Bad Request. To do this we'll send '/01/09506000134376/badrequest' which
        # is clearly not in GS1 Digital Link format!
        print('BAD GS1 Digital Link Request /01/09506000134376/badrequest using the Resolver frontend web server')
        web_response = requests.get(self.resolver_url + '/01/09506000134376/badrequest', allow_redirects=False)
        self.assertEqual(web_response.status_code, 400, 'Bad GS1 Digital Link test: Server should have responded with Bad Request status code')


        # This next test is a change to Resolver's behaviour compared to previous versions. If a request asks for a
        # linktype that is not available in the linkset, the Resolver frontend server should return a 404 status code.
        # In previous versions, the Resolver frontend server would return the default Link in the linkset. It is now
        # considered incorrect to send back something you didn't ask for, or is irrelevant to the request.
        print('Request linktype gs1:safetyInfo /01/09506000134376 using the Resolver frontend web server')
        web_response = requests.get(self.resolver_url + '/01/09506000134376?linktype=gs1:safetyInfo',
                                    allow_redirects=False)
        self.assertEqual(web_response.status_code, 404, 'Read test: '
                                                        'Frontend server did not return 404 (Not Found) status code')

        # This next test is a change to Resolver's behaviour compared to previous versions. The uploaded linkset
        # can include multiple links for the same linktype and language, context and mimetype whereas before only one
        # link could ever be stored. In our test data we have three gs1:certificationInfo entries for GTIN
        # 09506000134376 which has a lot number, with the same type ('text/html') and language ('en')
        # The Resolver frontend server should return a 300 status.

        # But let's test it works and returns an HTTP 300 (Multiple Links) status code.
        print(
            'HTTP 300 test - Request linktype gs1:certificationInfo /01/09506000134376/10/LOT01 using the Resolver frontend web server')
        web_response = requests.get(self.resolver_url + '/01/09506000134376/10/LOT01?linktype=gs1:certificationInfo',
                                    allow_redirects=False)
        self.assertEqual(300, web_response.status_code, 'Read test: '
                                                        'Frontend server did not return 300 (Multiple Links) status code')
        response_300 = web_response.json()
        self.assertIn('linkset', response_300, 'Read test: Response did not contain "linkset" key')
        self.assertEqual(len(response_300['linkset']), 3,
                         'Read test: Response did not contain three links in the linkset')

        if len(response_300['linkset']) > 0:
            self.assertEqual(response_300['linkset'][0]['href'],
                             'https://dalgiardino.com/medicinal-compound/certificate_1?lot=LOT01',
                             'Read test: First link in the linkset did not match expected value for certificate 1')
        if len(response_300['linkset']) > 1:
            self.assertEqual(response_300['linkset'][1]['href'],
                             'https://dalgiardino.com/medicinal-compound/certificate_2?lot=LOT01',
                             'Read test: Second link in the linkset did not match expected value for certificate 2')
        if len(response_300['linkset']) > 2:
            self.assertEqual(response_300['linkset'][2]['href'],
                             'https://dalgiardino.com/medicinal-compound/certificate_3?lot=LOT01',
                             'Read test: Third link in the linkset did not match expected value for certificate 3')

        # let's find fixed asset 8004 entry - we should get a 307 redirect to:
        # "https://dalgiardino.com/medicinal-compound/assets/8004/0950600013430000001.html"
        print('Now find the fixed asset /8004/0950600013430000001 using the Resolver frontend web server')
        web_response = requests.get(self.resolver_url + '/8004/0950600013430000001', allow_redirects=False)
        self.assertEqual(web_response.status_code, 307, 'Read test: '
                                                        'Frontend server did not return 307 (Temporary Redirect) status code')
        self.assertEqual(web_response.headers['Location'],
                         'https://dalgiardino.com/medicinal-compound/assets/8004/0950600013430000001.html',
                         'Link was not directed correctly with fixed asset number')

        # let's do the same for the variable asset 8004 entry - we should get a 307 redirect to:
        # "https://dalgiardino.com/medicinal-compound/assets?giai=095060001343999999"
        print('Now find the variable asset /8004/095060001343999999 using the Resolver frontend web server')
        web_response = requests.get(self.resolver_url + '/8004/095060001343999999', allow_redirects=False)
        self.assertEqual(web_response.status_code, 307, 'Read test: '
                                                        'Frontend server did not return 307 (Temporary Redirect) status code')
        print('Location:', web_response.headers['Location'])
        self.assertEqual(web_response.headers['Location'],
                         'https://dalgiardino.com/medicinal-compound/assets?giai=095060001343999999',
                         'Link was not directed correctly with variable asset number')

        #### UPDATE ENTRY ####
        # UPDATE is buggy and needs working on in the API. For now use GET / DELETE / (update yourself) / POST
        # print('Now update the entry with anchor /01/09506000134376')

        #### DELETE ENTRIES ####
        if DELETE_ENTRIES_ON_COMPLETION:
            for entry in self.data_entries:
                # First, make sure no such entry exists in the database
                if isinstance(entry, list):
                    print('delete the entry with anchor', entry[0]['anchor'], 'using DELETE /entry')
                    response = requests.delete(self.api_url + entry[0]['anchor'], headers=self.headers)
                else:
                    print('delete the entry with anchor', entry['anchor'], 'using DELETE /entry')
                    response = requests.delete(self.api_url + entry['anchor'], headers=self.headers)

                # We want to make sure we get a 200 status code to denote that the entry was deleted
                # or a 404 status code to denote that the entry was not found (and therefore not deleted)
                self.assertIn(response.status_code, [200, 404], 'Create test (initial delete): '
                                                                'Server did not return 200 (OK) or 404 (Not Found) status code')

            print('Data entry CRUD cycle test completed successfully - all data entries deleted from the database')
        else:
            print('Data entry CRUD cycle test completed successfully - data remains in the database')


if __name__ == '__main__':
    unittest.main()
