<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 08/05/2018
 * Time: 16:42
 */

class ClassDBAccess
{
    private $db;
    public function __construct()
    {
        $ini = parse_ini_file('/var/www/config/api.ini');
        $servername = $ini['mssql_server_name'];
        $dbname     = $ini['mssql_db_name'];
        $username   = $ini['mssql_user_name'];
        $password   = $ini['mssql_password'];
        $connectionInfo = array( 'Database'=>$dbname, 'UID'=>$username, 'PWD'=>$password, 'ReturnDatesAsStrings' => true);
        //New SQL Azure
        $this->db = sqlsrv_connect($servername, $connectionInfo);

        // Check connection
        if (!$this->db)
        {
            $error =  sqlsrv_errors();
            echo '{"Error", "SQL SERVER Database Connection Failed. Please contact the APIs administrator - error log on server for details"}';
            file_put_contents('php://stderr', 'Error connecting to SQL DB: ' . print_r($error, true) . PHP_EOL);
            die();
        }
    }


    private function DBSelect($sql) : array
    {
        //DEBUG: $this->logThis("DBSELECT: $sql");
        $resultsArray = array();
        try
        {
            $result = sqlsrv_query($this->db, $sql);
            if($result === false)
            {
                $this->logThis("Error in processing of this SQL: ==> $sql  <=== Error is: ".  print_r( sqlsrv_errors(), true) );
            }
        }
        catch (Exception $sqle)
        {
            $this->logThis("Error in processing of this SQL: ==> $sql <=== Error is: $sqle " );
            $result = false;
        }
        if ($result === false)
        {
            $this->logThis("'False' returned by Database!");
            $resultsArray = array(); //empty array
        }
        else
        {
            //Build an array where each major element of the array is the database row
            while ($row = sqlsrv_fetch_array($result, SQLSRV_FETCH_ASSOC))
            {
                $resultsArray[] = $row;
            }
        }
        return $this->DecodeDataFromSQLSafe($resultsArray);
    }


    private function DBExec($sql) : bool
    {
        //DEBUG: $this->logThis("DBEXEC: $sql");
        try
        {
            $result = sqlsrv_query($this->db, $sql);

            if($result === false)
            {
                $this->logThis("DBEXEC: Error in processing of this SQL: ==> $sql <=== Error is: ".  print_r( sqlsrv_errors(), true) );
            }
            else
            {
                $result = true;
            }
        }
        catch (Exception $sqle)
        {
            //TODO: Find a replacement to send error messages caused by a database error
            //DEPRECATED: We'll send this error in to the error log
            $this->logThis("Error in processing of this SQL: ==> $sql <=== Error is: ' . $sqle" );
            $result = false;
        }
        return $result;
    }


    /**
     * @param $textToMakeSQLSafe
     * @return string
     * Purpose: Encodes text from any lang=uage t o make it safer to hand over to a SQL statement.
     *          The encoding is then prefixed with the double-character symbol '[]' which would never be in text normally
     *          so can be interpreted by reading functions as 'this is base64 encoded'
     */
    private function EncodeTextToSQLSafe($textToMakeSQLSafe) : string
    {
        //return $textToMakeSQLSafe;
        return '[]' . base64_encode($textToMakeSQLSafe);
    }


    /**
     * @param $textThatIsSQLSafe
     * @return string
     * Purpose: Restores 'SQL Safe' text back to the original string
     *          if it is prefixed with the double-character '[]' symbol
     */
    private function DecodeTextFromSQLSafe($textThatIsSQLSafe) : string
    {
        $result = $textThatIsSQLSafe;

        if($this->startsWith($textThatIsSQLSafe, '[]'))
        {
            $result = base64_decode(substr($textThatIsSQLSafe, 2));
        }

        if($result === null)
        {
            $result = '';
        }

        return $result;
    }


    /**
     * @param $rows
     * @return array
     * Loops through incoming data from database and Base64 decodes it
     * if it is a string column starting with the characters '[]'.
     */
    private function DecodeDataFromSQLSafe($rows) : array
    {
        foreach($rows as $rowID => $row)
        {
            foreach($row as $columnName => $columnValue)
            {
                if(is_string($columnValue) && $this->startsWith($columnValue, '[]'))
                {
                    $rows[$rowID][$columnName] = $this->DecodeTextFromSQLSafe($columnValue);
                }
            }
        }
        return $rows;
    }


    public function SaveNewSession($accountId, $memberPrimaryGLN) : string
    {
        $sessionId = $this->RandomStringGenerator(50);
        $sql = "EXEC [gs1resolver_dataentry_db].[save_new_session]  $accountId, '$memberPrimaryGLN', '$sessionId'";
        $this->DBExec($sql);
        return $sessionId;
    }


    public function testDBOK() : array
    {
        $sql = "EXEC [gs1resolver_dataentry_db].[list_gs1_mos]";
        $result = $this->DBSelect($sql);
        return $result;
    }


    public function LoginAccount($loginEmail, $password) : array
    {
        $accountSession = null;
        $loginEmail = strtolower(trim($loginEmail));
        $sql = "EXEC [gs1resolver_dataentry_db].[account_login] '$loginEmail', '$password'";
        $result = $this->DBSelect($sql);

        if (count($result) > 0)
        {
            $accountSession = $result[0];
            $accountId = $accountSession['account_id'];
            $memberPrimaryGLN = $accountSession['member_primary_gln'];
            $accountSession['session_id'] = $this->SaveNewSession($accountId, $memberPrimaryGLN);
        }
        else
        {
            $accountSession['session_id'] = 'LOGIN FAILED'; //Exact words searched for by browser
        }

        return $accountSession;
    }

    function RandomStringGenerator($len) : string
    {
        $result = '';
        $chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        $charArray = str_split($chars);
        for($i = 0; $i < $len; $i++){
            $randItem = array_rand($charArray);
            $result .= ''.$charArray[$randItem];
        }
        return $result;
    }


