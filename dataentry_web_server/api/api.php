<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 06/06/2018
 * Time: 10:33
 */
include_once 'ClassDBAccess.php';
include_once 'ClassGS1Keys.php';
include_once 'ClassMongoDB.php';
include_once 'ClassHealthCheck.php';
include_once 'ClassBuild.php';

$classDBAccess = new ClassDBAccess();
$classGS1Keys = new classGS1Keys();


header('Access-Control-Allow-Origin: *');
//$classDBAccess->logThis( '$_POST: ' . print_r($_POST, true));


//This API can accept command requests as either an HTTP POST (such as from a web browser XHR request)
//or from simple raw input in JSON format such as:
// { command: "my_api_command", parameter1name: "parameter1value", ... }

$result = array();

if(isset($_POST['resolver']))
{
    $resolver = json_decode($_POST['resolver']);
}
else
{
    $rawInput = file_get_contents('php://input');
    try
    {
        //DEBUG: $classDBAccess->logThis('$rawInput: ' . print_r($rawInput, true)) ;
        $resolver = json_decode($rawInput);
    }
    catch(Exception $e)
    {
        $classDBAccess->logThis( 'Input parse exception:' . print_r($e, true));
        $resolver = null;
    }
}
if(isset($resolver))
{
    if(!isset($resolver->command))
    {
        $result['STATUS'] = 'No command found in request!';
    }
    elseif ($resolver->command === 'version')
    {
        //Alter this as desired for end user clients to understand which version they are using:
        $result['apiversion'] = '1.0';
    }
    elseif ($resolver->command === 'get_gs1_key_components_list')
    {
        if(isset($resolver->gs1_key_code))
        {
            $gs1KeyCode = $resolver->gs1_key_code;
        }
        else
        {
            $gs1KeyCode = '';
        }
        $response = $classDBAccess->GetGS1KeyComponentsList($gs1KeyCode);
        $result['data_list'] = $response;
        $result['primary_key']['key_name'] = 'gs1_key_component_id';
        $result['api_update_command'] = 'update_gs1_key_components_list';
    }
    elseif ($resolver->command === 'get_iana_languages_list')
    {
        $jsonIanaLanguages = file_get_contents('iana_languages.json');
        $ianaLanguageList = json_decode($jsonIanaLanguages, true);
        $result['data_list'] = $ianaLanguageList;
        $result['primary_key']['key_name'] = '';
        $result['api_update_command'] = '';
    }
    elseif ($resolver->command === 'get_linktypes_list')
    {
        $response = $classDBAccess->GetLinkTypesList();
        $result['data_list'] = $response;
        $result['primary_key']['key_name'] = 'linktype_id';
        $result['api_update_command'] = 'update_linktypes_list';
    }
    elseif ($resolver->command === 'get_contexts_list')
    {
        $response = $classDBAccess->GetContextsList();
        $result['data_list'] = $response;
        $result['primary_key']['key_name'] = 'context_id';
        $result['api_update_command'] = 'update_contexts_list';
    }
    elseif ($resolver->command === 'get_mime_types_list')
    {
        $response = $classDBAccess->GetMimeTypesList();
        $result['data_list'] = $response;
        $result['primary_key']['key_name'] = 'mime_type_id';
        $result['api_update_command'] = 'update_mime_types_list';
    }
    elseif ($resolver->command === 'get_gs1_key_codes_list')
    {
        $result['data_list'] = $classGS1Keys->getGS1KeyCodesList();
        $result['primary_key']['key_name'] = 'gs1_key_code_id';
        $result['api_update_command'] = ''; //No updating possible as each GS1 Key is denoted by a class in this app
    }
    elseif ($resolver->command === 'get_gs1_mo_list')
    {
        $sessionId = $resolver->session_id;
        $result = $classDBAccess->GetGS1MOList($sessionId);
    }
    elseif ($resolver->command === 'check_gs1_key_value_integrity')
    {
        $sessionId = $resolver->session_id;
        $gs1KeyCode = $resolver->gs1_key_code;
        $gs1KeyValue = $resolver->gs1_key_value;
        $result = $classGS1Keys->testIntegrity($gs1KeyCode, $gs1KeyValue);
    }
    elseif ($resolver->command === 'get_member_list')
    {
        $sessionId = $resolver->session_id;
        $gs1MOPrimaryGln = $resolver->gs1_mo_primary_gln;
        $result = $classDBAccess->GetMemberListForGS1MO($sessionId, $gs1MOPrimaryGln);
    }
    elseif ($resolver->command === 'get_account_details')
    {
        $sessionId = $resolver->session_id;
        $accountId = $resolver->account_id;
        $result = $classDBAccess->GetAccountDetails($sessionId, $accountId);
    }
    elseif ($resolver->command === 'get_account_list')
    {
        $sessionId = $resolver->session_id;
        $memberPrimaryGln = $resolver->member_primary_gln;
        $result = $classDBAccess->GetAccountListForMember($sessionId, $memberPrimaryGln);
    }
    elseif ($resolver->command === 'get_uri_status')
    {
        $sessionId = $resolver->session_id;
        $uriRequestId = $resolver->uri_request_id;
        $result = $classDBAccess->GetRequestURIStatus($sessionId, $uriRequestId);
    }
    elseif ($resolver->command === 'get_uri_list')
    {
        $sessionId = $resolver->session_id;
        $firstLineNumber = $resolver->first_line_number;
        $maxNumberOfLines = $resolver->max_number_of_lines;
        $result = $classDBAccess->GetRequestURIs($sessionId, $firstLineNumber, $maxNumberOfLines);
    }
    elseif ($resolver->command === 'get_request_uri_data')
    {
        $sessionId = $resolver->session_id;
        $uri_request_id = $resolver->uri_request_id;
        $result = $classDBAccess->GetRequestURIForEdit($sessionId, $uri_request_id);
    }
    elseif ($resolver->command === 'get_response_uri_data')
    {
        $sessionId = $resolver->session_id;
        $uri_request_id = $resolver->uri_request_id;
        $result = $classDBAccess->GetResponseURIsForEdit($sessionId, $uri_request_id);
    }
    elseif ($resolver->command === 'login')
    {
        $result  = $classDBAccess->LoginAccount($resolver->email, $resolver->password);
        $ini = parse_ini_file('/var/www/config/api.ini');
        $result['resolver_endpoint_url'] = $ini['resolver_endpoint_url'];
    }
    elseif ($resolver->command === 'update_gs1_key_components_list')
    {
        $sessionId = $resolver->session_id;
        $primaryKeyValue = $resolver->primary_key_value;
        $gs1KeyCode = $resolver->gs1_key_code;
        $componentOrder = $resolver->component_order;
        $componentUriId = $resolver->component_uri_id;
        $componentName = $resolver->component_name;
        $acceptedFormats = $resolver->accepted_formats;

        if($primaryKeyValue === 'NEW')
        {
            $result = $classDBAccess->SaveNewGS1KeyComponent($sessionId, $gs1KeyCode, $componentOrder, $componentUriId,
                $componentName, $acceptedFormats);
        }
        else
        {
            $result = $classDBAccess->UpdateGS1KeyComponentsList($sessionId, $primaryKeyValue, $gs1KeyCode,
                $componentOrder, $componentUriId, $componentName, $acceptedFormats);
        }
    }
    elseif ($resolver->command === 'update_linktypes_list')
    {
        $sessionId = $resolver->session_id;
        $primaryKeyValue = $resolver->primary_key_value;
        $linkTypeName = $resolver->linktype_name;
        $linkTypeReferenceUrl = $resolver->linktype_reference_url;
        $applicableGS1KeyCode = $resolver->applicable_gs1_key_code;
        if($primaryKeyValue === 'NEW')
        {
            $result = $classDBAccess->SaveNewLinkType($sessionId, $linkTypeName, $linkTypeReferenceUrl,
                $applicableGS1KeyCode);
        }
        else
        {
            $result = $classDBAccess->UpdatelinkTypesList($sessionId, $primaryKeyValue, $linkTypeName,
                $linkTypeReferenceUrl, $applicableGS1KeyCode);
        }
    }
    elseif ($resolver->command === 'update_contexts_list')
    {
        $sessionId = $resolver->session_id;
        $primaryKeyValue = $resolver->primary_key_value;
        $contextValue = $resolver->context_value;
        $contextDescription = $resolver->description;
        $defaultContextFlag = $resolver->default_context_flag;
        if($primaryKeyValue === 'NEW')
        {
            $result = $classDBAccess->SaveNewContext($sessionId, $contextValue, $contextDescription,
                $defaultContextFlag);
        }
        else
        {
            $result = $classDBAccess->UpdateContextsList($sessionId, $primaryKeyValue, $contextValue,
                $contextDescription, $defaultContextFlag);
        }
    }
    elseif ($resolver->command === 'update_mime_types_list')
    {
        $sessionId = $resolver->session_id;
        $primaryKeyValue = $resolver->primary_key_value;
        $mime_typeValue = $resolver->mime_type_value;
        $mime_typeDescription = $resolver->description;
        $defaultMimeTypeFlag = $resolver->default_mime_type_flag;
        if($primaryKeyValue === 'NEW')
        {
            $result = $classDBAccess->SaveNewMimeType($sessionId, $mime_typeValue, $mime_typeDescription,
                $defaultMimeTypeFlag);
        }
        else
        {
            $result = $classDBAccess->UpdateMimeTypesList($sessionId, $primaryKeyValue, $mime_typeValue,
                $mime_typeDescription, $defaultMimeTypeFlag);
        }
    }
    elseif ($resolver->command === 'save_existing_uri_response')
    {
        $sessionId = $resolver->session_id;
        $responseId = $resolver->uri_response_id;
        $ianaLanguage = $resolver->iana_language;
        $linkType = $resolver->link_type;
        $destinationURI = $resolver->destination_uri;
        $friendlyLinkName = $resolver->friendly_link_name;
        $mimeType = $resolver->mime_type;
        $context = $resolver->context;
        $defaultLinkTypeFlag = interpretFlagValue($resolver->default_link_type);
        $defaultContextFlag = interpretFlagValue($resolver->default_context);
        $defaultIanaLanguageFlag = interpretFlagValue($resolver->default_iana_language);
        $defaultMimeTypeFlag = interpretFlagValue($resolver->default_mime_type);
        $activeFlag = interpretFlagValue($resolver->active);
        $fwqsFlag = interpretFlagValue($resolver->forward_request_querystrings);

        $result = $classDBAccess->SaveExistingUriResponse($sessionId, $responseId, $ianaLanguage, $linkType, $context,
            $mimeType, $destinationURI, $friendlyLinkName, $fwqsFlag, $activeFlag, $defaultLinkTypeFlag,
            $defaultIanaLanguageFlag, $defaultContextFlag, $defaultMimeTypeFlag);
    }
    elseif ($resolver->command === 'save_existing_uri_request')
    {
        $sessionId = $resolver->session_id;
        $requestId = $resolver->uri_request_id;
        $gs1KeyCode = $resolver->gs1_key_code;
        $gs1KeyValue = $resolver->gs1_key_value;
        $itemDescription = $resolver->item_description;
        $activeFlag = interpretFlagValue($resolver->active);

        $uriPrefix1 = $resolver->uri_prefix_1;
        $uriPrefix2 = $resolver->uri_prefix_2;
        $uriPrefix3 = $resolver->uri_prefix_3;
        $uriPrefix4 = $resolver->uri_prefix_4;

        $uriSuffix1 = $resolver->uri_suffix_1;
        $uriSuffix2 = $resolver->uri_suffix_2;
        $uriSuffix3 = $resolver->uri_suffix_3;
        $uriSuffix4 = $resolver->uri_suffix_4;

        $includeInSitemap = interpretFlagValue($resolver->include_in_sitemap);

        $resultArray = $classGS1Keys->testIntegrity($gs1KeyCode,$gs1KeyValue);

        if($resultArray['result_code'] === 0)
        {
            $result = $classDBAccess->SaveExistingURIRequest($sessionId, $requestId, $gs1KeyCode, $gs1KeyValue,
                $itemDescription, $uriPrefix1, $uriSuffix1, $uriPrefix2, $uriSuffix2, $uriPrefix3, $uriSuffix3,
                $uriPrefix4, $uriSuffix4, $includeInSitemap, $activeFlag);
        }
        else
        {
            $result['STATUS'] = 'NOT SAVED - ' . $resultArray['result_message'];
        }
    }
    elseif ($resolver->command === 'search_uri_requests')
    {
        $result = [];
        $sessionId = $resolver->session_id;
        $gs1KeyCode = $resolver->gs1_key_code;
        $gs1KeyValue = $resolver->gs1_key_value;
        if(startsWith(strtolower($gs1KeyCode), "search all")) // <- this value comes from UI provided with data entry service
        {
            $gs1KeyCode = "*"; //Asterisk means 'all'
        }
        if ($gs1KeyValue === '')
        {
            $gs1KeyValue = '*';
        }
        $result = $classDBAccess->SearchURIRequests($sessionId, $gs1KeyCode, $gs1KeyValue);
    }
    elseif ($resolver->command === 'save_new_gs1mo')
    {
        $sessionId = $resolver->session_id;
        $member_name = $resolver->organisation_name;
        $gs1mo_primary_gln = $resolver->gs1_mo_primary_gln;
        $result = $classDBAccess->SaveNewGS1MO($sessionId, $member_name, $gs1mo_primary_gln);
    }
    elseif ($resolver->command === 'save_account')
    {
        if(isset($resolver->account_id))
        {
            $accountId = $resolver->account_id;
        }
        else
        {
            $accountId = 0;
        }
        $sessionId = $resolver->session_id;
        $firstName = $resolver->firstname;
        $surname = $resolver->surname;
        $loginEmail = $resolver->email;
        $password = $resolver->password;
        $newPassword = $resolver->new_password;
        $accountNotes = $resolver->notes;
        $administrator = $resolver->admin_level;
        $memberPrimaryGLN = $resolver->member_primary_gln;
        $varType = gettype($resolver->active);
        $activeFlag = interpretFlagValue($resolver->active);

        $result = $classDBAccess->SaveAccountDetails($sessionId, $accountId, $firstName, $surname, $loginEmail,
            $password, $newPassword, $accountNotes, $administrator, $activeFlag, $memberPrimaryGLN);
    }
    elseif ($resolver->command === 'save_new_member')
    {
        $sessionId = $resolver->session_id;
        $member_name = $resolver->member_name;
        $member_primary_gln = $resolver->member_primary_gln;
        $gs1mo_primary_gln = $resolver->gs1_mo_primary_gln;
        $notes = $resolver->notes;
        $activeFlag = interpretFlagValue($resolver->active);
        $member_logo_url = $resolver->member_logo_url;

        $result = $classDBAccess->SaveNewMember($sessionId, $member_name, $member_primary_gln, $gs1mo_primary_gln,
            $notes, $activeFlag, $member_logo_url);
    }
    elseif ($resolver->command === 'save_new_uri_response')
    {
        $result2['STATUS'] = ' - (No defaults needed updating)';

        $sessionId = $resolver->session_id;
        $requestId = $resolver->uri_request_id;
        $ianaLanguage = $resolver->iana_language;
        $linkType = $resolver->linktype;
        $destinationURI = $resolver->destination_uri;
        $friendlyLinkName = $resolver->friendly_link_name;
        $mimeType = $resolver->mime_type;
        $context = $resolver->context;

        $defaultLinkTypeFlag = interpretFlagValue($resolver->default_link_type);
        $defaultContextFlag = interpretFlagValue($resolver->default_context);
        $defaultIanaLanguageFlag = interpretFlagValue($resolver->default_iana_language);
        $defaultMimeTypeFlag = interpretFlagValue($resolver->default_mime_type);
        $activeFlag = interpretFlagValue($resolver->active);
        $fwqsFlag = interpretFlagValue($resolver->forward_request_querystrings);

        $result = $classDBAccess->SaveNewUriResponse($sessionId, $requestId, $linkType, $ianaLanguage, $context,
            $mimeType, $friendlyLinkName, $destinationURI, $fwqsFlag, $activeFlag, $defaultLinkTypeFlag,
            $defaultIanaLanguageFlag, $defaultContextFlag, $defaultMimeTypeFlag);

        //Combine the two status outputs
        $result['STATUS'] .= $result2['STATUS'];
    }
    elseif ($resolver->command === 'delete_uri_response')
    {
        $sessionId = $resolver->session_id;
        $responseId = $resolver->uri_response_id;
        $result = $classDBAccess->DeleteURIResponse($sessionId, $responseId);
    }
    elseif ($resolver->command === 'delete_uri_request')
    {
        $sessionId = $resolver->session_id;
        $uriRequestId = $resolver->uri_request_id;
        $result = $classDBAccess->DeleteURIRequest($sessionId, $uriRequestId);
    }
    elseif ($resolver->command === 'new_uri_request')
    {
        $sessionId = $resolver->session_id;
        $result = $classDBAccess->CreateNewURIRequest($sessionId);
    }
    elseif ($resolver->command === 'build')
    {
        $ini = parse_ini_file('/var/www/config/api.ini');
        if(isset($resolver->build_auth_key) && $resolver->build_auth_key === $ini['build_auth_key'])
        {
            $classBuild = new ClassBuild();
            $result = $classBuild->Build();
        }
        else
        {
            $result['STATUS'] = "Incorrect auth key - build not allowed";
        }
    }
    elseif ($resolver->command === 'check')
    {
        $ini = parse_ini_file('/var/www/config/api.ini');
        if(isset($resolver->build_auth_key) && $resolver->build_auth_key === $ini['build_auth_key'])
        {
            $healthCheck = new ClassHealthCheck();
            $result = $healthCheck->PerformHealthCheck();
        }
        else
        {
            $result['STATUS'] = "Incorrect auth key - check not allowed";
        }
    }
    elseif ($resolver->command === 'mongodb_test')
    {
        $mongoDB = new ClassMongoDB();
        $result = $mongoDB->testMongoDBAccess();
    }
    elseif ($resolver->command === 'serverinfo')
    {
        require_once 'ClassServiceMetrics.php';
        $classMetrics = new ClassServiceMetrics();
        $result['hostname'] = gethostname();
        $result['server_datetime'] = date('Y-m-d H:i:s');
        $result['cpu_core_count'] = $classMetrics->api_system_cores();
        $result['current_system_load_percent'] = $classMetrics->api_system_load($result['cpu_core_count'], 1 );
        $result['current_http_connections'] = $classMetrics->api_http_connections();
        $result['memory_usage_percent'] = $classMetrics->api_server_memory_usage();
        $result['server_uptime'] = $classMetrics->api_server_uptime();
        $result['kernel_version'] = $classMetrics->api_kernel_version();
        $result['process_count'] = $classMetrics->api_number_processes();
    }
    else
    {
        $result['STATUS'] = "ERROR: Unknown Command '$resolver->command'";
    }
}
else
{
    $result['STATUS'] = 'Welcome to the GS1 Resolver UI API on machine-id ' . gethostname() ;
}

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

//Uncomment to watch the API in action through the log (but comment in production for security reasons):
#file_put_contents('php://stderr', 'API DEBUG: ' . print_r($result, true) . PHP_EOL);



/**
 * This function is used to take any incoming variable that is a flag, and return a uniform response of 1 for true or
 * 0 for false which is used with the SQL database which stores such flag values as tinyints with values 1 or 0.
 * @param $incomingFlag
 * @return int
 */
function interpretFlagValue($incomingFlag) : int
{
    $varType = gettype($incomingFlag);
    $outgoingFlag = 0;
    if($varType === 'string' && ($incomingFlag === '1' || strtolower($incomingFlag) === 'true' ||
            strtolower($incomingFlag) === 'yes' || strtolower($incomingFlag) === 'y'))
    {
        $outgoingFlag = 1;
    }
    elseif($varType === 'boolean' && $incomingFlag === true)
    {
        $outgoingFlag = 1;
    }
    elseif($varType === 'integer' && $incomingFlag === 1)
    {
        $outgoingFlag = 1;
    }
    return $outgoingFlag;
}

function startsWith($haystack, $needle)
{
    return (strpos($haystack, $needle) === 0);
}
