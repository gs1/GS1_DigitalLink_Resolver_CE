<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 2018-11-27
 * Time: 09:42
 */
require_once 'ClassMongoDB.php';
require_once 'ClassAITable.php';

$classMongoDB = new ClassMongoDB();
$classAI = new ClassAITable();

$requestArray = explode("/", $_SERVER['REQUEST_URI']);

$bOkFlag = true;
$errorResponse = array();

$fromUnixTime = '';
$aiCode = '';

$requestCount = count($requestArray);
if($requestCount > 2)
{
    $fromUnixTime = trim($requestArray[2]);
    if(strlen($fromUnixTime) !== 10)
    {
        $errorResponse['ERROR'] = "Specified Unix Time $fromUnixTime is not exactly 10 digits long";
        $bOkFlag = false;
    }
    elseif(!is_numeric($fromUnixTime))
    {
        $errorResponse['ERROR'] = "Specified Unix Time $fromUnixTime is not numeric";
        $bOkFlag = false;
    }
}

if($requestCount > 3)
{
    $aiCode = trim($requestArray[3]);
    if(strlen($aiCode) > 0)
    {
        if(is_numeric($aiCode))
        {
            $aiShortCode = $classAI->lookupAIShortCodeFromAICode($aiCode);
            if($aiShortCode === '')
            {
                $errorResponse['ERROR'] = "Specified AI numeric code $aiCode is not valid";
                $bOkFlag = false;
            }
        }
        if(!is_numeric($aiCode))
        {
            $aiCode = $classAI->lookupAICodeFromAIShortCode($aiCode);
            if($aiCode === '')
            {
                $errorResponse['ERROR'] = "Specified AI short code $aiCode is not valid";
                $bOkFlag = false;
            }
        }
    }
}

if($requestCount < 3)
{
    $errorResponse['ERROR'] = "No valid unixtime received";
    $bOkFlag = false;
}

if($bOkFlag)
{
    $document = array();
    if($aiCode === '')
    {
        $document = $classMongoDB->getDocuments($fromUnixTime);
        echo json_encode($document, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    else
    {
        $document = $classMongoDB->getDocumentsAI($fromUnixTime, $aiCode);
        echo json_encode($document, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
else
{
    echo json_encode($errorResponse);
}

