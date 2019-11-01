<?php
require_once 'ClassDBAccess.php';
require_once 'ClassMongoDB.php';
require_once 'ClassAITable.php';

/**
 * Main Build function which takes each database entry with uri_requests.api_builder_processed column set to 0, and
 * Creates the GS1 Resolver document before inserting it into MongoDB
 */
class ClassBuild
{
    private $mongoDbClient;
    private $dbAccess;
    private $classAITable;

    public function __construct()
    {
        $this->dbAccess = new ClassDBAccess();
        $this->mongoDbClient = new ClassMongoDB();
        $this->classAITable = new ClassAITable();
    }

    /**
     * The BUILD function retrieves all resolver records from the SQL database with 'api_builder_processed' = 0.
     * and updates the document in the resolver's document database. Given that a resolver document has the gs1_key and value
     * at its root, several resolver SQL records may apply to a single resolver document (all SQL records sharing the
     * same key ane value). This complicates processing but makes for high speed document retrieval by the resolver itself.
     * @return array
     */
    public function Build(): array
    {
        $logArray = Array();

        $logArray[] = 'Starting Latest MongoDB update from MySQL DB ...';

        //Find out how many URI requests there are
        $uriRequestCount = $this->dbAccess->BUILD_GetURIRequestCount();
        $logArray[] = "$uriRequestCount requests need processing....";

        if ($uriRequestCount > 0)
        {
            $counter = 0;
            while ($counter < $uriRequestCount)
            {
                //get all the URI requests we need to build:
                $uriRequests = $this->dbAccess->BUILD_GetURIRequests();
                $counter += count($uriRequests);

                //Let's go through each request that requires building:
                $previousGS1Key = 'X';
                $previousGS1Value = 'X';

                foreach ($uriRequests as $uriRequest)
                {

                    $thisGS1Key = trim($uriRequest['gs1_key_code']);
                    $thisGS1Value = trim($uriRequest['gs1_key_value']);

                    //If the GS1 Key Code and Value are NOT the same as the previous entry in the foreach()
                    //list being processed, then set a flag indicating that the next Key Code/Value has been
                    //found. This will be used later to delete the MongoDB record and start it from scratch.
                    if ($thisGS1Key === $previousGS1Key && $thisGS1Value === $previousGS1Value)
                    {
                        $nextGS1KeyCodeAndValueFoundFlag = false;
                    }
                    else
                    {
                        $nextGS1KeyCodeAndValueFoundFlag = true;
                        $previousGS1Key = $thisGS1Key;
                        $previousGS1Value = $thisGS1Value;
                    }

                    if ($uriRequest['flagged_for_deletion'] === 0)
                    {
                        $this->BUILD_UriRecord($uriRequest, $nextGS1KeyCodeAndValueFoundFlag);
                    }
                    else
                    {
                        $mongoDbRecord = array();
                        $mongoDbRecord['_id'] = '/' . $this->classAITable->lookupAICodeFromAIShortCode($thisGS1Key) . '/' . $thisGS1Value;
                        $this->mongoDbClient->deleteURIRecord($mongoDbRecord);

                        $this->dbAccess->BUILD_DeleteUriRecord($uriRequest['uri_request_id']);
                        $this->dbAccess->BUILD_SetToRequireRebuild($thisGS1Key, $thisGS1Value);
                    }
                }
            }
        }

        $logArray[] = "Processing GCP Resolves" . PHP_EOL;
        $this->BUILD_GCP_Resolves();

        $logArray[] = "Processing Well Known record" . PHP_EOL;
        $this->BUILD_Well_Known();

        $logArray[] = "Completed Latest MongoDB update" . PHP_EOL;
        return $logArray;
    }


