<?php
/**
 * Created by IntelliJ IDEA.
 * User: nick
 * Date: 2019-02-14
 * Time: 11:47
 */

class ClassGS1DigitalLink
{
    private $gs1dl_toolkit_server_domain;

    public function __construct()
    {
        $ini = parse_ini_file('/var/www/config/gs1resolver.ini');
        $this->gs1dl_toolkit_server_domain = $ini['gs1dl_toolkit_server_domain'];
    }


    public function decodeDigitalLinkURL($url)
    {
        $response = json_decode($this->executeURL($url));
        return $response;
    }

    /**
     * @param $uri
     * @return bool|string
     */
    private function executeURL($uri)
    {
        $errorOccurred = false;
        $curlErrorMessage = '';
        $jsonResponse = '';
        $curl = curl_init();

        if (!$curl)
        {
            error_log('ERROR: Could not set up CURL to access digital link service!');
            $errorOccurred = true;
        }
        else
        {
            //set digital link toolkit domain and choose a random port number between 3000 and 3009
            $callURL = $this->gs1dl_toolkit_server_domain . ":" . rand(3000, 3009) . $uri;

            // Set the file URL to fetch through cURL
            file_put_contents('php://stderr', $callURL . PHP_EOL);

            curl_setopt($curl, CURLOPT_URL, $callURL);

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
                $errorOccurred = true;
                $curlErrorMessage = curl_error($curl);
            }
            // close cURL resource to free up system resources
            curl_close($curl);
        }
        if($errorOccurred)
        {
            file_put_contents('php://stderr', "WARNING: Digital Link server on $callURL error: " . $curlErrorMessage . PHP_EOL);
            $jsonResponse = '';
        }
        //Return the result
        return $jsonResponse;
    }

}
