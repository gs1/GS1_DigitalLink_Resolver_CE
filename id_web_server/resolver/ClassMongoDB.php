<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 2018-11-27
 * Time: 09:43
 */
require 'vendor/autoload.php';
date_default_timezone_set('UTC');
class ClassMongoDB
{
    private $mongoDbClient;

    public function __construct()
    {
        //$mongoDbServer can have values 'L" for local host on 127.0.0.1, "D" for data-london-1 server, 'A' for MongoDB Atlas cluster
        $ini = parse_ini_file('/var/www/config/gs1resolver.ini');
        $connectionString = $ini['mongodb_connection_string'];
        $this->mongoDbClient = new MongoDB\Client($connectionString);
    }

    /**
     * Find the URI exactly matching the supplied GS1 Key and value
     * @param $gs1Key
     * @param $gs1Value
     * @return array|object|null
     */
    public function readURIRecord($gs1Key, $gs1Value)
    {
        //Set up the correct collection:
        $collection = $this->mongoDbClient->gs1resolver->uri;

        //Build the "_id" value which will be used to serach MongoDB - format is "/gs1Key/gs1Value"
        //Uses $this->formatGS1Value to make sure that the value is consistent with the format of the gs1Key stored
        ////in the database:
        $id = '/' . $gs1Key . '/' . $this->formatGS1Value($gs1Key, $gs1Value);

        //Search and retrieve the document
        try
        {
            $result = $collection->findOne(['_id' => $id]);
        }
        catch (MongoDB\Driver\Exception\ConnectionTimeoutException $cte)
        {
            file_put_contents('php://stderr', "Error calling MongodDB: " . print_r($cte, true). PHP_EOL);
            return json_decode('{"Error", "MongoDB Database Connection Failed. Please contact the Resolver administrator - error log on server for details"}');
        }

        //Return the complete document as a result
        file_put_contents('php://stderr', "JSON version of MongoDB URI record: " . json_encode($result). PHP_EOL);
        return $result;
    }

    /**
     * Find the Well-Known record for GS1 Resolver
     * @return array|object|null
     */
    public function readWellKnownRecord()
    {
        //Set up the correct collection:
        $collection = $this->mongoDbClient->gs1resolver->wellknown;

        //Search and retrieve the document
        try
        {
            $result = $collection->findOne(['_id' => 'gs1resolver.json']);
        }
        catch (MongoDB\Driver\Exception\ConnectionTimeoutException $cte)
        {
            file_put_contents('php://stderr', "Error calling MongodDB: " . print_r($cte, true). PHP_EOL);
            return json_decode('{"Error", "MongoDB Database Connection Failed. Please contact the Resolver administrator - error log on server for details"}');
        }

        //Return the complete document as a result
        file_put_contents('php://stderr', "JSON version of Well-Known record: " . json_encode($result). PHP_EOL);
        return $result;
    }

    /**
     * Searches for a GCP record that matches the start of the GS1 Value supplied
     * @param $gs1Key
     * @param $gs1Value
     * @return array|object|null
     */
    public function readGCPRecord($gs1Key, $gs1Value)
    {
        //Set up the correct collection:
        $collection = $this->mongoDbClient->gs1resolver->gcp;

        //Build the "_id" value which will be used to serach MongoDB - format is "/gs1Key/gs1Value"
        //Uses $this->formatGS1Value to make sure that the value is consistent with the format of the gs1Key stored
        ////in the database:
        $formattedGS1Value = $this->formatGS1Value($gs1Key, $gs1Value);

        $result = null;
        $searchCharsLength = strlen($gs1Value) - 1;
        while($result === null)
        {
            $id = '/' . $gs1Key . '/' . $gs1Value;
            file_put_contents('php://stderr', "Searching MongoDB GCP record: $id" . PHP_EOL);
            try
            {
                $result = $collection->findOne(['_id' => $id]);
            }
            catch (MongoDB\Driver\Exception\ConnectionTimeoutException $cte)
            {
                file_put_contents('php://stderr', "Error calling MongodDB: " . print_r($cte, true). PHP_EOL);
                return json_decode('{"Error", "MongoDB Database Connection Failed. Please contact the Resolver administrator - error log on server for details"}');
            }
            if($result === null && $searchCharsLength > 3)
            {
                $searchCharsLength--;
                $gs1Value = substr($gs1Value, 0, $searchCharsLength);
            }
            else
            {
                break;
            }
        }

        //Return the complete document as a result
        file_put_contents('php://stderr', "JSON version of MongoDB GCP record: " . json_encode($result). PHP_EOL);
        return $result;
    }


    private function formatGS1Value($gs1Key, $gs1Value)
    {
        //TODO: Add formats for other GS1 keys
        if(strtolower($gs1Key) === 'gtin')
        {
            while(strlen($gs1Value) < 14)
            {
                $gs1Value = '0' . $gs1Value;
            }
        }

        return $gs1Value;
    }
}