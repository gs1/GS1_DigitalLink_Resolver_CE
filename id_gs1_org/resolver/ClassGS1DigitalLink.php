<?php
/**
 * Created by IntelliJ IDEA.
 * User: nick
 * Date: 2019-02-14
 * Time: 11:47
 */

class ClassGS1DigitalLink
{
    public function __construct()
    {
    }


    public function decodeDigitalLinkURL($url)
    {
        $response = json_decode($this->executeURL($url));
        return $response;
    }


    private function executeURL($uri)
    {
        $errorOccured = false;
        $curlErrorMessage = '';
        $curl = curl_init();

        if (!$curl)
        {
            error_log('ERROR: Could not set up CURL to access digital link service!');
            $errorOccured = true;
        }
        else
        {
            //choose a random port number between 3000 and 3009
            $calldlURL = "http://127.0.0.1:" . rand(3000, 3009) . $uri;
            // Set the file URL to fetch through cURL
            file_put_contents('php://stderr', $calldlURL . PHP_EOL);

            curl_setopt($curl, CURLOPT_URL, $calldlURL);

            // Fail the cURL request if response code = 400 (like 404 errors)
            curl_setopt($curl, CURLOPT_FAILONERROR, true);

            // Return the actual result of the curl result instead of success code
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

            // Wait for 10 seconds to connect, set 0 to wait indefinitely
            curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 10);

            // Execute the cURL request for a maximum of 50 seconds
            curl_setopt($curl, CURLOPT_TIMEOUT, 50);

            // Do not check the SSL certificates
            //curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
            //curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

            // Fetch the URL and save the content in $jsonResponse variable
            $jsonResponse = curl_exec($curl);

            // Check if any error has occurred - and if so, call the command-line (ClI)
            // version of the digital link server (which is a bit slower).
            // But take the opportunity to start the digital link servers
            if (curl_errno($curl))
            {
                $errorOccured = true;
                $curlErrorMessage = curl_error($curl);
            }
            // close cURL resource to free up system resources
            curl_close($curl);
        }
        if($errorOccured)
        {
            file_put_contents('php://stderr', "WARNING: Digital Link server on $calldlURL error: " . $curlErrorMessage . PHP_EOL);
            $jsonResponse = $this->decodeDigitalLinkURL_usingCLI($uri, true);
            $this->startDLWebServers();
            //$jsonResponse = $this->executeURL($uri);
        }
        //Return the result
        return $jsonResponse;
    }


    public function decodeDigitalLinkURL_usingCLI($url, $returnJSONFlag)
    {
        file_put_contents('php://stderr', "WARNING: Calling slower CLI version of Digital Link service" .  PHP_EOL);
        $cmd = "node /var/www/digitallink_toolkit/cli.js \"$url\"";
        $response =$this->executeCLI($cmd);
        if($returnJSONFlag)
        {
            return $response;
        }
        return json_decode($response);
    }


    private function startDLWebServers()
    {
        file_put_contents('php://stderr', "UPDATE: Starting Digital Link Toolkit Servers" .  PHP_EOL);
        $cmd = "/bin/bash /var/www/digitallink_toolkit/digilink_toolkit_servers_start.sh > /dev/null 2>/dev/null &";
        $response = $this->executeCLI($cmd);
        file_put_contents('php://stderr', "$response" . PHP_EOL);
        file_put_contents('php://stderr', "UPDATE: Digital Link Toolkit Servers running" .  PHP_EOL);
    }



    private function executeCLI($cmd)
    {
        file_put_contents('php://stderr', "Digital Link COMMAND: $cmd" . PHP_EOL);

        $output = shell_exec($cmd);
        file_put_contents('php://stderr', "Digital Link  OUTPUT: $output" . PHP_EOL);

        if($output === null)
        {
            return '{}';
        }
        file_put_contents('php://stderr', 'OUTPUT IS: ' . print_r($output, true) .  PHP_EOL);
        return $output;
    }
}