    private function BUILD_UriRecord($uriRequest, $nextGS1KeyCodeAndValueFoundFlag)
    {
        //$mongoDbRecord will hold the document for this request that will be stored in MongoDB
        $mongoDbRecord = array();

        //These two variables just makes it easier to read the code without really slowing it down.
        $gs1Key = trim($uriRequest['gs1_key_code']);
        $gs1Value = trim($uriRequest['gs1_key_value']);

        //Make sure that value is appropriate length
        //TODO: Only covers GTIN; we must code for the gs1 keys (data in table)
        if ($gs1Key === 'gtin' || $gs1Key === '01')
        {
            while (strlen($gs1Value) < 14)
            {
                $gs1Value = '0' . $gs1Value;
            }
        }

        //Apply the gs1 Key and Value as the "_id" property, which MongoDb uses as its Primary Key.
        //It's being stored as a URI in format "/keyName/keyValue"   e.g. "/gtin/07613326006651"
        $mongoDbRecord['_id'] = '/' . $this->classAITable->lookupAICodeFromAIShortCode($gs1Key) . '/' . $gs1Value;

        //Only process active requests that are not flagged for deletion
        if ($uriRequest['active'] === 1 && $uriRequest['flagged_for_deletion'] === 0)
        {
            $webUri = '';

            //build URI elements
            for ($prefixSuffixLoop = 1; $prefixSuffixLoop <= 4; $prefixSuffixLoop++)
            {
                if ($uriRequest['web_uri_prefix_' . $prefixSuffixLoop] !== '')
                {
                    $webUri .= '/' . $this->classAITable->lookupAICodeFromAIShortCode($uriRequest['web_uri_prefix_' . $prefixSuffixLoop]) . '/' . $uriRequest['web_uri_suffix_' . $prefixSuffixLoop];
                }
            }

            //Set URI
            $webUri = trim($webUri);

            //Replace any instances of '//' with '/' until there are none:
            while (strpos($webUri, '//') !== false)
            {
                $webUri = str_replace('//', '/', $webUri);
            }

            if ($webUri === '')
            {
                $webUri = '/'; //'root' represented by the '/' symbol
            }
            $mongoDbRecord[$webUri] = array();

            //Add the item's description
            $mongoDbRecord[$webUri]['item_name'] = trim($uriRequest['item_description']);

            //Process the responses
            $mongoDbRecord = $this->BUILD_UriResponses($uriRequest, $mongoDbRecord, $webUri);
        }

        $response = $this->mongoDbClient->putURIRecord($mongoDbRecord, $nextGS1KeyCodeAndValueFoundFlag, $uriRequest['active'] === 1);

        if ($response['OK'])
        {
            $this->dbAccess->BUILD_FlagUriRecordAsBuilt($uriRequest['uri_request_id']);
        }
        else
        {
            $logArray[] = $response['ERROR'];
        }
    }


    private function BUILD_GCP_Resolves()
    {
        $gcpResolvesList = $this->dbAccess->BUILD_GetGCPResolvesList();
        foreach ($gcpResolvesList as $gcpResolve)
        {
            $gcpDocument = array();
            $gcpDocument['_id'] = '/' . $gcpResolve['gs1_key_code'] . '/' . $gcpResolve['gs1_gcp_value'];
            $gcpDocument['resolve_url_format'] = $gcpResolve['resolve_url_format'];
            $this->mongoDbClient->putGCPRecord($gcpDocument);
        }
    }

    private function BUILD_Well_Known()
    {
        $json = file_get_contents('/var/www/config/wellKnownRecordTemplate.json');

        $wellKnownDocument = json_decode($json);

        $linkTypesArray = $this->dbAccess->GetActiveLinkTypesList();

        $wellKnownDocument->{'_id'} = 'gs1resolver.json';

        foreach ($linkTypesArray as $linkType)
        {
            $linkTypeWord = str_replace('https://gs1.org/voc/', '', $linkType['linktype_reference_url']);
            $wellKnownDocument->{'activeLinkTypes'}->{$linkType['locale']}->{$linkTypeWord}->{'title'} = $linkType['linktype_name'];
            $wellKnownDocument->{'activeLinkTypes'}->{$linkType['locale']}->{$linkTypeWord}->{'description'} = $linkType['description'];
            $wellKnownDocument->{'activeLinkTypes'}->{$linkType['locale']}->{$linkTypeWord}->{'gs1key'} = $linkType['applicable_gs1_key_code'];
        }

        $this->mongoDbClient->putWellKnownRecord($wellKnownDocument);
    }

    private function getDigitalLinkVocabWord($linkTypeURL)
    {
        $list = explode('/', $linkTypeURL);
        return $list[count($list) - 1];
    }

