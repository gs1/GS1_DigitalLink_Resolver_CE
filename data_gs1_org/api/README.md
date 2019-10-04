#API Command-List
## Notes
This is a RESTful API that receives JSON formated request using either raw JSON or FORM POST.
For good examples of the API in action, look in the file /ui/resolver.js which holds the JavaScript for the data entry web app
and calls the API for all its functions.

### apiversion
##### Purpose:
Provides a numeric definition of the API's current version
##### Parameters:
* command: apiversion

### check_gs1_key_value_integrity
##### Purpose: 
Checks that the GS1 Key Value entered matches the format(s) allowd for that GS1 Key Code
##### Parameters:
* command: check_gs1_key_value_integrity
* session_id;
* gs1_key_code;
* gs1_key_value;
##### Returns:
* result_message; An HTML-compatible message describing the results of the test
* result_code:  0 (error) or 1 (OK)
* default_format: the API will correct a minor fault and retuen the correctd value in this variable

### delete_uri_response
##### Purpose: 
Delete a response destination entry
##### Parameters:
* command: delete_uri_response
* session_id: The current session key
* uri_response_id: The unique key for this response record
##### Returns:
* STATUS: An HTML-compatible message describing the results of the delete attempt

### get_account_details
##### Purpose: 
Retrieves account details for a logged in account
##### Parameters:
* command: get_account_details
* session_id
* account_id
* 
##### Returns:
An array with a single element:
* login_email
* firstname
* surname
* account_id
* account_notes
* administrator
* active

### get_account_list
##### Purpose: 
Returns a list of accounts belonging to a member (provided that the session links to an account authorised to reive such a list)
##### Parameters:
* command: get_account_list
* session_id
* member_primary_gln
##### Returns:
* account_id
* firstname
* surname

### get_contexts_list
##### Purpose: 
Returns a list of allowed contexts for this resolver
##### Parameters:
* command: get_contexts_list
##### Returns:
* A list of contexts as an array


### get_existing_iana_languages_for_request
##### Purpose: 
Returns a list of IANA languages already used by this request record, useful to highlight those langiages in a drop-down list, for example.
##### Parameters:
* command: get_existing_iana_languages_for_request
* session_id
* uri_request_id
##### Returns:
A list of existing IAN languages

### get_gs1_key_codes_list
##### Purpose: 
Returns a list of GS1 Key Codes (such as 'gtin', 'gln') allowed for use in this resolver
##### Parameters:
* command: get_gs1_key_codes_list
##### Returns:
A list of GS1 Key Codes

### get_gs1_key_components_list
##### Purpose: 
Returns  list of key componenets for a given gs1_key_code such as 'gtin'
##### Parameters:
* command: get_gs1_key_components_list
* gs1_key_code
##### Returns:
List of key components

### get_gs1_mo_list
##### Purpose: 
Returns a list GS1 member Organisations in the database if the session_id belongs to an account authorised to do so
##### Parameters:
* command: get_gs1_mo_list
* session_id
##### Returns:
List of GS1 MOS

### get_iana_languages_list
##### Purpose: 
Returns a list of IANA languages used by the Resolver
##### Parameters:
* command: get_iana_languages_list
##### Returns:
List of IANA languages

### get_linktypes_list
##### Purpose: 
Returns a list of linktypes (from the GS1 web vocabulary and others) used by the Resolver
##### Parameters:
* command: get_linktypes_list
##### Returns:
List of LinkTypes

### get_member_list
##### Purpose: 
Returns a list of members for a given GS1 MO, if the session_id belongs to an account authorised to do so
##### Parameters:
* command: get_member_list
* session_id
* gs1_mo_primary_gln
##### Returns:
A list of GS1 MOs

### get_mime_types_list
##### Purpose: 
Returns a list of MIME (document) types allowed by the resolver
##### Parameters:
* command: get_mime_types_list
##### Returns:
List of MIME types

### get_request_uri_data
##### Purpose: 
Retrieves the URI document for viewing and editing using the supplied uri_request_id (if the session_key belongs to an account authorised to do so)
##### Parameters:
* command: get_request_uri_data
* session_id
* uri_request_id
##### Returns:
Retuned as a single-element array:

* gs1_key_code
* gs1_key_value
* date_inserted
* date_last_updated
* item_description
* web_uri_prefix_1
* web_uri_suffix_1
* web_uri_prefix_2
* web_uri_suffix_2
* web_uri_prefix_3
* web_uri_suffix_3
* web_uri_prefix_4
* web_uri_suffix_4
* querystring
* active


