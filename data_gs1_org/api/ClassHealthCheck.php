<?php
require_once 'ClassDBAccess.php';

class ClassHealthCheck
{
    private $dbAccess;
    public function __construct()
    {
        $this->dbAccess = new ClassDBAccess();
    }

    /**
     * Tests all responses to see if they work
     * @return array
     */
    public function PerformHealthCheck() : array
    {
        $testCount = 0;
        $greenCount = 0;
        $redCount = 0;
        $minResponseID = 0;
        $uriResponseId = 0;
        $stopFlag = false;

        while(!$stopFlag)
        {
            $testList = $this->dbAccess->HEALTH_GetResponsesToCheck($minResponseID);
            if(count($testList) === 0)
            {
                $stopFlag = true;
            }

            //the foreach won't operate in any case if count($testList) === 0
            foreach($testList as $test)
            {
                $testCount++;
                $uriResponseId = $test['uri_response_id'];
                $healthStatusRAG = '';
                $attemptCount = $test['attemptCount'];
                $errorResponse = '';

                $result = $this->testURL($test['destination_uri']);
                $httpCode = $result['HTTPCODE'];
                $errorResponse =  $result['INFO'] . ' - ' . $result['CURLERROR'];

                if($httpCode > 399)
                {
                    $healthStatusRAG = 'R';
                    $redCount += 1;
                    $attemptCount += 1;
                }
                else
                {
                    $healthStatusRAG = 'G';
                    $greenCount += 1;
                    $attemptCount = 0;
                }

                $this->dbAccess->HEALTH_SaveHealthCheck($uriResponseId, $healthStatusRAG, $attemptCount, $httpCode, $errorResponse);
            }
        }
        $minResponseID = $uriResponseId + 1;

        $result = array();
        $result['TESTCOUNT'] = $testCount;
        $result['REDCOUNT'] = $redCount;
        $result['GREENCOUNT'] = $greenCount;

        return $result;
    }

    /**
     * @param $uri
     * @return array
     */
    private function testURL($uri) : array
    {
        $result = array();
        $curl = curl_init();

        if (!$curl) {
            $result['INFO'] = 'Could not initialize a cURL handle';
            $result['CURLERROR'] = '999';
            $result['HTTPCODE'] = 999;
        }


        curl_setopt($curl, CURLOPT_URL, $uri);

        // Fail the cURL request if response code = 400 (like 404 errors)
        curl_setopt($curl, CURLOPT_FAILONERROR, true);

        // Return the actual result of the curl result instead of success code
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

        // Wait for 10 seconds to connect, set 0 to wait indefinitely
        curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 10);

        // Execute the cURL request for a maximum of 30 seconds
        curl_setopt($curl, CURLOPT_TIMEOUT, 30);

        // Do not check the SSL certificates
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

        // Fetch the URL and save the content in $jsonResponse variable
        $jsonResponse = curl_exec($curl);

        // Check if any error has occurred - and if so, call the command-line (ClI)
        // version of the digital link server (which is a bit slower).
        // But take the opportunity to start the digital link servers
        if (curl_errno($curl))
        {
            $result['INFO'] = curl_error($curl);
            $result['CURLERROR'] = curl_errno($curl);
            $result['HTTPCODE'] = 999;
        }
        else
        {
            $result['INFO'] = 'OK';
            $result['CURLERROR'] = 0;
            $result['HTTPCODE'] = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        }
        // close cURL resource to free up system resources
        curl_close($curl);

        //Return the result
        return $result;
    }
}