    /**
     * @param $uriRequest
     * @param array $mongoDbRecord
     * @param string $webUri
     * @return array
     */
    private function BUILD_UriResponses($uriRequest, array $mongoDbRecord, string $webUri): array
    {
        //Now to the URI RESPONSES
        //Get all the URI responses for this uriRequest range, which we'll use a little further down this function
        $uriResponses = $this->dbAccess->BUILD_GetURIResponses($uriRequest['uri_request_id']);

        $responsesCount = 0;
        foreach ($uriResponses as $response)
        {
            //Just use the final word of the link type URL, and save it as lowercase.
            //So 'http://gs1.org/voc/epil' becomes 'epil':
            $linkType = strtolower($this->getDigitalLinkVocabWord($response['linktype']));
            if ($response['default_linktype'] === 1)
            {
                $mongoDbRecord[$webUri]['responses']['default_linktype'] = str_replace('.', '#', $linkType);
            }

            //Within each linkType we have ianaLanguage
            $ianaLanguage = str_replace('.', '#', $response['iana_language']);
            if ($response['default_iana_language'] === 1)
            {
                $mongoDbRecord[$webUri]['responses']['linktype'][$linkType]['default_lang'] = $ianaLanguage;
            }

            //Within each $ianaLanguage we have context
            $context = str_replace('.', '#', $response['context']);
            if ($response['default_context'] === 1)
            {
                $mongoDbRecord[$webUri]['responses']['linktype'][$linkType]['lang'][$ianaLanguage]['default_context'] = $context;
            }

            //...and finally within context we have mime_type:
            $mimeType = str_replace('.', '#', $response['mime_type']);
            if ($response['default_mime_type'] === 1)
            {
                $mongoDbRecord[$webUri]['responses']['linktype'][$linkType]['lang'][$ianaLanguage]['context'][$context]['default_mime_type'] = $mimeType;
            }

            //Let's set our link, title, and forward-request-querystrings flag at the end of that hierarchy:
            $mongoDbRecord[$webUri]['responses']['linktype'][$linkType]['lang'][$ianaLanguage]['context'][$context]['mime_type'][$mimeType]['link'] = $response['destination_uri'];
            $mongoDbRecord[$webUri]['responses']['linktype'][$linkType]['lang'][$ianaLanguage]['context'][$context]['mime_type'][$mimeType]['fwqs'] = $response['forward_request_querystrings'];
            $mongoDbRecord[$webUri]['responses']['linktype'][$linkType]['lang'][$ianaLanguage]['context'][$context]['mime_type'][$mimeType]['linktype_uri'] = $response['linktype'];

            //Find the most appropriate name - either the one supplied by the entry or, if not there, the official link name:
            if ($response['friendly_link_name'] !== null && strlen($response['friendly_link_name']) > 2)
            {
                //The data entry user added their own friendly name for this link
                $mongoDbRecord[$webUri]['responses']['linktype'][$linkType]['lang'][$ianaLanguage]['context'][$context]['mime_type'][$mimeType]['title'] = $response['friendly_link_name'];
            }
            elseif ($response['official_link_name'] !== null)
            {
                //We'll use up the official name for the link
                $mongoDbRecord[$webUri]['responses']['linktype'][$linkType]['lang'][$ianaLanguage]['context'][$context]['mime_type'][$mimeType]['title'] = $response['official_link_name'];
            }
            else
            {
                //Our fallback is just to use the linktype itself.
                $mongoDbRecord[$webUri]['responses']['linktype'][$linkType]['lang'][$ianaLanguage]['context'][$context]['mime_type'][$mimeType]['title'] = $response['linktype'];
            }

            //Increment the counter
            $responsesCount++;
        }
        //Now check that every attribute has a default, and enforce a default if there is not one:
        $mongoDbRecord = $this->EnforceDefaults($webUri, $mongoDbRecord);

        return $mongoDbRecord;
    }

    /**
     * Iterates through the record looking for the absence of defaults an, if necessary, enforcing defaults
     * by taking the first entry found for each attribute
     * @param $webUri
     * @param $mongoDBRecord
     * @return array
     */
    function EnforceDefaults($webUri, $mongoDBRecord): array
    {
        if (!isset($mongoDBRecord[$webUri]['responses']['default_linktype']))
        {
            $firstLinkTypeName = key($mongoDBRecord[$webUri]['responses']['linktype']);
            $mongoDBRecord[$webUri]['responses']['default_linktype'] = $firstLinkTypeName;
        }

        //Check that each linktype has a default language
        foreach ($mongoDBRecord[$webUri]['responses']['linktype'] as $linkTypeName => $linkType)
        {
            if (!isset($linkType['default_lang']))
            {
                $firstLangName = key($linkType['lang']);
                $mongoDBRecord[$webUri]['responses']['linktype'][$linkTypeName]['default_lang'] = $firstLangName;
            }

            //Check that each language has a default context
            foreach ($linkType['lang'] as $langName => $lang)
            {
                if (!isset($lang['default_context']))
                {
                    $firstContextName = key($lang['context']);
                    $mongoDBRecord[$webUri]['responses']['linktype'][$linkTypeName]['lang'][$langName]['default_context'] = $firstContextName;
                }

                //Check that each context has a default mime-type
                foreach ($lang['context'] as $contextName => $context)
                {
                    if (!isset($context['default_mime_type']))
                    {
                        $firstMimeTypeName = key($context['mime_type']);
                        $mongoDBRecord[$webUri]['responses']['linktype'][$linkTypeName]['lang'][$langName]['context'][$contextName]['default_mime_type'] = $firstMimeTypeName;
                    }
                }
            }
        }

        return $mongoDBRecord;
    }
}
