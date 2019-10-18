<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 2018-11-27
 * Time: 09:42
 */
require_once 'ClassMongoDB.php';
require_once 'ClassHTMLPageBuilder.php';
require_once 'ClassGS1DigitalLink.php';
require_once 'ClassAITable.php';

$classMongoDB = new ClassMongoDB();

//Here we can quickly kill off common request that have nothing to do with the resolver:
if($_SERVER['REQUEST_URI'] === '/favicon.ico')
{
    $name = '/var/www/resolver/favicon.ico';
    $fp = fopen($name, 'rb');

    // send the right headers
    header("Content-Type: image/png");
    header("Content-Length: " . filesize($name));

    // dump the picture and stop the script
    fpassthru($fp);
    exit;
}

//
elseif(strpos($_SERVER['REQUEST_URI'], '/.well-known') !== false)
{
    $wellKnown = $classMongoDB->readWellKnownRecord();
    if($wellKnown !== null)
    {
        header('Content-Type: application/json');
        header($_SERVER['SERVER_PROTOCOL'] . ' 200 OK');
        echo json_encode($wellKnown, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        error_log('WellKnown Record Sent Successfully');
    }
    else
    {
        header($_SERVER['SERVER_PROTOCOL'] . ' 404 Not Found');
        error_log('WellKnown Record FAILED to be Sent due to DB error');
    }
    die();
}

//the 'distance' from the web root of the web server the GS1 key will exist at in the array $requestComponents
//1 for actual web root, 3 often for development!
$urlCountFromRoot = 1;
$contextRequired = 'xx';
$ianaLanguageRequired = 'xx';

//Find incoming language from client application, if available
if (isset($_SERVER['HTTP_ACCEPT_LANGUAGE']))
{
    $incomingLanguageTerritory = locale_accept_from_http($_SERVER['HTTP_ACCEPT_LANGUAGE']);
    if(trim($incomingLanguageTerritory) === '')
    {
        //The PHP function locale_accept_from_http() has removed everything from the language string, so just use the original
        $ianaLanguageRequired = strtolower($_SERVER['HTTP_ACCEPT_LANGUAGE']);
    }
    else
    {
        //Use the first two characters for language:
        $ianaLanguageRequired = substr($incomingLanguageTerritory, 0, 2);

        //In this resolver the context is the country or region representation. Most clients will send this
        //information in their requests, and it appears in the $_SERVER['HTTP_ACCEPT_LANGUAGE'] variable as the fourth
        //and fifth characters - for example "en-GB", "en-US", "fr-FR". So if $_SERVER['HTTP_ACCEPT_LANGUAGE'] has five
        //characters, then $context can contain these 4th and 5th characters. Note that these characters are sent into
        //the resolver document in lowercase by the resolver_ui_api project, so the lowercase represenation of this value
        //is needed.
        //If your resolver's context is quite different than this, then comment out the code here, which will allow your
        //installation to only accept context as a name/value pair in request querystring 'context=value':
        if(strlen($_SERVER['HTTP_ACCEPT_LANGUAGE']) === 5)
        {
            $contextRequired = strtolower(substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 3, 2));
            file_put_contents('php://stderr', "DISCOVERY: from HTTP Headers - contextRequired: '$contextRequired'" . PHP_EOL);
        }
    }

    file_put_contents('php://stderr', "DISCOVERY: From HTTP Headers - ianaLanguageRequired: '$ianaLanguageRequired'" . PHP_EOL);
    file_put_contents('php://stderr', "DISCOVERY: HTTP_ACCEPT_LANGUAGE: '" . $_SERVER['HTTP_ACCEPT_LANGUAGE'] . "'" . PHP_EOL);

}
else
{
    $ianaLanguageRequired = 'XX'; //No language came in! Maybe it will be in the querystring as 'lang' later? 'XX' denotes nothing in HTTP Header
    $contextRequired = 'XX'; //No context came in, maybe it will be in the querystring as 'context' later? 'XX' denotes nothing in HTTP Header
}