    public function GetAccountDetails($sessionId, $accountId) : array
    {
        $results = array();
        if($this->CheckSessionActive($sessionId))
        {
            $sql = "EXEC [gs1resolver_dataentry_db].[get_account_details] $accountId, '$sessionId'";
            $results = $this->DBSelect($sql);
            $results = $this->DecodeDataFromSQLSafe($results);

            if (count($results) === 0)
            {
                $results['STATUS'] = 'Account Not Found';
                $results['OK'] = false;
            }
            else
            {
                $results['STATUS'] = 'Account details retrieved';
                $results['OK'] = true; //Used by SaveExistingAccount() to ensure that the account was retrieved OK
            }
        }
        else
        {
            $results['STATUS'] = 'SESSION EXPIRED';
            $results['OK'] = false;

        }
        //DEBUG: $this->logThis('GetAccountDetails $results: ' . print_r($results, true) );

        return $results;
    }

    public function ChangePassword($sessionId, $accountId, $existingPassword, $newPassword)
    {
        if($this->CheckSessionActive($sessionId))
        {
            $sql = "EXEC [gs1resolver_dataentry_db].[change_password] $accountId, '$existingPassword', '$newPassword'";
            $result = $this->DBSelect($sql);
            if($result[0]['result'] === 'Y')
            {
                $results['STATUS'] = "Password updated successfully";
            }
            else
            {
                $results['STATUS'] = 'ERROR: Password update failedd';
            }
        }
    }


    //TODO: Write change password function
    public function ChangeAccountPassword($sessionId, $accountId, $existingPassword, $newPassword) : array
    {
        $results = array();
        return $results;
    }


    public function SaveAccountDetails($sessionId,
                                       $accountId,
                                       $firstName,
                                       $surname,
                                       $loginEmail,
                                       $password,
                                       $newPassword,
                                       $accountNotes,
                                       $administrator,
                                       $active,
                                       $memberPrimaryGLN) : array
    {
        $results = array();

        if($this->CheckSessionActive($sessionId))
        {
            if($accountId > 0)
            {
                //UPDATE EXISTING ACCOUNT
                ///About to save the existing account. But, if anything is missing we need to get the account and save back the same data element(s)
                /// except password
                $existingAccount = $this->GetAccountDetails($sessionId, $accountId);
                if ($existingAccount['OK'])
                {
                    if ($firstName === '')
                    {
                        $firstName = $existingAccount['firstname'];
                    }
                    if ($surname === '')
                    {
                        $surname = $existingAccount['surname'];
                    }
                    if ($loginEmail === '')
                    {
                        $loginEmail = $existingAccount['login_email'];
                    }
                    if ($accountNotes === '')
                    {
                        $accountNotes = $existingAccount['account_notes'];
                    }
                    if ($administrator === '')
                    {
                        $administrator = $existingAccount['administrator'];
                    }
                    if ($active === '')
                    {
                        $active = $existingAccount['active'];
                    }
                    //Some details need base64'ing as they will include all kinds of character formats
                    $base64FirstName = $this->EncodeTextToSQLSafe($firstName);
                    $base64Surname = $this->EncodeTextToSQLSafe($surname);
                    $base64AccountNotes = $this->EncodeTextToSQLSafe($accountNotes);
                    $sql = "EXEC [gs1resolver_dataentry_db].[save_existing_account]  $accountId, '$base64FirstName', '$base64Surname', '$loginEmail', '$password', '$newPassword', '$base64AccountNotes', '$administrator', $active";
                    $dbResult = strval($this->DBSelect($sql)[0]['result']);

                    if($dbResult === 'Y')
                    {
                        $results['STATUS'] = "Account details updated successfully";
                    }
                    else if($dbResult === 'P')
                    {
                        $results['STATUS'] = "UPDATE FAILED! The supplied account password does match the one in the database for this account.";
                    }
                    else
                    {
                        $results['STATUS'] = "SERVICE ERROR trying to update account - DB response was: [" . $dbResult . ']';
                    }
                }
                else
                {
                    $results['STATUS'] = "ERROR! No account found!";
                }
            }
            else
            {
                //ADD NEW ACCOUNT
                //Some details need base64'ing as they will include all kinds of character formats
                $base64FirstName = $this->EncodeTextToSQLSafe($firstName);
                $base64Surname = $this->EncodeTextToSQLSafe($surname);
                $base64LoginPassword = $this->EncodeTextToSQLSafe($password);
                $base64AccountNotes = $this->EncodeTextToSQLSafe($accountNotes);
                $sql = "EXEC [gs1resolver_dataentry_db].[ADMIN_save_new_account]  '$memberPrimaryGLN', '$base64FirstName', '$base64Surname', '$base64LoginPassword', '$loginEmail', '$base64AccountNotes', '$administrator', $active";
                if($this->DBExec($sql))
                {
                    $results['STATUS'] = "New account created successfully";
                }
                else
                {
                    $results['STATUS'] = "SERVICE ERROR trying to create account";
                }
            }
        }
        else
        {
            $results['STATUS'] = 'ERROR: INACTIVE SESSION';
        }
        //$this->logThis('SaveAccountDetails $results: ' . print_r($results, true) );

        return $results;
    }


    public function IsAdministrator($sessionID, $administrationType) : string
    {
        $sql = "EXEC [gs1resolver_dataentry_db].[ADMIN_administrator_level] '$sessionID'";
        $result = $this->DBSelect($sql);
        if(isset($result[0]['administrator']))
        {
            $isAdmin = (string)$result[0]['administrator'];
        }
        else
        {
            $isAdmin = 'N';
        }

        return $isAdmin === $administrationType;
    }


    public function ADMIN_GetAccountsList()
    {
        $sql = 'CALL admin_list_accounts()';
        return $this->DBSelect($sql);
    }


