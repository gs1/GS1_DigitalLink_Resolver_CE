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

    public function getDocuments($fromUnixTime)
    {
        //Set up the correct collection:
        $collection = $this->mongoDbClient->gs1resolver->uri;
        $document = array();
        $counter = 0;

        //Search and retrieve the document
        try
        {
            $docs = array();
            $cursor = $collection->find(['unixtime' => ['$gte' => intval($fromUnixTime)]]);
            foreach ($cursor as $doc)
            {
                array_push($docs, $doc);
                $counter ++;
            }
        }
        catch (MongoDB\Driver\Exception\ConnectionTimeoutException $cte)
        {
            file_put_contents('php://stderr', "Error calling MongodDB: " . print_r($cte, true) . PHP_EOL);
            return json_decode('{"Error", "MongoDB Database Connection Failed. Please contact the Resolver administrator - error log on server for details"}');
        }

        //Return the complete document as a result
        file_put_contents('php://stderr', "JSON version of MongoDB URI record: " . json_encode($cursor) . PHP_EOL);
        $document['SUMMARY']["COUNT"] = $counter;
        $document['SUMMARY']['FROMUNIXTIME'] = $fromUnixTime;
        $document['DOCUMENTS'] = $docs;
        return $document;
    }



    public function getDocumentsAI($fromUnixTime, $AICode)
    {
        //Set up the correct collection:
        $collection = $this->mongoDbClient->gs1resolver->uri;
        $document = array();
        $counter = 0;

        //Search and retrieve the document
        try
        {
            $docs = array();
            $cursor = $collection->find(['unixtime' => ['$gte' => intval($fromUnixTime)]]);
            foreach ($cursor as $doc)
            {
                if($this->startsWith($doc["_id"], "/" . $AICode))
                {
                    array_push($docs, $doc);
                    $counter++;
                }
            }
        }
        catch (MongoDB\Driver\Exception\ConnectionTimeoutException $cte)
        {
            file_put_contents('php://stderr', "Error calling MongodDB: " . print_r($cte, true) . PHP_EOL);
            return json_decode('{"Error", "MongoDB Database Connection Failed. Please contact the Resolver administrator - error log on server for details"}');
        }

        //Return the complete document as a result
        file_put_contents('php://stderr', "JSON version of MongoDB URI record: " . json_encode($cursor) . PHP_EOL);
        $document['SUMMARY']["COUNT"] = $counter;
        $document['SUMMARY']['FROMUNIXTIME'] = $fromUnixTime;
        $document['SUMMARY']['AICODE'] = $AICode;
        $document['DOCUMENTS'] = $docs;
        return $document;
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

}