### get_response_uri_data
##### Purpose: 
For a given request, returns all the response destinations currently stored
##### Parameters:
* command: get_response_uri_data
* session_id
* uri_request_id
* iana_language (optional)
##### Returns:
An array of the following elements (one row per response_uri):
* uri_response_id
* linktype
* default_linktype  (value 1 for true or 0 for false)
* friendly_link_name
* destination_uri
* mime_type
* default_mime_type (value 1 for true or 0 for false)
* context
* default_context  (value 1 for true or 0 for false)
* forward_request_querystrings  (value 1 for true or 0 for false)
* 

### get_uri_list
##### Purpose: 
Retrieves a list of resolver documents from the SQL database that this account is authorised to view and edit
##### Parameters:
* command: get_uri_list
* session_id
* first_line_number
* max_number_of_lines
##### Returns:
* gs1_key_code
* gs1_key_value
* item_description
* date_inserted
* date_last_updated
* api_builder_processed
* active

### get_uri_status
##### Purpose: 
Gets the current status of  particular uri request, is the session_id beloings to an account authorised to find out this infomration
##### Parameters:
* command: get_uri_status
* session_id
* uri_request_id
##### Returns:
* STATUS - HTML-compatible text describing the current status

### login
##### Purpose: 
Authorises an account to use the service
##### Parameters:
* command: login
* email
* passord
##### Returns:
* session_id - a randomly-generated string of characters that can be used to authoirse use of other commands with this value as an input parameter - OR - "LOGIN FAILED"

### new_uri_request
##### Purpose: 
Creates a new URI request entry with default values which can be retrived from the returned 'new_uri_request_id' value
##### Parameters:
* command: new_uri_request
* session_id
##### Returns:
* new_uri_request_id

### save_account
##### Purpose: 
Updates a user account with information. Not all info needs to be provided - the account will keep existing values for blank entries. For change password, you advised to help the user with an 'are you sure?' message. The 'password' parameter must have the existing password stored in the system.
##### Parameters:
* command: save_account
* session_id
* firstname
* surname
* email
* password
* new_password
* notes
* admin_level
* >member_primary_gln
* active

##### Returns:
STATUS - an HTML-compatible message indicating success or otherwise of the save action.


### save_existing_uri_request
##### Purpose: 
Updates the database ntry for an exsiting URI request with latest values
##### Parameters:
* command: save_existing_uri_request
* session_id
* uri_request_id
* gs1_key_code
* gs1_key_value
* item_description
* active
* uri_prefix_1
* uri_prefix_2
* uri_prefix_3
* uri_prefix_4
* uri_suffix_1
* uri_suffix_2
* uri_suffix_3
* uri_suffix_4
* include_in_sitemap

##### Returns:
* STATUS - An HTML-compatible message indicating the outcome of this action


### save_existing_uri_response
##### Purpose: 
Updates the database with an existing URI response record
##### Parameters:
* command: save_existing_uri_response
* session_id
* uri_response_id
* iana_language
* link_type
* destination_uri
* friendly_link_name
* mime_type
* contex
* default_link_type
* default_context
* default_iana_language
* default_mime_type
* active
* forward_request_querystrings

##### Returns:
* STATUS - An HTML-compatible message indicating the outcome of this action

### save_new_gs1mo
##### Purpose: 
Adds a new GS1 Member Organisation to the service (Global Admin authority only)
##### Parameters:
* command: save_new_gs1mo
* session_id
* organisation_name
* gs1_mo_primary_gln

##### Returns:
* STATUS - An HTML-compatible message indicating the outcome of this action

### save_new_member
##### Purpose: 
Adds a new GS1 Member Company to the service for the given GS1 MO (Globaland MO  Admin authority only)
##### Parameters:
* command: save_new_member
* session_id
* member_name
* member_primary_gln
* gs1_mo_primary_gln
* notes
* active
* member_logo_url

##### Returns:
* STATUS - An HTML-compatible message indicating the outcome of this action

### save_new_uri_response
##### Purpose: 
Adds a new response destination record to the databse for the given uri_request_id
##### Parameters:
* command: save_new_uri_response
* session_id
* uri_request_id
* iana_language
* link_type
* destination_uri
* friendly_link_name
* mime_type
* contex
* default_link_type
* default_context
* default_iana_language
* default_mime_type
* active
* forward_request_querystrings
##### Returns:
* STATUS - An HTML-compatible message indicating the outcome of this action

### search_uri_requests
##### Purpose: 
Searches the databse for  uri_requests matching the given parameters (note that item_descriptionsearching is not working at this time)
##### Parameters:
* command: search_uri_requests
* session_id
* gs1_key_value
* item_description;
##### Returns:
A list of request URIs matching the search

### serverinfo
##### Purpose: 
Checks the settings and performance of the API and its hosted server.
##### Parameters:
* command: serverinfo
A JSON list of server metrics.

