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
        print('Flag DELETE_ENTRIES_ON_COMPLETION is set to:', DELETE_ENTRIES_ON_COMPLETION, 'so data entries will {}be kept in the database'.format('not ' if DELETE_ENTRIES_ON_COMPLETION else ''))

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

        #### UPDATE ENTRY (PUT) ####
        # The PUT endpoint performs an idempotent merge-update on an existing document.
        # Unlike POST (which creates a new document), PUT:
        #   1. Returns 404 if the document does not already exist.
        #   2. Preserves any fields you do not include in the payload (e.g. itemDescription, defaultLinktype).
        #   3. Merges links intelligently:
        #        - A link's identity is the combination of (linktype, hreflang, context).
        #        - If the payload contains a link whose (linktype, hreflang, context) already exists
        #          in the document, that existing link is updated with the new values (e.g. a new href or title).
        #        - If the combination is new, the link is appended to the document.
        #
        # We will demonstrate this with the variable-asset document /8004/095060001343 which was
        # created by POST earlier in this test. It currently has a single gs1:pip link.

        # --- Step 1: Add a brand-new link via PUT ---
        # We send a PUT with a gs1:epil link. Because no link with (gs1:epil, ["en"], ["sales","marketing"])
        # exists yet, the API will append it to the document's links list.
        print('\n---- PUT UPDATE TEST ----')
        print('Step 1: Add a new gs1:epil link to /8004/095060001343 via PUT')

        put_add_link_payload = {
            "anchor": "/8004/095060001343",
            "links": [
                {
                    "linktype": "gs1:epil",
                    "href": "https://dalgiardino.com/medicinal-compound/patient-leaflet",
                    "title": "Dal Giardino Medicinal Compound 50 x 200mg Capsules - Electronic Patient Information Leaflet",
                    "type": "text/html",
                    "hreflang": ["en"],
                    "context": ["sales", "marketing"]
                }
            ]
        }

        response = requests.put(self.api_url + '/8004/095060001343',
                                headers=self.headers,
                                data=json.dumps(put_add_link_payload))

        self.assertEqual(response.status_code, 200,
                         f'PUT (add link): expected 200, got {response.status_code}: {response.text}')
        print('  PUT returned 200 OK - new link added')

        # Read the document back to confirm both links are present and that the
        # original fields (itemDescription, defaultLinktype) were preserved.
        response = requests.get(self.api_url + '/8004/095060001343', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        updated_entry = response.json()['data']
        self.assertEqual(len(updated_entry), 1, 'Expected exactly one v3 entry')
        links_after_add = updated_entry[0]['links']

        self.assertEqual(len(links_after_add), 2,
                         f'Expected 2 links after adding gs1:epil, got {len(links_after_add)}')
        self.assertEqual(updated_entry[0]['itemDescription'], 'Dal Giardino Variable Asset',
                         'itemDescription should be preserved when not in PUT payload')
        self.assertEqual(updated_entry[0]['defaultLinktype'], 'gs1:pip',
                         'defaultLinktype should be preserved when not in PUT payload')

        link_types_present = [link['linktype'] for link in links_after_add]
        self.assertIn('gs1:pip', link_types_present, 'Original gs1:pip link should still be present')
        self.assertIn('gs1:epil', link_types_present, 'Newly added gs1:epil link should be present')
        print('  GET confirms: 2 links present, original fields preserved')

        # --- Step 2: Update the link we just added ---
        # We now send another PUT whose link has the same (linktype, hreflang, context) as the
        # gs1:epil link we just added - but with a different href and title.
        # Because the identity key matches, the API will update that link in-place rather than
        # creating a duplicate.
        print('Step 2: Update the gs1:epil link (change href and title) via PUT')

        put_update_link_payload = {
            "anchor": "/8004/095060001343",
            "links": [
                {
                    "linktype": "gs1:epil",
                    "href": "https://dalgiardino.com/medicinal-compound/new-path-to-leaflet",
                    "title": "Dal Giardino Medicinal Compound 50 x 200mg Capsules - Electronic Patient Information Leaflet (updated)",
                    "type": "text/html",
                    "hreflang": ["en"],
                    "context": ["sales", "marketing"]
                }
            ]
        }

        response = requests.put(self.api_url + '/8004/095060001343',
                                headers=self.headers,
                                data=json.dumps(put_update_link_payload))

        self.assertEqual(response.status_code, 200,
                         f'PUT (update link): expected 200, got {response.status_code}: {response.text}')
        print('  PUT returned 200 OK - existing link updated')

        # Read back and verify that:
        #   - The total number of links is still 2 (no duplicate was created).
        #   - The gs1:epil link's href and title reflect the updated values.
        #   - The gs1:pip link is completely unchanged.
        response = requests.get(self.api_url + '/8004/095060001343', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        updated_entry = response.json()['data']
        links_after_update = updated_entry[0]['links']

        self.assertEqual(len(links_after_update), 2,
                         f'Expected still 2 links after update (no duplicates), got {len(links_after_update)}')

        epil_link = next((l for l in links_after_update if l['linktype'] == 'gs1:epil'), None)
        self.assertIsNotNone(epil_link, 'gs1:epil link should still be present after update')
        self.assertEqual(epil_link['href'],
                         'https://dalgiardino.com/medicinal-compound/new-path-to-leaflet',
                         'gs1:epil href should reflect the updated value')
        self.assertEqual(epil_link['title'],
                         'Dal Giardino Medicinal Compound 50 x 200mg Capsules - Electronic Patient Information Leaflet (updated)',
                         'gs1:epil title should reflect the updated value')

        pip_link = next((l for l in links_after_update if l['linktype'] == 'gs1:pip'), None)
        self.assertIsNotNone(pip_link, 'gs1:pip link should be untouched by the update')
        self.assertEqual(pip_link['href'],
                         'https://dalgiardino.com/medicinal-compound/assets?giai=095060001343{1}',
                         'gs1:pip href should be unchanged')
        print('  GET confirms: gs1:epil updated, gs1:pip unchanged, no duplicates')

        # --- Step 3: Verify that PUT on a non-existent document returns 404 ---
        # PUT is strictly an update operation. If the document does not exist, the API must
        # return 404 - new documents can only be created via POST.
        print('Step 3: Confirm PUT on a non-existent anchor returns 404')

        response = requests.put(self.api_url + '/8004/000000000000',
                                headers=self.headers,
                                data=json.dumps({
                                    "anchor": "/8004/000000000000",
                                    "links": []
                                }))

        self.assertEqual(response.status_code, 404,
                         f'PUT on non-existent document: expected 404, got {response.status_code}: {response.text}')
        print('  PUT returned 404 Not Found as expected')

        print('---- PUT UPDATE TEST COMPLETE ----\n')

        #### DELETE LINK FROM DOCUMENT (DELETE with body) ####
        # The DELETE endpoint can also perform a partial delete: if you include a JSON body
        # with a 'links' list, the API will remove only the links that match by the
        # (linktype, hreflang, context) uniqueness key. The rest of the document is preserved.
        #
        # If you call DELETE without a body (as we did in the initial clean-up at the top of
        # this test), the entire document is deleted.
        #
        # Here we will undo the link we added in the PUT steps above by sending a DELETE
        # request whose body identifies the gs1:epil link.

        # After Step 2, the document has two links: gs1:pip and gs1:epil (updated).
        # We will remove the gs1:epil link and verify only gs1:pip remains.

        # --- Step 5: Remove a specific link using DELETE with a body ---
        print('---- DELETE LINK TEST ----')
        print('Step 5: Remove the gs1:epil link from /8004/095060001343 via DELETE with body')

        delete_link_payload = {
            "anchor": "/8004/095060001343",
            "links": [
                {
                    "linktype": "gs1:epil",
                    "href": "https://dalgiardino.com/medicinal-compound/new-path-to-leaflet",
                    "title": "Dal Giardino Medicinal Compound 50 x 200mg Capsules - Electronic Patient Information Leaflet (updated)",
                    "type": "text/html",
                    "hreflang": ["en"],
                    "context": ["sales", "marketing"]
                }
            ]
        }

        response = requests.delete(self.api_url + '/8004/095060001343',
                                   headers=self.headers,
                                   data=json.dumps(delete_link_payload))

        self.assertEqual(response.status_code, 200,
                         f'DELETE (remove link): expected 200, got {response.status_code}: {response.text}')
        print('  DELETE returned 200 OK - link removed')

        # Read back and verify that the gs1:epil link has been removed while gs1:pip remains.
        response = requests.get(self.api_url + '/8004/095060001343', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        after_delete = response.json()['data']
        links_after_delete = after_delete[0]['links']

        self.assertEqual(len(links_after_delete), 1,
                         f'Expected 1 link after deleting gs1:epil, got {len(links_after_delete)}')
        self.assertEqual(links_after_delete[0]['linktype'], 'gs1:pip',
                         'The remaining link should be the original gs1:pip')
        self.assertEqual(after_delete[0]['itemDescription'], 'Dal Giardino Variable Asset',
                         'itemDescription should be preserved after partial delete')
        self.assertEqual(after_delete[0]['defaultLinktype'], 'gs1:pip',
                         'defaultLinktype should be preserved after partial delete')
        print('  GET confirms: gs1:epil removed, gs1:pip and all other fields preserved')

        # --- Step 6: DELETE with body on a non-existent link returns 404 ---
        # If the link we try to remove does not exist in the document, the API returns 404.
        print('Step 6: Confirm DELETE with body returns 404 when link is not found')

        response = requests.delete(self.api_url + '/8004/095060001343',
                                   headers=self.headers,
                                   data=json.dumps({
                                       "anchor": "/8004/095060001343",
                                       "links": [
                                           {
                                               "linktype": "gs1:nonExistent",
                                               "hreflang": ["en"],
                                               "context": ["sales"]
                                           }
                                       ]
                                   }))

        self.assertEqual(response.status_code, 404,
                         f'DELETE non-existent link: expected 404, got {response.status_code}: {response.text}')
        print('  DELETE returned 404 as expected - no matching link to remove')

        # --- Step 7: DELETE without a body still deletes the whole document ---
        # Verify the original whole-document delete behaviour is preserved.
        print('Step 7: Confirm DELETE without body still removes the entire document')

        response = requests.delete(self.api_url + '/8004/095060001343', headers=self.headers)
        self.assertEqual(response.status_code, 200,
                         f'DELETE (whole doc): expected 200, got {response.status_code}: {response.text}')

        response = requests.get(self.api_url + '/8004/095060001343', headers=self.headers)
        self.assertEqual(response.status_code, 404,
                         'GET after full DELETE should return 404')
        print('  Document fully deleted, GET returns 404')

        # --- Restore the document for any subsequent tests ---
        print('Step 8: Restoring /8004/095060001343 to its original state')
        original_doc = {
            "anchor": "/8004/095060001343",
            "itemDescription": "Dal Giardino Variable Asset",
            "defaultLinktype": "gs1:pip",
            "links": [
                {
                    "linktype": "gs1:pip",
                    "href": "https://dalgiardino.com/medicinal-compound/assets?giai=095060001343{1}",
                    "title": "Dal Giardino Medicinal Compound 50 x 200mg Capsules as a variable asset",
                    "type": "text/html",
                    "hreflang": ["en"],
                    "context": ["sales", "marketing"]
                }
            ]
        }
        response = requests.post(self.api_url + '/new', headers=self.headers, data=json.dumps(original_doc))
        self.assertIn(response.status_code, [200, 201], 'Clean-up: failed to restore original document')
        print('  Document restored to original state')

        print('---- DELETE LINK TEST COMPLETE ----\n')

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


    def test_put_update_document(self):
        """Test that PUT performs an idempotent merge-update, not a re-creation."""
        print('Running PUT idempotent update test')

        base_doc = {
            "anchor": "/8004/095060001343",
            "itemDescription": "Dal Giardino Variable Asset",
            "defaultLinktype": "gs1:pip",
            "links": [
                {
                    "linktype": "gs1:pip",
                    "href": "https://dalgiardino.com/medicinal-compound/assets?giai=095060001343{1}",
                    "title": "Dal Giardino Medicinal Compound 50 x 200mg Capsules as a variable asset",
                    "type": "text/html",
                    "hreflang": ["en"],
                    "context": ["sales", "marketing"]
                }
            ]
        }

        # Clean slate: delete then create
        requests.delete(self.api_url + '/8004/095060001343', headers=self.headers)
        resp = requests.post(self.api_url + '/new', headers=self.headers, data=json.dumps(base_doc))
        self.assertIn(resp.status_code, [200, 201], 'Setup: could not create base document')

        # ---- 1. PUT adds a new link (different linktype) ----
        put_add = {
            "anchor": "/8004/095060001343",
            "links": [
                {
                    "linktype": "gs1:epil",
                    "href": "https://dalgiardino.com/medicinal-compound/patient-leaflet",
                    "title": "Electronic Patient Information Leaflet",
                    "type": "text/html",
                    "hreflang": ["en"],
                    "context": ["sales", "marketing"]
                }
            ]
        }
        resp = requests.put(self.api_url + '/8004/095060001343',
                            headers=self.headers, data=json.dumps(put_add))
        self.assertEqual(resp.status_code, 200,
                         f'PUT (add link) expected 200, got {resp.status_code}: {resp.text}')

        # Verify via GET
        resp = requests.get(self.api_url + '/8004/095060001343', headers=self.headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        self.assertEqual(len(data), 1, 'Expected exactly 1 v3 entry')
        links = data[0]['links']
        self.assertEqual(len(links), 2, f'Expected 2 links after add, got {len(links)}')

        # Existing fields preserved
        self.assertEqual(data[0]['itemDescription'], 'Dal Giardino Variable Asset')
        self.assertEqual(data[0]['defaultLinktype'], 'gs1:pip')

        linktypes = [l['linktype'] for l in links]
        self.assertIn('gs1:pip', linktypes, 'Original gs1:pip link missing')
        self.assertIn('gs1:epil', linktypes, 'New gs1:epil link not added')

        # ---- 2. PUT updates an existing link (same linktype+hreflang+context) ----
        put_update = {
            "anchor": "/8004/095060001343",
            "links": [
                {
                    "linktype": "gs1:epil",
                    "href": "https://dalgiardino.com/medicinal-compound/new-path-to-leaflet",
                    "title": "Updated Leaflet Title",
                    "type": "text/html",
                    "hreflang": ["en"],
                    "context": ["sales", "marketing"]
                }
            ]
        }
        resp = requests.put(self.api_url + '/8004/095060001343',
                            headers=self.headers, data=json.dumps(put_update))
        self.assertEqual(resp.status_code, 200,
                         f'PUT (update link) expected 200, got {resp.status_code}: {resp.text}')

        # Verify via GET
        resp = requests.get(self.api_url + '/8004/095060001343', headers=self.headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        links = data[0]['links']
        self.assertEqual(len(links), 2, f'Expected still 2 links after update, got {len(links)}')

        epil = next((l for l in links if l['linktype'] == 'gs1:epil'), None)
        self.assertIsNotNone(epil, 'gs1:epil link missing after update')
        self.assertEqual(epil['href'],
                         'https://dalgiardino.com/medicinal-compound/new-path-to-leaflet',
                         'href not updated')
        self.assertEqual(epil['title'], 'Updated Leaflet Title', 'title not updated')

        pip = next((l for l in links if l['linktype'] == 'gs1:pip'), None)
        self.assertIsNotNone(pip, 'gs1:pip link should be unchanged')
        self.assertEqual(pip['href'],
                         'https://dalgiardino.com/medicinal-compound/assets?giai=095060001343{1}',
                         'gs1:pip href should be unchanged')

        # ---- 3. PUT on a non-existent document returns 404 ----
        resp = requests.put(self.api_url + '/8004/000000000000',
                            headers=self.headers,
                            data=json.dumps({"anchor": "/8004/000000000000", "links": []}))
        self.assertEqual(resp.status_code, 404,
                         f'PUT on missing doc expected 404, got {resp.status_code}: {resp.text}')

        print('PUT idempotent update test completed successfully')


if __name__ == '__main__':
    unittest.main()
