<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 15/11/2018
 * Time: 09:41
 */

use MongoDB\Driver\Exception\BulkWriteException;

require 'vendor/autoload.php';
date_default_timezone_set('UTC');

class ClassMongoDB
{
    private $mongoDbClient;

    public function __construct()
    {
        $ini = parse_ini_file('/var/www/config/api.ini');
        $connectionString = $ini['mongodb_connection_string'];

        try
        {
            $this->mongoDbClient = new MongoDB\Client($connectionString);
        }
        catch(\MongoDB\Driver\Exception\RuntimeException $runtimeException)
        {
            echo '<p>MONGODB Database Connection Failed. Runtime Exception Error. For technical help see detailed error below</p><textarea rows="20" cols="40">' . json_encode($runtimeException) . '</textarea>';
            die();
        }
        catch(\MongoDB\Driver\Exception\InvalidArgumentException $invalidArgumentException)
        {
            echo '<p>MONGODB Database Connection Failed. Invalid Argument Exception Error. For technical help see detailed error below</p><textarea rows="20" cols="40">' . json_encode($invalidArgumentException) . '</textarea>';
            die();
        }
        catch(Exception $e)
        {
            echo '<p>MONGODB Database Connection Failed. Exception Error. For technical help see detailed error below</p><textarea rows="20" cols="40">' . json_encode($e) . '</textarea>';
            die();
        }
    }

    /**
     * Test that MongoDB is responding
     * @param $sessionId
     * @return array
     */
    public function testMongoDBAccess()
    {
        $results = Array();
        $errorOccurredFlag = false;
        $collection = $this->mongoDbClient->gs1resolver->uri;
        $mongoDbRecord = array();
        $mongoDbRecord["_id"] = "TEST";
        $mongoDbRecord["MESSAGE"] = "TEST MESSAGE";
        $test = "WRITE";
        try
        {
            $results[$test] = $collection->insertOne($mongoDbRecord);
            $test = "DELETE";
            $results[$test] = $collection->deleteOne(['_id' => 'TEST']);
        }
        catch(BulkWriteException $bwe)
        {
            $writeResult = $bwe->getWriteResult();
            $errorOccurredFlag = true;
            if ($writeConcernError = $writeResult->getWriteConcernError()) {
                $results[$test] = $writeConcernError;
            }

            if ($writeErrors = $writeResult->getWriteErrors()) {
                $results[$test] = $writeErrors;
            }
        }
        catch (Exception $e)
        {
            $errorOccurredFlag = true;
            $results[$test] = $e;
        }

        if($errorOccurredFlag)
        {
            $results['STATUS'] ='MongoDB Failed';
        }
        else
        {
            $results['STATUS'] ='MongoDB working!';
        }
        $results['OK'] = true;
        return $results;
    }


    public function deleteURIRecord($mongoDbRecord)
    {
        $collection = $this->mongoDbClient->gs1resolver->uri;
        $collection->deleteOne(['_id' => $mongoDbRecord['_id']]);
    }

    public function putURIRecord($mongoDbRecord, $deleteCurrentDocument, $active) : Array
    {
        $response = Array();
        $response['OK'] = true;
        $response['ERROR'] = '';

        //Connect to the correct collection called 'gs1resolver.uri' in the MongoDB database
        $collection = $this->mongoDbClient->gs1resolver->uri;

        try
        {
            $document = $collection->findOne(['_id' => $mongoDbRecord['_id']]);

            //If the record needs deleting, then delete it and set $document object to null
            //So we know to insert rather than replace it. the $deleteCurrentDocument is set true
            //when the calling Build function reaches the first instance of the 'next' GS1 Key Code and Value
            //in its build list.
            if ($document !== null && $deleteCurrentDocument)
            {
                $collection->deleteOne(['_id' => $mongoDbRecord['_id']]);
                $document = null;
            }

            //only if the current entry is active should we insert or add it into the document for this gs1 key and value.
            //If it was the only entry (so has just been made inactive) then it will have been deleted in the code above this comment,
            //because a gs1 key / value 'boundary' will have been detected by the code calling this function and the
            //$deleteCurrentDocument flag will have been set true.
            //If there are other active entries for this gs1 key and value then they will be unaffected.
            if($active)
            {
                if ($document === null)
                {
                    //Insert record
                    $result = $collection->insertOne($mongoDbRecord);

                    //$this->dbAccess->logThis("MongoDB insertOne result: " . print_r($result, true));
                    $response['OK'] = $result;
                    $response['ERROR'] ='';
                }
                else
                {
                    //Update an existing record. To do this without examining all the properties for
                    //difference, just pull out the _id from the $mongoDbRecord object...
                    $id = $mongoDbRecord['_id'];

                    //..then take the existing key/values in the document and copy them into the new document:
                    foreach ($mongoDbRecord as $nvKey => $nvValue)
                    {
                        $document{$nvKey} = $nvValue;
                    }
                    unset($document['_id']);
                    $result = $collection->replaceOne(['_id' => $id], $document);

                    //$this->dbAccess->logThis("MongoDB replaceOne result: " . print_r($result, true));
                    $response['OK'] = $result;
                    $response['ERROR'] ='';
                }
            }
        }
        catch (InvalidArgumentException $iae)
        {
            $response['OK'] = false;
            $response['ERROR'] = print_r($iae, true);
            $response['DATA'] = print_r($mongoDbRecord, true);
        }

        return $response;
    }


    public function putGCPRecord($gcpRecord) : Array
    {
        $response = Array();

        //Connect to the correct collection called 'gs1resolver.gcp' in the MongoDB database
        $collection = $this->mongoDbClient->gs1resolver->gcp;
        try
        {
            $document = $collection->findOne(['_id' => $gcpRecord['_id']]);

            //If the record needs deleting, then delete it and set $document object to null
            //So we know to insert rather than replace it. the $deleteCurrentDocument is set true
            //when the calling Build function reaches the first instance of the 'next' GS1 Key Code and Value
            //in its build list.
            if ($document !== null)
            {
                $collection->deleteOne(['_id' => $gcpRecord['_id']]);
                $document = null;
            }
            //Insert record
            $result = $collection->insertOne($gcpRecord);
            $response['OK'] = $result;
            $response['ERROR'] ='';

        }
        catch (InvalidArgumentException $iae)
        {
            $response['OK'] = false;
            $response['ERROR'] = print_r($iae, true);
            $response['DATA'] = print_r($gcpRecord, true);
        }

        return $response;
    }



    public function putWellKnownRecord($wellKnownRecord) : Array
    {
        $response = Array();

        //Connect to the correct collection called 'gs1resolver.gcp' in the MongoDB database
        $collection = $this->mongoDbClient->gs1resolver->wellknown;
        try
        {
            $response['OK'] = true;
            $response['ERROR'] = '';
            $response['DATA'] = $collection->replaceOne(['_id' => $wellKnownRecord->{'_id'}], $wellKnownRecord, [ 'upsert'=> true ]);
        }
        catch (InvalidArgumentException $iae)
        {
            $response['OK'] = false;
            $response['ERROR'] = print_r($iae, true);
            $response['DATA'] = print_r($wellKnownRecord, true);
        }

        return $response;
    }
}