    public function ADMIN_ChangePassword($accountId, $newPassword) : bool
    {
        $sql = "EXEC [gs1resolver_dataentry_db].[admin_change_password] $accountId, '$newPassword'";
        return $this->DBExec($sql);
    }

    /**
     * @param $sessionId
     * @return bool
     * Returns a true or false depending on whether the session is active or not
     */
    public function CheckSessionActive($sessionId) : bool
    {
        $sql = "EXEC [gs1resolver_dataentry_db].[is_session_active] '$sessionId'";
        $response = $this->DBSelect($sql);
        return (string)$response[0]['active'] === 'Y';
    }


    /**
     * @param $sessionId
     * @param $responseId
     * @param $ianaLanguage
     * @param $linkType
     * @param $context
     * @param $mimeType
     * @param $destinationURI
     * @param $friendlyLinkName
     * @param $fwqs
     * @param $active
     * @param $defaultLinkTypeFlag
     * @param $defaultIanaLanguageFlag
     * @param $defaultContextFlag
     * @param $defaultMimeTypeFlag
     * @return array
     */
    public function SaveExistingUriResponse($sessionId, $responseId, $ianaLanguage, $linkType, $context, $mimeType, $destinationURI, $friendlyLinkName, $fwqs, $active, $defaultLinkTypeFlag, $defaultIanaLanguageFlag, $defaultContextFlag, $defaultMimeTypeFlag) : array
    {
        $friendlyLinkName = $this->EncodeTextToSQLSafe($friendlyLinkName);

        if($this->CheckSessionActive($sessionId))
        {
            $sql = "EXEC [gs1resolver_dataentry_db].[save_existing_uri_response]  $responseId, '$linkType', '$ianaLanguage', '$context', '$mimeType', '$friendlyLinkName', '$destinationURI', $fwqs, $active, $defaultLinkTypeFlag, $defaultIanaLanguageFlag, $defaultContextFlag, $defaultMimeTypeFlag ";
            file_put_contents('php://stderr', "SaveExistingUriResponse SQL: " . print_r($sql, true) . PHP_EOL);
            $success = $this->DBExec($sql);
            if($success)
            {
                $result['STATUS'] = 'Existing URI Response Saved Successfully';
            }
            else
            {
                $result['STATUS'] = 'Database Error saving URI response: ' . print_r(sqlsrv_errors(), true);
            }

        }
        else
        {
            $result['STATUS'] = 'ERROR - Session Not Active';
        }

        return $result;
    }


    /**
     * @param $sessionId
     * @param $requestId
     * @param $linkType
     * @param $ianaLanguage
     * @param $context
     * @param $mime_type
     * @param $friendly_link_name
     * @param $destination_uri
     * @param $forward_request_querystrings
     * @param $active
     * @return array
     */
    public function SaveNewUriResponse($sessionId, $requestId, $linkType, $ianaLanguage, $context, $mime_type, $friendly_link_name, $destination_uri, $forward_request_querystrings, $active, $default_linktype, $default_iana_language, $default_context, $default_mime_type) : array
    {
        $friendly_link_name = $this->EncodeTextToSQLSafe($friendly_link_name);
        if($this->CheckSessionActive($sessionId))
        {
            $sql = "EXEC  [gs1resolver_dataentry_db].[save_new_uri_response]  $requestId, '$linkType', '$ianaLanguage', '$context', '$mime_type', '$friendly_link_name', '$destination_uri', '$forward_request_querystrings', $active,  $default_linktype, $default_iana_language, $default_context, $default_mime_type";

            $success = $this->DBExec($sql);
            if($success)
            {
                $result['STATUS'] = 'New URI Response Saved Successfully';
            }
            else
            {
                $result['STATUS'] = 'Database Error saving new URI response: ' . print_r(sqlsrv_errors(), true);
            }
        }
        else
        {
            $result['STATUS'] = 'ERROR - Session Not Active';
        }

        return $result;
    }


    /**
     * @param $sessionId
     * @param $requestId
     * @param $gs1KeyCode
     * @param $gs1KeyValue
     * @param $itemDescription
     * @param $uriPrefix1
     * @param $uriSuffix1
     * @param $uriPrefix2
     * @param $uriSuffix2
     * @param $uriPrefix3
     * @param $uriSuffix3
     * @param $uriPrefix4
     * @param $uriSuffix4
     * @param $defaultLinkType
     * @param $defaultIANALanguage
     * @param $defaultContext
     * @param $defaultMimeType
     * @param $includeInSitemap
     * @param $active
     * @return array
     * @throws Exception
     */
    public function SaveExistingURIRequest($sessionId, $requestId, $gs1KeyCode, $gs1KeyValue, $itemDescription,
                                           $uriPrefix1, $uriSuffix1, $uriPrefix2, $uriSuffix2, $uriPrefix3, $uriSuffix3,
                                           $uriPrefix4, $uriSuffix4, $includeInSitemap, $active) : array
    {
        if($this->CheckSessionActive($sessionId))
        {
            $itemDescription = $this->EncodeTextToSQLSafe($itemDescription);

            //Only save the request if there is NOT a duplicate request.

            //Returns either no rows if the search find no duplicate request rows in the database, or else a single record: dup_request_id
            $sql = "EXEC [gs1resolver_dataentry_db].[check_for_duplicate_request_record] $requestId, N'$gs1KeyCode', N'$gs1KeyValue',
             N'$uriPrefix1', N'$uriSuffix1', N'$uriPrefix2', N'$uriSuffix2', N'$uriPrefix3',  N'$uriSuffix3',
             N'$uriPrefix4', N'$uriSuffix4'";
            $response = $this->DBSelect($sql);

            if(count($response) === 0)
            {
                //We're good to save this request:
                $sql = "EXEC [gs1resolver_dataentry_db].[save_existing_uri_request] $requestId, N'$gs1KeyCode', N'$gs1KeyValue', 
                     N'$itemDescription', N'$uriPrefix1', N'$uriSuffix1', N'$uriPrefix2', N'$uriSuffix2', N'$uriPrefix3', N'$uriSuffix3', 
                                          N'$uriPrefix4', N'$uriSuffix4', N'$includeInSitemap', $active";
                $success = $this->DBExec($sql);
                if($success)
                {
                    $result['STATUS'] = 'Request URI saved Successfully';
                }
                else
                {
                    $result['STATUS'] = 'Database Error saving URI Request: ' . print_r(sqlsrv_errors(), true);
                }
            }
            else
            {
                //Send a link with the original request_id to the end user
                $duplicateRequestId = $response[0]['dup_request_id'];
                $result['STATUS'] = "WARNING - SAVE BLOCKED: You already have GS1 key '$gs1KeyCode' with value '$gs1KeyValue' in an existing URI record! <a href=\"edituri.html?uri=$duplicateRequestId\">Edit that record</a>";
            }
        }
        else
        {
            $result['STATUS'] = 'ERROR - Session Not Active';
        }

        return $result;
    }