//Find requested document / MIME type language from client application, if available
if (isset($_SERVER['CONTENT-TYPE']))
{
    $mimeTypeRequired = ($_SERVER['CONTENT-TYPE']);

    $mimeColonPosition = strpos($_SERVER['CONTENT-TYPE'], ';');
    if($mimeColonPosition !== FALSE)
    {
        $mimeTypeRequired = strtolower(substr($mimeTypeRequired, 0, $mimeColonPosition));
    }
    else
    {
        $mimeTypeRequired = strtolower($_SERVER['CONTENT-TYPE']);
    }

    file_put_contents('php://stderr', "DISCOVERY: MimeType Required: '$mimeTypeRequired'" . PHP_EOL);
    file_put_contents('php://stderr', "DISCOVERY: CONTENT-TYPE: '" . $_SERVER['CONTENT-TYPE'] . "'" . PHP_EOL);

}
else
{
    $mimeTypeRequired = 'XX'; //No MIME TYPE came in! 'XX' means 'use the default'.
}



file_put_contents('php://stderr', 'Request is ' . $_SERVER['REQUEST_URI'] . PHP_EOL);


//Decode the elements using the Digital Link Toolkit:
$dl = new ClassGS1DigitalLink();
$digitalLinkObject = $dl->decodeDigitalLinkURL($_SERVER['REQUEST_URI']);
file_put_contents('php://stderr', 'DISCOVERY: $digitalLinkObject from ToolKit is: ' . print_r($digitalLinkObject, true) . PHP_EOL);
//Get identifiers
$gs1Key = '';
$gs1Value = '';

//If there are no identifiers found then this was not a digital link request (may be a favicon.ico for example)
//So $gs1Key and  $gs1Value remain empty strings and a 404 will be issued shortly:
if(isset($digitalLinkObject->identifiers[0]))
{
    foreach ($digitalLinkObject->identifiers[0] as $key => $value)
    {
        $gs1Key = $key;
        $gs1Value = $value;
    }
}

file_put_contents('php://stderr', "gs1Key = [$gs1Key] and gs1Value = [$gs1Value]" . PHP_EOL);

//Put a quick halt to anything not a Digital Link URI
if($gs1Key === '' || $gs1Value === '')
{
    file_put_contents('php://stderr', 'NOT a digital link URI - sending 404' . PHP_EOL);
    header($_SERVER['SERVER_PROTOCOL'] . ' 404 NOT a digital link URI');
    die(); // <== ALTERNATIVE EXIT
}


//Now review the querystrings looking for linktype and language,
//as well as build it from the list provided by the toolkit.
$linkType = '';
$linkValue = '';
$dbLinkValue = '';
$responseRecord = new stdClass();
$linkHeaderArray = array();
$queryString = '?';

//The first list to build querystring from is 'dataAttributes':
foreach ($digitalLinkObject->dataAttributes as $nameValuePair)
{
    foreach ($nameValuePair as $nvKey => $nvValue)
    {
        //Build the queryString:
        $queryString .= $nvKey . '=' . $nvValue . '&';

        //Check for context
        if(strtolower($nvKey) === 'context')
        {
            $contextRequired = strtolower($nvValue);
            file_put_contents('php://stderr', "DISCOVERY: requested context found in data attributes: '" . $contextRequired . "'" . PHP_EOL);
        }
    }
}

foreach ($digitalLinkObject->other as $nameValuePair)
{
    foreach ($nameValuePair as $nvKey => $nvValue)
    {
        //Rhe second list to build the querystring from is 'other':
        $queryString .= $nvKey . '=' . $nvValue . '&';

        //Check if 'linktype', 'lang' or 'context' exists:
        if (strtolower($nvKey) === 'linktype')
        {
            $linkValue = $nvValue;
            $dbLinkValue = strtolower($nvValue); //The MongoDB documents stores linkType in lowercase
            file_put_contents('php://stderr', "DISCOVERY: requested linktype found in 'other' attributes: '" . $dbLinkValue . "'" . PHP_EOL);
        }
        elseif (strtolower($nvKey) === 'lang')
        {
            $ianaLanguageRequired = strtolower($nvValue); //querystring entry overrides any existing value
            file_put_contents('php://stderr', "DISCOVERY: requested language found in 'other' attributes: '" . $ianaLanguageRequired . "'" . PHP_EOL);
        }
        elseif (strtolower($nvKey) === 'context')
        {
            $contextRequired = strtolower($nvValue);
            file_put_contents('php://stderr', "DISCOVERY: requested context found in 'other' attributes: '" . $contextRequired . "'" . PHP_EOL);
        }
    }
}