    /**
     * @param $sessionId
     * @param $responseId
     * @return array
     */
    public function DeleteURIRequest($sessionId, $responseId) : array
    {
        if($this->CheckSessionActive($sessionId))
        {
            $sql = "EXEC [gs1resolver_dataentry_db].[delete_uri_request] $responseId";
            $success = $this->DBExec($sql);
            if($success)
            {
                $result['STATUS'] = 'Request Entry has been marked for deletion and will be removed in a few minutes';
            }
            else
            {
                $result['STATUS'] = 'Database Error deleting request entry: ' . print_r(sqlsrv_errors(), true);
            }
        }
        else
        {
            $result['STATUS'] = 'ERROR - Session Not Active';
        }

        return $result;
    }
    /**
     * @param $sessionId
     * @param $responseId
     * @return array
     */
    public function DeleteURIResponse($sessionId, $responseId) : array
    {
        if($this->CheckSessionActive($sessionId))
        {
            $sql = "EXEC [gs1resolver_dataentry_db].[delete_uri_response] $responseId";
            $success = $this->DBExec($sql);
            if($success)
            {
                $result['STATUS'] = 'Response URI deleted Successfully';
            }
            else
            {
                $result['STATUS'] = 'Database Error deleting  URI response: ' . print_r(sqlsrv_errors(), true);
            }
        }
        else
        {
            $result['STATUS'] = 'ERROR - Session Not Active';
        }

        return $result;
    }

    /**
     * Gets all the request URis for a particular account, if any found.
     * @param $sessionId
     * @param $firstLineNumber - the first line number to return - useful when paging on a web page
     * @param $maxNumberOfLines - the maximum number of lines to return
     * @return array
     */
    public function GetRequestURIs($sessionId, $firstLineNumber, $maxNumberOfLines) : array
    {
        $sql = "EXEC [gs1resolver_dataentry_db].[get_request_uris] '$sessionId', $firstLineNumber, $maxNumberOfLines";
        return $this->DBSelect($sql);
    }

    /**
     * @param $sessionId
     * @param $gs1KeyCode
     * @param $gs1KeyValue
     * @return array
     */
    public function SearchURIRequests($sessionId, $gs1KeyCode, $gs1KeyValue) : array
    {
        $result = array();

        if($this->CheckSessionActive($sessionId))
        {
            if($gs1KeyCode === "*" && $gs1KeyValue === "*")
            {
                //Well they want everything...!
                $this->GetRequestURIs($sessionId, 1, 1000);
                $sql = "";
            }
            elseif($gs1KeyValue === "*") // all the value but specific codes
            {
                $sql = "EXEC [gs1resolver_dataentry_db].[search_request_uris_by_gs1_key_code] '$sessionId', '$gs1KeyCode'";
            }
            elseif ($gs1KeyCode === "*") // all the codes but specific values
            {
                $sql = "EXEC [gs1resolver_dataentry_db].[search_request_uris_by_gs1_key_value] '$sessionId', '$gs1KeyValue'";
            }
            else  //specific code and value
            {
                $sql = "EXEC [gs1resolver_dataentry_db].[search_request_uris_by_gs1_key_code_and_value] '$sessionId', '$gs1KeyCode', '$gs1KeyValue'";
            }
            $this->logThis("$sessionId / $gs1KeyCode / $gs1KeyValue / $sql");
            $result = $this->DBSelect($sql);
        }
        return $result;
    }

    /**
     * @param $sessionID
     * @param $requestId
     * @return array
     */
    public function GetRequestURIForEdit($sessionID, $requestId) : array
    {
        $sql = "EXEC [gs1resolver_dataentry_db].[get_request_uri_for_edit] '$sessionID', $requestId";
        $result = $this->DBSelect($sql);
        $result[0]['item_description'] = $this->DecodeTextFromSQLSafe($result[0]['item_description']);
        return $result;
    }

    /**
     * Get the response URI for a given Request URI from the list in GetRequestURIs
     * @param $sessionId
     * @param $uriRequestId
     * @param $ianaLanguage
     * @return array
     */
    public function GetResponseURIsForEdit($sessionId, $uriRequestId) : array
    {
        $result = array();
        if($this->CheckSessionActive($sessionId))
        {
            $sql = "EXEC [gs1resolver_dataentry_db].[get_response_uris_for_request] '$sessionId', $uriRequestId";
            $result = $this->DBSelect($sql);
        }

        return $result;
    }



    /**
     * @param $sessionId
     * @return array
     * Lists GS1 MOs in the database if used by a Global Administrator, otherwise
     * just the GS1 MO belonging to the user's current session is returned.
     */
    public function GetGS1MOList($sessionId) : array
    {
        $result = array();
        if($this->CheckSessionActive($sessionId))
        {
            $sql = "EXEC [gs1resolver_dataentry_db].[get_session] '$sessionId'";
            $sessionData = $this->DBSelect($sql);

            //Administrator codes are:
            //G = Global Admin (can admin GS1 MOs, members, accounts - full super powers)
            //O = GS1 MO (can admin members, accounts)
            //M = member (can admin other accounts for this member)
            //N = no admin privileges (can only admin their own account)

            if($sessionData[0]['administrator'] === 'G')
            {
                $sql = 'EXEC [gs1resolver_dataentry_db].[list_gs1_mos]';
                $result = $this->DBSelect($sql);
            }
            else
            {
                //Only global administrator can choose GS1 MOs!
                //this output mimics the database coming back with just one record
                //so the JSON format is the same when output by the API.
                $result[0]['organisation_name'] = $sessionData[0]['organisation_name'];
                $result[0]['gs1_mo_primary_gln'] = $sessionData[0]['gs1_mo_primary_gln'];
            }
        }
        return $result;
    }


    /**
     * @param $sessionId
     * @param $gs1MOPrimaryGln
     * @return array
     * Returns a list of members belonging to a GS1 MO if the user's account has
     * this privilege.
     */
    public function GetMemberListForGS1MO($sessionId, $gs1MOPrimaryGln) : array
    {
        $result = array();
        if($this->CheckSessionActive($sessionId))
        {
            $sql = "EXEC [gs1resolver_dataentry_db].[get_session] '$sessionId'";
            $sessionData = $this->DBSelect($sql);

            //Administrator codes are:
            //G = Global Admin (can admin GS1 MOs, members, accounts)
            //O = GS1 MO (can admin members, accounts)
            //M = member (can admin other accounts for this member)
            //N = no admin privileges (can only admin their own account)

            if($sessionData[0]['administrator'] === 'G' || $sessionData[0]['administrator'] === 'O')
            {
                $sql = "EXEC [gs1resolver_dataentry_db].[list_members_for_gs1_mo] '$gs1MOPrimaryGln'";
                $result = $this->DBSelect($sql);
            }
            else
            {
                //Only global administrator or GS1 MO can choose members!
                //this output mimics the database coming back with just one record
                //so the JSON format is the same when output by the API.
                $result[0]['member_name'] = $sessionData[0]['member_name'];
                $result[0]['member_primary_gln'] = $sessionData[0]['gs1_mo_primary_gln'];
            }

        }
        return $result;
    }

    /**
     * Returns a list of GCP Redirects where MOs and/or their members wish to have many or all of
     * their resolving processed via their own machine. Used by the BUILD function to generate
     * a JSON list in the MongoDB database
     * @return array
     */
    public function BUILD_GetGCPResolvesList() : array
    {
        $sql = "EXEC [gs1resolver_dataentry_db].[BUILD_get_gcp_resolves_list]";
        $result = $this->DBSelect($sql);
        return $result;
    }

    /**
     * As part of the health checking of the responsee destinatiomn urls, get
     * a list of responses to check
     * @param $minUriResponseId
     * @return array
     */
    public function HEALTH_GetResponsesToCheck($minUriResponseId) : array
    {
        $sql = "EXEC [gs1resolver_dataentry_db].[HEALTH_get_1000_responses_to_healthcheck] $minUriResponseId";
        $result = $this->DBSelect($sql);
        return $result;
    }


    /**
     * Saves result of Healthcheck to database
     * @param $uriResponseId
     * @param $healthStatusRAG
     * @param $attemptCount
     * @return bool
     */
    public function HEALTH_SaveHealthCheck($uriResponseId, $healthStatusRAG, $attemptCount, $httpCode, $errorResponse) : bool
    {
        $sql = "EXEC [gs1resolver_dataentry_db].[HEALTH_save_healthcheck] $uriResponseId, '$healthStatusRAG', $attemptCount, $httpCode, '$errorResponse'";
        $response = $this->DBExec($sql);
        return $response;
    }



    /**
     * @param $sessionId
     * @param $memberPrimaryGln
     * @return array
     * Gets a list of accounts for a given member, if the user has that privilege
     */
    public function GetAccountListForMember($sessionId, $memberPrimaryGln) : array
    {
        $result = array();
        if($this->CheckSessionActive($sessionId))
        {
            $sql = "EXEC [gs1resolver_dataentry_db].[get_session] '$sessionId'";
            $sessionData = $this->DBSelect($sql);

            //Administrator codes are:
            //G = Global Admin (can admin GS1 MOs, members, accounts)
            //O = GS1 MO (can admin members, accounts)
            //M = member (can admin other accounts for this member)
            //N = no admin privileges (can only admin their own account)
            if($sessionData[0]['administrator'] !== 'N')
            {
                $sql = "EXEC [gs1resolver_dataentry_db].[list_accounts_for_member] '$memberPrimaryGln'";
                $result = $this->DBSelect($sql);
            }
            else
            {
                //Only accounts with no privileges are barred from listing accounts
                //for a member. This code mimics their own account data as if coming from the database
                $result[0]['account_id'] = $sessionData[0]['account_id'];
                $result[0]['firstname'] = $sessionData[0]['firstname'];
                $result[0]['surname'] = $sessionData[0]['surname'];
            }
        }
        return $this->DecodeDataFromSQLSafe($result);
    }


    /**
     * @return array
     * @throws Exception
     */
    public function GetActiveLinkTypesList()
    {
        $sql = 'EXEC [gs1resolver_dataentry_db].[get_active_linktypes_list]';
        return $this->DBSelect($sql);
    }

    /**
     * @return array
     * @throws Exception
     */
    public function GetLinkTypesList()
    {
        $sql = 'EXEC [gs1resolver_dataentry_db].[get_linktypes_list]';
        return $this->DBSelect($sql);
    }