//SPECIAL FOR SOOM PHARMA APP - START //////////////////////////////////////////////////////////////////////////////////////////
//The app uses the IANA language code 'nn' for Norwegian, when it should be 'no'.
//Fortunately, the app calls into Soom Pharma's own API which in turn calls into GS1 Resolver always from the same IP address and
//with user-agent 'Ruby'. So we can detect this along with noticing that the incoming IANa language is 'nn':
if($_SERVER['REMOTE_ADDR'] === '10.131.73.32' && $_SERVER['HTTP_USER_AGENT'] === 'Ruby' && $ianaLanguageRequired === 'nn')
{
    $ianaLanguageRequired = 'no';
    file_put_contents('php://stderr', "DISCOVERY: SoomPharma App IANA language 'nn' has been converted to 'no'" . PHP_EOL);
}
//SPECIAL FOR SOOM PHARMA APP - FINISH /////////////////////////////////////////////////////////////////////////////////////////


//We also need to build the URI (the part after the gs1Key and gs1Value in incoming request).
//these come from $digitalLinkObject->qualifiers:
$uri = '';
foreach ($digitalLinkObject->qualifiers as $nameValuePair)
{
    foreach ($nameValuePair as $nvKey => $nvValue)
    {
        //Build the queryString:
        $uri .= '/' . $nvKey . '/' . $nvValue ;
    }
}

if($uri === '')
{
    $uri = '/';
}

//We have broken down all the relevant elements into variables
//So now call into the MongoDB to get the resolver document:
file_put_contents('php://stderr', "About to call DB with [$gs1Key], [$gs1Value] " . PHP_EOL);
$resolverDocument = $classMongoDB->readURIRecord($gs1Key, $gs1Value);
//file_put_contents('php://stderr', "Resolver doc is: " . print_r($resolverDocument, true) . PHP_EOL);

//If the resolver has some info on the basic key and value, but can;' work out what to send,
//it will send an interstitial page displaying teh contents of the document (formatted for humans) as a last resort
//by setting this flag to true:
$interstitialPageToBeSentFlag = false;

if ($resolverDocument === null)
{
    //WE DO NOT HAVE A DOCUMENT FOR THIS GS1 KEY / GS1 VALUE
    //So now we see if there is a partial match obtainable from the Resolver's GCP collection.
    $resolverGCP = $classMongoDB->readGCPRecord($gs1Key, $gs1Value);
    if ($resolverGCP !== null)
    {
        $redirectUrl = $resolverGCP['resolve_url_format'];
        $redirectUrl = str_replace('{URI}', $_SERVER['REQUEST_URI'], $redirectUrl);
        $redirectUrl = str_replace('{DL}', urlencode(json_encode($digitalLinkObject)), $redirectUrl);
        header('Location: ' . $redirectUrl, true, 307);
        file_put_contents('php://stderr', 'GCP Redirect:  $redirectUrl = ' . print_r($redirectUrl, true) . PHP_EOL . PHP_EOL);
        die(); // <== ALTERNATIVE EXIT
    }
    else
    {
        //Nothing found. Return 404.
        file_put_contents('php://stderr', 'DB entry not found - sending 404' . PHP_EOL);
        header($_SERVER['SERVER_PROTOCOL'] . ' 404 Not Found');
        die(); // <== ALTERNATIVE EXIT
    }
}