    /**
     * @return array
     * @throws Exception
     */
    public function GetContextsList()
    {
        $sql = 'EXEC [gs1resolver_dataentry_db].[get_contexts_list]';
        return $this->DBSelect($sql);
    }



    /**
     * @return array
     * @throws Exception
     */
    public function GetMimeTypesList()
    {
        $sql = 'EXEC [gs1resolver_dataentry_db].[get_mime_types_list]';
        return $this->DBSelect($sql);
    }




    /**
     * @param $sessionId
     * @return array
     * @throws Exception
     */
    public function CreateNewURIRequest($sessionId) : array
    {
        if($this->CheckSessionActive($sessionId))
        {
            $sql = "EXEC [gs1resolver_dataentry_db].[create_new_uri_request] '$sessionId'";
            $response = $this->DBSelect($sql);
            $result['new_uri_request_id'] = $response[0]['new_uri_request_id'];
            $result['STATUS'] = 'New URI Request Created Successfully';
        }
        else
        {
            $result['STATUS'] = 'ERROR - Session Not Active';
        }
        return $result;
    }

    /**
     * @param $gs1KeyCode
     * @return array
     * @throws Exception
     */
    public function GetGS1KeyComponentsList($gs1KeyCode) : array
    {
        $sql = "EXEC [gs1resolver_dataentry_db].[get_key_code_components_list] N'$gs1KeyCode'";
        return $this->DBSelect($sql);
    }


    /**
     * @param $sessionId
     * @param $requestId
     * @return array
     * @throws Exception
     */
    public function GetRequestURIStatus($sessionId, $requestId) : array
    {
        $result = array();

        if($this->CheckSessionActive($sessionId))
        {
            $result = array();
            $sql = "EXEC [gs1resolver_dataentry_db].[get_request_uri_status] $requestId";
            $response = $this->DBSelect($sql, false);
            if(count($response) === 0)
            {
                $result['STATUS'] = 'Error: This request entry is not known';
            }
            elseif($response[0]['active'] === 1 && $response[0]['api_builder_processed'] === 1)
            {
                $result['STATUS'] = 'Active';
            }
            elseif($response[0]['active'] === 0 && $response[0]['api_builder_processed'] === 1)
            {
                $result['STATUS'] = 'Not Active (New or Suspended)';
            }
            elseif($response[0]['active'] === 1 && $response[0]['api_builder_processed'] === 0)
            {
                $result['STATUS'] = 'Queued for Activation';
            }
            elseif($response[0]['active'] === 0 && $response[0]['api_builder_processed'] === 0)
            {
                $result['STATUS'] = 'Queued for Suspension';
            }
            else
            {
                $result['STATUS'] = 'Unknown error at this moment';
            }
        }
        else
        {
            $result['STATUS'] = 'ERROR - Session Not Active - please login again';
        }

        return $result;
    }


    /**
     * @param $sessionId
     * @param $gs1KeyCode
     * @param $componentOrder
     * @param $componentUriId
     * @param $componentName
     * @param $acceptedFormats
     * @return array
     */
    public function SaveNewGS1KeyComponent($sessionId, $gs1KeyCode, $componentOrder, $componentUriId, $componentName, $acceptedFormats) : array
    {
        if($this->CheckSessionActive($sessionId) && $this->IsAdministrator($sessionId, 'G'))
        {
            $sql = "EXEC ADMIN_save_new_gs1_key_component '$gs1KeyCode', $componentOrder, '$componentUriId', '$componentName', '$acceptedFormats'";
            $response = $this->DBExec($sql);
            if($response)
            {
                $result['STATUS'] = 'New GS1 Key Component INSERTED Successfully';
            }
            else
            {
                $result['STATUS'] = 'GS1 Key Component Insert FAILED';
            }
        }
        else
        {
            $result['STATUS'] = 'ERROR - Session Not Active or User Does Not Have Global Administrative Privileges';
        }
        return $result;
    }


    /**
     * @param $sessionId
     * @param $primaryKeyValue
     * @param $gs1KeyCode
     * @param $componentOrder
     * @param $componentUriId
     * @param $componentName
     * @param $acceptedFormats
     * @return array
     */
    public function UpdateGS1KeyComponentsList($sessionId, $primaryKeyValue, $gs1KeyCode, $componentOrder, $componentUriId, $componentName, $acceptedFormats) : array
    {
        if($this->CheckSessionActive($sessionId) && $this->IsAdministrator($sessionId, 'G'))
        {
            $sql = "EXEC ADMIN_save_existing_gs1_key_components_item $primaryKeyValue, '$gs1KeyCode', $componentOrder, '$componentUriId', '$componentName', '$acceptedFormats'";
            $response = $this->DBExec($sql);
            if($response)
            {
                $result['STATUS'] = 'GS1 Key Component Updated Successfully';
            }
            else
            {
                $result['STATUS'] = 'GS1 Key Component Update FAILED';
            }
        }
        else
        {
            $result['STATUS'] = 'ERROR - Session Not Active or User Does Not Have Global Administrative Privileges';
        }
        return $result;
    }

    /**
     * Saves new GS1 Member Organisation to database
     * @param $sessionId
     * @param $organisation_name
     * @param $gs1_mo_primary_gln
     * @return array
     */
    public function SaveNewGS1MO($sessionId, $organisation_name, $gs1_mo_primary_gln) : array
    {
        if($this->CheckSessionActive($sessionId) && $this->IsAdministrator($sessionId, 'G'))
        {
            $sql = "EXEC [gs1resolver_dataentry_db].[ADMIN_save_new_gs1mo] '$gs1_mo_primary_gln', '$organisation_name'";
            $response = $this->DBExec($sql);
            if($response)
            {
                $result['STATUS'] = "New GS1 MO '$organisation_name' with primary GLN $gs1_mo_primary_gln created successfully";
            }
            else
            {
                $result['STATUS'] = "FAILED TO SAVE GS1 MO '$organisation_name' with primary GLN $gs1_mo_primary_gln";
            }
        }
        else
        {
            $result['STATUS'] = 'ERROR - Session Not Active or User Does Not Have Global Administrative Privileges';
        }
        return $result;

    }