//These ELSEIFs work with the fact that we have successfully found and retrieved the document from the database.
//The value in $uri variable contains the specific URI we need to find to get the responses set up for this gs1 key/value
//It can be as simple as "/" meaning that no extra URI elements were supplied in the request beyond gs1 key and value. or it can have the
//URI elements such as "/lot/12345/cpv/ABC123". In any case, the resolver just has to match that value directly
//by examining the values at the same property level as "_id". See the example below which has "/: Object" which would
//match $uri value "/".

//Here is an example document from the MongoDB database (seen as JSON for readability) which I'll refer to in the notes for this code:

/*
 *
 {
    "_id": "/01/07625695556149",
    "/22/123/10/456/21/789": {
        "item_name": "Niacin 60 Capsules 500 mg",
        "active": false,
        "responses": {
            "default_linktype": "https://gs1#org/voc/instructionsForUse",
            "linktype": {
                "https://gs1#org/voc/recipeWebsite": {
                    "default_lang": "en",
                    "lang": {
                        "en": {
                            "default_context": "gb",
                            "context": {
                                "eu": {
                                    "default_mime_type": "text/html",
                                    "mime_type": {
                                        "vnd#ms-powerpoint": {
                                            "link": "https://lansley.com/yummy",
                                            "title": "Yummy recipes",
                                            "fwqs": 1
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "https://gs1#org/voc/instructionsForUse": {
                    "default_lang": "en",
                    "lang": {
                        "fr": {
                            "default_context": "gb",
                            "context": {
                                "fr": {
                                    "default_mime_type": "text/html",
                                    "mime_type": {
                                        "text/html": {
                                            "link": "https://lansley.com/french",
                                            "title": "Manual",
                                            "fwqs": 1
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "https://gs1#org/voc/activityIdeas": {
                    "default_lang": "en",
                    "lang": {
                        "en": {
                            "default_context": "gb",
                            "context": {
                                "gb": {
                                    "default_mime_type": "text/html",
                                    "mime_type": {
                                        "text/html": {
                                            "link": "https://lansley.com/greatideas",
                                            "title": "Great ideas",
                                            "fwqs": 1
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
 *
 */


//the first ELSEIF checks if $dbLinkValue = "all"
elseif($dbLinkValue === 'all')
{
    //$dbLinkValue = "all" so we'll send just the headers and the interstitial page
    $interstitialPageToBeSentFlag = true;
    file_put_contents('php://stderr', 'DISCOVERY: LinkValue === "all"' . PHP_EOL);
}

else
{
    //We search for the the requested URI in the resolver document
    $correctedURIArray = isRequestURIInDocument($resolverDocument, $uri);

    if ($correctedURIArray[0] === 1)
    {
        file_put_contents('php://stderr', 'DISCOVERY: Correct URI found' . PHP_EOL);
        $uri = $correctedURIArray[1];

        $responseRecordLinkType = get_linktype_subdocument($resolverDocument, $uri, $dbLinkValue);

        $responseRecordLang = get_lang_subdocument($responseRecordLinkType, $ianaLanguageRequired);

        $responseRecordContext = get_context_subdocument($responseRecordLang, $contextRequired);

        $responseRecordMimeType = get_mimetype_subdocument($responseRecordContext, $mimeTypeRequired);

        $redirectUrl = qualityAssureOutgoingLink($responseRecordMimeType,  $queryString);

        file_put_contents('php://stderr', "DECISION: Send redirect to location: '$redirectUrl'" . PHP_EOL);

        $linkHeader = buildLinkHeader($resolverDocument, $uri, $queryString);

        header('Link: ' . $linkHeader);
        header('Location: ' . $redirectUrl, true, 307);
        die(); // <== END THE APPLICATION NOW
    }
    else
    {
        //We can't find the specific URI but we must not send a 404 either because we found the GS1 key and value!
        //Instead we'll send the interstitial page instead.
        $interstitialPageToBeSentFlag = true;
    }
}

//Finally if we need the interstitial page, build and send it.
if ($interstitialPageToBeSentFlag)
{
    //Check if the incoming request only wants a JSON response
    if (isset($_SERVER['HTTP_ACCEPT']) && $_SERVER['HTTP_ACCEPT'] === 'application/json')
    {
        header('Content-Type: application/json');
        echo json_encode($resolverDocument, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        file_put_contents('php://stderr', 'DECISION:linktype=all and accept-header=json so sent JSON resolver record' . PHP_EOL);
    }
    else
    {
        file_put_contents('php://stderr', 'DECISION:linktype=all and NOT accept-header=json so sent HTML interstitial page' . PHP_EOL);
        echo buildInterstitialPage($gs1Key, $gs1Value, $resolverDocument, $uri, $queryString);
    }
}

//DONE!
die(); // <== END THE APPLICATION


function get_linktype_subdocument($resolverDocument, $uri, $dbLinkValue) : object
{
    if ($dbLinkValue === '')
    {
        //No $dbLinkValue was requested, so we must use the default link, setting the $dbLinkValue variable to it
        //for use in the next block of code::
        $dbLinkValue = $resolverDocument[$uri]->responses->default_linktype;
        $responseRecordLinkType = $resolverDocument[$uri]->responses->linktype->{$dbLinkValue};
        file_put_contents('php://stderr', 'DECISION: Mo incoming linkType so using the default linkType: ' . $dbLinkValue . PHP_EOL);
    }
    else if(isset($resolverDocument[$uri]->responses->linktype->{$dbLinkValue}))
    {
        file_put_contents('php://stderr', 'DISCOVERY: We have a link in the DB matching: ' . $dbLinkValue . PHP_EOL);
        //So now we either have the requested linkType or the default one stored in $dbLinkValue.
        //For the sake of processing costs and code simplicity, let's save the response document into a new variable
        //and work with that going forwards:
        $responseRecordLinkType = $resolverDocument[$uri]->responses->linktype->{$dbLinkValue};
    }
    else
    {
        file_put_contents('php://stderr', "DECISION: The requested linkType '$dbLinkValue' is unavailable so using the default which is: " . $resolverDocument[$uri]->responses->default_linktype . PHP_EOL);
        $dbLinkValue = $resolverDocument[$uri]->responses->default_linktype;
        $responseRecordLinkType = $resolverDocument[$uri]->responses->linktype->{$dbLinkValue};
    }
    if($responseRecordLinkType === null)
    {
        //Use the first linktype it can find!
        $responseAsArray = (array) $resolverDocument[$uri]->responses->linktype;
        file_put_contents('php://stderr', "DECISION: NULL linktype sub-document! So returning first linktype found". PHP_EOL);
        $responseRecordLinkType = current($responseAsArray);
    }
    return $responseRecordLinkType;
}


function get_lang_subdocument($responseRecordLinkType, $ianaLanguageRequired) : object
{
    if (isset($responseRecordLinkType->lang[$ianaLanguageRequired]))
    {
        file_put_contents('php://stderr', "DISCOVERY: We have a language matching the one requested: '$ianaLanguageRequired'" . PHP_EOL);
    }
    else
    {
        file_put_contents('php://stderr', "DECISION: No matching language for '$ianaLanguageRequired' so using the default language: '$responseRecordLinkType->default_lang' ". PHP_EOL);
        $ianaLanguageRequired = $responseRecordLinkType->default_lang;
    }
    $responseRecordLang = $responseRecordLinkType->lang->{$ianaLanguageRequired};
    if($responseRecordLang === null)
    {
        //Use the first lang it can find!
        $responseAsArray = (array)$responseRecordLinkType;
        file_put_contents('php://stderr', "DECISION: NULL language sub-document! So returning first language found". PHP_EOL);
        $responseRecordLang = current($responseAsArray['lang']);
    }
    return $responseRecordLang;
}


function get_context_subdocument($responseRecordLang, $contextRequired) : object
{
    if (isset($responseRecordLang->context[$contextRequired]))
    {
        file_put_contents('php://stderr', "DISCOVERY: We have a context matching the one requested: '$contextRequired'" . PHP_EOL);
    }
    else
    {
        file_put_contents('php://stderr', "DECISION: No matching context for '$contextRequired' so using the default context: '$responseRecordLang->default_context' ". PHP_EOL);
        $contextRequired = $responseRecordLang->default_context;
    }
    $responseRecordContext = $responseRecordLang->context->{$contextRequired};
    if($responseRecordContext === null)
    {
        //Use the first context it can find!
        $responseAsArray = (array)$responseRecordLang;
        file_put_contents('php://stderr', "DECISION: NULL context sub-document! So returning first context found". PHP_EOL);
        $responseRecordContext = current($responseAsArray['context']);
    }
    return $responseRecordContext;
}


function get_mimetype_subdocument($responseRecordContext, $mimeTypeRequired) : object
{
    if (isset($responseRecordContext->mime_type[$mimeTypeRequired]))
    {
        file_put_contents('php://stderr', "DISCOVERY: We have a MIME type matching the one requested: '$mimeTypeRequired'" . PHP_EOL);
    }
    else
    {
        file_put_contents('php://stderr', "DECISION: No matching MIME type for '$mimeTypeRequired' so using the default MIME type: '$responseRecordContext->default_mime_type' ". PHP_EOL);
        $mimeTypeRequired = $responseRecordContext->default_mime_type;
    }
    $responseRecordMimeType = $responseRecordContext->mime_type->{$mimeTypeRequired};
    if($responseRecordMimeType === null)
    {
        //Use the first MIME-type it can find!
        $responseAsArray = (array)$responseRecordContext;
        file_put_contents('php://stderr', "DECISION: NULL MIME-type sub-document! So returning first MIME-type found". PHP_EOL);
        $responseRecordMimeType = current($responseAsArray['mime_type']);
    }
    return $responseRecordMimeType;
}


/**
 * Checks that the URL is syntactically correct (only one question mark, dpesn't end in &
 * We may have too many question marks in which case the second and subsequent '?' must be changed to '&':
 * @param $responseRecordMimeType
 * @param $queryString
 * @param $fwqsFlag
 * @return string
 */
function qualityAssureOutgoingLink($responseRecordMimeType, $queryString) : string
{
    file_put_contents('php://stderr', "qualityAssureOutgoingLink: '$responseRecordMimeType->link', '$queryString', '$responseRecordMimeType->fwqs'" . PHP_EOL);
    //Ignore the querystring value if the the fwqs 'forward querystrings' flag is set to "0"
    //to suppress incoming request querystrings being present on the destination
    if(strval($responseRecordMimeType->fwqs) === "1")
    {
        $outgoing = trim($responseRecordMimeType->link . $queryString);

        if(substr_count($outgoing, '?') !== 1)
        {
            $positionOfFirstQM = strpos($outgoing, '?');
            //Ignore the string up to the first instance of '?' then replace all subsequent instances with '&')
            $outgoing = substr($outgoing, 0, $positionOfFirstQM) . '?' . str_replace('?', '&', substr($outgoing, $positionOfFirstQM + 1));
        }

        //make sure that the outgoing url does not end with & or ?
        while(substr($outgoing, -1) === '&' || substr($outgoing, -1) === '?')
        {
            $outgoing = substr($outgoing, 0, -1);
        }
    }
    else //$fwqsFlag === "0"
    {
        $outgoing = trim($responseRecordMimeType->link);
    }
    return str_replace(' ', '', $outgoing);
}

function buildLinkHeader($resolverDocument, $uri, $queryString)
{
    /**
     * Here we build the linkHeader that will be returned in the headers along with either the redirect or the interstitial page.
     * The variable $resolverDocument contains the entire resolver document for the requested GS1 Key and Value.
     * Each entry contains the link, the linkType as 'rel', the language and the title. This is all achieved by iterating through all
     * the languages within all the linktypes in the responses section of the document.
     * First an array is built of all the elements, and a note is made if any element is a default
     * Example link we need to build (seen as an HTTP Header in the response)
     * Link: <https://www.felleskatalogen.no/medisin/pasienter/pil-esbriet-roche-640925>; rel="bijsluiters"; type="text/html"; hreflang="no"; title="Felleskatalogen", <https://www.e-compendium.be/de/packungsbeilagen/patient/6780/2979>; rel="bijsluiters"; type="text/html"; hreflang="de"; title="ePIL (DE)", <https://www.e-compendium.be/fr/notices/patient/6780/2979>; rel="bijsluiters"; type="text/html"; hreflang="fr"; title="ePIL (FR)", <https://www.e-compendium.be/nl/bijsluiters/patient/6780/2979>; rel="bijsluiters"; type="text/html"; hreflang="nl"; title="ePIL (NL)", <https://en.wikipedia.org/wiki/Sustainability>; rel="sustainabilityinformation"; type="text/html"; hreflang="nl"; title="All about sustainability (NL)"
     */

    $linkHeaderArray = array();
    $counter = 0;
    $defaultLinkIndex = 0; //Stores the index of the $linkHeaderArray entry which is the default link

    if(isset($resolverDocument->{$uri}->responses))
    {
        //DEBUG: file_put_contents('php://stderr', "DECISION: building link header with uri = '$uri' " . PHP_EOL);
        //file_put_contents('php://stderr', 'buildLinkHeader $resolverDocument = ' . print_r($resolverDocument, true) . PHP_EOL);
        foreach ($resolverDocument->{$uri}->responses as $responseKey => $responsesDocument)
        {
            //file_put_contents('php://stderr', 'buildLinkHeader gettype($responsesDocument) = ' . gettype($responsesDocument) . PHP_EOL);
            if(gettype($responsesDocument) === 'object')  //One of the entries will be for default the value of which is a string not an object (same for all nested contexts!)
            {
                //DEBUG: file_put_contents('php://stderr', '$responsesDocument =============> ' . print_r($responsesDocument, true) . PHP_EOL);
                foreach ($responsesDocument as $linkTypeKey => $linkTypeDocument)
                {
                    if (gettype($linkTypeDocument) === 'object')
                    {
                        //DEBUG: file_put_contents('php://stderr', '$linkTypeDocument =============> ' . print_r($linkTypeDocument, true) . PHP_EOL);
                        foreach ($linkTypeDocument->lang as $langKey => $langDocument)
                        {
                            if (gettype($langDocument) === 'object')
                            {
                                //DEBUG: file_put_contents('php://stderr', '$langDocument =============> ' . print_r($langDocument, true) . PHP_EOL);
                                foreach ($langDocument->context as $contextKey => $contextDocument)
                                {
                                    if (gettype($contextDocument) === 'object')
                                    {
                                        //DEBUG: file_put_contents('php://stderr', '$contextDocument =============> ' . print_r($contextDocument, true) . PHP_EOL);
                                        foreach ($contextDocument->mime_type as $mimeTypeKey => $mimeTypeDocument)
                                        {
                                            if (gettype($mimeTypeDocument) === 'object')
                                            {
                                                //DEBUG: file_put_contents('php://stderr', '$mimeTypeDocument =============> ' . print_r($mimeTypeDocument, true) . PHP_EOL);
                                                $linkHeader = '<' . qualityAssureOutgoingLink($mimeTypeDocument->link, $queryString) . '>; rel="' . $linkTypeKey . '"; type="' . $mimeTypeKey . '"; hreflang="' . $langKey . '"; title="' . $mimeTypeDocument->title . '", ';
                                                $linkHeaderArray[$counter] = $linkHeader;
                                                if ($resolverDocument[$uri]->responses->defaultlink === $responseKey)
                                                {
                                                    $defaultLinkIndex = $counter;
                                                }
                                                $counter++;
                                            }
                                        }
                                    }
                                }

                            }
                        }
                    }
                }


            }
        }

        //Now we have looped through all four attribute groups, Build the header - first use the default link:
        $linkHeader = $linkHeaderArray[$defaultLinkIndex];

        //Now add the rest of the links EXCEPT for the default as it's already there:
        for ($linkCounter = 0; $linkCounter < count($linkHeaderArray); $linkCounter++)
        {
            if ($linkCounter !== $defaultLinkIndex)
            {
                $linkHeader .= $linkHeaderArray[$linkCounter];
            }
        }

        //finally, remove the last two characters ', ' from the $linkHeader value
        $linkHeader = substr($linkHeader, 0, -2);
        file_put_contents('php://stderr', "Link header is: $linkHeader" . PHP_EOL);
        return $linkHeader;
    }
    else
    {
        return '';
    }

}


function buildInterstitialPage($gs1Key, $gs1Value, $resolverDocument,  $uri, $queryString)
{

    $htmlBuilder = new ClassHTMLPageBuilder();
    $html = $htmlBuilder->BuildPage($gs1Key, $gs1Value, $resolverDocument, $uri, $queryString);
    return $html;
}


/**
 * This function matches the URI with the incoming request.
 * First it looks for an exact match. If found, 'true' is returned.
 * Otherwise it 'walks up' the UI seeing if we can match it less of the URI.
 *
 * For example: $documentURI has "/lot/12345" stored, byt the incoming request has "/lot/12345/cpv/AABBCC".
 * In this case a match cannot be found but if we 'walk up' the URI removing more and more of the right-side of
 * the incoming request until we get a match, then eventually we will match "/lot/12345" and return 'true'.
 * If there's no match at all and we run out of characters to remove, we return false.
 *
 * The return consists of an array:
 * $returnArray[0] = true or false if e=the uri can be found in teh document
 * $returnArray[1] = if true, the request URI in the form that caused the match. If false, the original request URI
 * @param $resolverDocument
 * @param $requestUri,
 * @return array
 */
function isRequestURIInDocument($resolverDocument, $requestUri) : array
{
    //First of all, let's just see if we can find the whole request URI
    //because if we can, we can return 'true' straightaway.
    //The two elemets of the returned ara are:
    //[0] = 1 if something found or 0 if not
    //[1] = The URI we actually found

    $returnArray = array();
    if(isset($resolverDocument[$requestUri]))
    {
        $returnArray[0] = 1;
        $returnArray[1] = $requestUri;
    }
    else
    {
        $returnArray[0] = 0;
    }


    if($returnArray[0] === 0)
    {
        //Break the $requestUri into pieces based on the / symbol
        $requestElements = explode("/", $requestUri);

        file_put_contents('php://stderr', "request Elements are " . print_r($requestElements, true) . PHP_EOL);

        //We going to rebuild the request URI with less and less elements until we (hopefully) get a match
        //starting with 3 less than the original because each uri attribute has '/name/value' - so two elements
        //per attribute
        for($maxElementsToTest = count($requestElements) - 1; $maxElementsToTest > 0; $maxElementsToTest --)
        {
            $uriToTest = "";
            for ($elementIndex = 1; $elementIndex <  $maxElementsToTest; $elementIndex++)
            {
                $uriToTest .= "/" . $requestElements[$elementIndex];
            }

            if(isset($resolverDocument[$uriToTest]))
            {
                $returnArray[0] = 1;
                $returnArray[1] = $uriToTest;
                break;
            }
            file_put_contents('php://stderr', "tested  $uriToTest - answer: " . $returnArray[0] . PHP_EOL);
        }

        //Still not found and we've walked up all the URI elements
        if($returnArray[0] === 0)
        {
            //One final try with no attributes
            if(isset($resolverDocument['/']))
            {
                $returnArray[0] = 1;
                $returnArray[1] = '/'; //return the base URI
            }
        }
    }
    file_put_contents('php://stderr', 'DISCOVERY: Corrected URI found: ' . print_r($returnArray, true) . PHP_EOL);
    return $returnArray;
}



function startsWith($haystack, $needle)
{
    return (strpos($haystack, $needle) === 0);
}