    /**
     * Saves new member to database
     * @param $sessionId
     * @param $member_name
     * @param $member_primary_gln
     * @param $gs1_mo_primary_gln
     * @param $notes
     * @param $active
     * @param $member_logo_url
     * @return array
     */
    public function SaveNewMember($sessionId, $member_name, $member_primary_gln, $gs1_mo_primary_gln, $notes, $active, $member_logo_url) : array
    {
        if($this->CheckSessionActive($sessionId) && ($this->IsAdministrator($sessionId, 'G') || $this->IsAdministrator($sessionId, 'O')))
        {
            $sql = "EXEC [gs1resolver_dataentry_db].[ADMIN_save_new_member] '$member_primary_gln', '$member_name', '$gs1_mo_primary_gln', '$notes', $active, '$member_logo_url'";
            $response = $this->DBExec($sql);
            if($response)
            {
                $result['STATUS'] = "New member '$member_name' with primary GLN $member_primary_gln created successfully";
            }
            else
            {
                $result['STATUS'] = "FAILED TO SAVE Member '$member_name' with primary GLN $member_primary_gln";
            }
        }
        else
        {
            $result['STATUS'] = 'ERROR - Session Not Active or User Does Not Have Global or Member Organisation Administrative Privileges';
        }
        return $result;

    }


    /**
     * @param $sessionId
     * @param $primaryKeyValue
     * @param $gs1KeyCode
     * @param $numericCode
     * @param $codeName
     * @param $acceptedFormats
     * @return array
     */
    public function UpdateGS1KeyCodesList($sessionId, $primaryKeyValue, $gs1KeyCode, $numericCode, $codeName, $acceptedFormats) : array
    {
        if($this->CheckSessionActive($sessionId) && $this->IsAdministrator($sessionId, 'G'))
        {
            $sql = "EXEC ADMIN_save_existing_gs1_key_codes_item $primaryKeyValue, '$gs1KeyCode', '$numericCode', '$codeName', '$acceptedFormats'";
            $response = $this->DBExec($sql);
            if($response)
            {
                $result['STATUS'] = 'GS1 Key Code Updated Successfully';
            }
            else
            {
                $result['STATUS'] = 'GS1 Key Code Update FAILED';
            }
        }
        else
        {
            $result['STATUS'] = 'ERROR - Session Not Active or User Does Not Have Global Administrative Privileges';
        }
        return $result;
    }


    /**
     * @param $sessionId
     * @param $primaryKeyValue
     * @param $linkTypeName
     * @param $linkTypeReferenceUrl
     * @param $applicableGS1KeyCode
     * @return array
     */
    public function UpdatelinkTypesList($sessionId, $primaryKeyValue, $linkTypeName, $linkTypeReferenceUrl, $applicableGS1KeyCode) : array
    {
        if($this->CheckSessionActive($sessionId) && $this->IsAdministrator($sessionId, 'G'))
        {
            $sql = "EXEC [gs1resolver_dataentry_db].[ADMIN_save_existing_linktypes_item] $primaryKeyValue, '$linkTypeName', '$linkTypeReferenceUrl', '$applicableGS1KeyCode'";
            $response = $this->DBExec($sql);
            if($response)
            {
                $result['STATUS'] = 'LinkType Updated Successfully';
            }
            else
            {
                $result['STATUS'] = 'LinkType Update FAILED';
            }
        }
        else
        {
            $result['STATUS'] = 'ERROR - Session Not Active or User Does Not Have Global Administrative Privileges';
        }
        return $result;
    }


    /**
     * @param $sessionId
     * @param $primaryKeyValue
     * @param $contextValue
     * @param $contextDescription
     * @param $defaultContextFlag
     * @return array
     */
    public function UpdateContextsList($sessionId, $primaryKeyValue, $contextValue, $contextDescription, $defaultContextFlag) : array
    {
        if($this->CheckSessionActive($sessionId) && $this->IsAdministrator($sessionId, 'G'))
        {
            $sql = "EXEC [gs1resolver_dataentry_db].[ADMIN_save_existing_contexts_item] $primaryKeyValue, '$contextValue', '$contextDescription', '$defaultContextFlag'";
            $response = $this->DBExec($sql);
            if($response)
            {
                $result['STATUS'] = 'Context Updated Successfully';
            }
            else
            {
                $result['STATUS'] = 'Context Update FAILED';
            }
        }
        else
        {
            $result['STATUS'] = 'ERROR - Session Not Active or User Does Not Have Global Administrative Privileges';
        }
        return $result;
    }



    /**
     * @param $sessionId
     * @param $primaryKeyValue
     * @param $mimeTypeValue
     * @param $mimeTypeDescription
     * @param $defaultMimeTypeFlag
     * @return array
     */
    public function UpdateMimeTypesList($sessionId, $primaryKeyValue, $mimeTypeValue, $mimeTypeDescription, $defaultMimeTypeFlag) : array
    {
        if($this->CheckSessionActive($sessionId) && $this->IsAdministrator($sessionId, 'G'))
        {
            $sql = "EXEC [gs1resolver_dataentry_db].[ADMIN_save_existing_mime_types_item] $primaryKeyValue, '$mimeTypeValue', '$mimeTypeDescription', '$defaultMimeTypeFlag'";
            $response = $this->DBExec($sql);
            if($response)
            {
                $result['STATUS'] = 'Mime Type Updated Successfully';
            }
            else
            {
                $result['STATUS'] = 'Mime Type Update FAILED';
            }
        }
        else
        {
            $result['STATUS'] = 'ERROR - Session Not Active or User Does Not Have Global Administrative Privileges';
        }
        return $result;
    }



    /**
     * @param $sessionId
     * @param $linkTypeName
     * @param $linkTypeReferenceUrl
     * @param $applicableGS1KeyCode
     * @return array
     */
    public function SaveNewLinkType($sessionId, $linkTypeName, $linkTypeReferenceUrl, $applicableGS1KeyCode) : array
    {
        if($this->CheckSessionActive($sessionId) && $this->IsAdministrator($sessionId, 'G'))
        {
            $sql = "EXEC [gs1resolver_dataentry_db].[ADMIN_save_new_linktypes_item] '$linkTypeName', '$linkTypeReferenceUrl', '$applicableGS1KeyCode'";
            $response = $this->DBExec($sql);
            if($response)
            {
                $result['STATUS'] = "New LinkType '$linkTypeName' INSERTED Successfully";
            }
            else
            {
                $result['STATUS'] = "New LinkType '$linkTypeName' Insert FAILED";
            }
        }
        else
        {
            $result['STATUS'] = 'ERROR - Session Not Active or User Does Not Have Global Administrative Privileges';
        }
        return $result;
    }



    /**
     * @param $sessionId
     * @param $contextValue
     * @param $contextDescription
     * @param $defaultContextFlag
     * @return array
     */
    public function SaveNewContext($sessionId, $contextValue, $contextDescription, $defaultContextFlag) : array
    {
        if($this->CheckSessionActive($sessionId) && $this->IsAdministrator($sessionId, 'G'))
        {
            $sql = "EXEC [gs1resolver_dataentry_db].[ADMIN_save_new_contexts_item] '$contextValue', '$contextDescription', '$defaultContextFlag'";
            $response = $this->DBExec($sql);
            if($response)
            {
                $result['STATUS'] = "New Context '$contextValue' INSERTED Successfully";
            }
            else
            {
                $result['STATUS'] = "New Context '$contextValue' Insert FAILED";
            }
        }
        else
        {
            $result['STATUS'] = 'ERROR - Session Not Active or User Does Not Have Global Administrative Privileges';
        }
        return $result;
    }


    /**
     * @param $sessionId
     * @param $mimeTypeValue
     * @param $mimeTypeDescription
     * @param $defaultMimeTypeFlag
     * @return array
     */
    public function SaveNewMimeType($sessionId, $mimeTypeValue, $mimeTypeDescription, $defaultMimeTypeFlag) : array
    {
        if($this->CheckSessionActive($sessionId) && $this->IsAdministrator($sessionId, 'G'))
        {
            $sql = "EXEC [gs1resolver_dataentry_db].[ADMIN_save_new_mime_types_item] '$mimeTypeValue', '$mimeTypeDescription', '$defaultMimeTypeFlag'";
            $response = $this->DBExec($sql);
            if($response)
            {
                $result['STATUS'] = "New Mime Type '$mimeTypeValue' INSERTED Successfully";
            }
            else
            {
                $result['STATUS'] = "New Mime Type '$mimeTypeValue' Insert FAILED";
            }
        }
        else
        {
            $result['STATUS'] = 'ERROR - Session Not Active or User Does Not Have Global Administrative Privileges';
        }
        return $result;
    }



    /**
     * @param $haystack
     * @param $needle
     * @return bool
     */
    private function startsWith($haystack, $needle) : bool
    {
        return (strpos($haystack, $needle) === 0);
    }

    /**
     * Logs an entry - often used for recording errors, as they are saved into /var/log/apache2/error.log
     * @param $logMessage
     */
    public function logThis($logMessage) : void
    {
        file_put_contents("php://stderr", '[' . date('Y-m-d h:i:s') . "]  $logMessage" . PHP_EOL);
    }


    public function auditThis($logMessage) : void
    {
        $sql = "EXEC [gs1resolver_dataentry_db].[logThis] '" . gethostname() . "', '$logMessage'";
        try
        {
            sqlsrv_query($this->db, $sql);
        }
        catch (Exception $sqle)
        {
            $this->logThis("logThis Exception: $logMessage");
        }
    }


    public function BUILD_GetURIRequestCount()
    {
        $sql = 'EXEC [gs1resolver_dataentry_db].[BUILD_GetURIRequestCount]';
        $result = $this->DBSelect($sql);
        if(isset($result[0]['uri_request_count']))
        {
            return (int)$result[0]['uri_request_count'];
        }
        return -1; //denotes error
    }

    public function BUILD_GetURIRequests()
    {
        $sql = 'EXEC [gs1resolver_dataentry_db].[BUILD_GetURIRequests] 10000';
        return $this->DBSelect($sql);
    }

    public function BUILD_GetURIResponses($uriRequestId)
    {
        $sql = "EXEC [gs1resolver_dataentry_db].[BUILD_GetURIResponses] $uriRequestId";
        return $this->DBSelect($sql);
    }

    public function BUILD_FlagUriRecordAsBuilt($uriRequestId)
    {
        $sql = "EXEC [gs1resolver_dataentry_db].[BUILD_FlagUriRequestAsBuilt] $uriRequestId";
        return $this->DBExec($sql);
    }

    public function BUILD_SetToRequireRebuild($gs1_key_code, $gs1_key_value)
    {
        $sql = "EXEC [gs1resolver_dataentry_db].[BUILD_SetToRequireRebuild] '$gs1_key_code', '$gs1_key_value'";
        return $this->DBExec($sql);
    }


    public function BUILD_DeleteUriRecord($uriRequestId)
    {
        $sql = "EXEC [gs1resolver_dataentry_db].[BUILD_DeleteUriRecord] $uriRequestId";
        return $this->DBExec($sql);
    }




}