<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 01/11/2018
 * Time: 10:14
 */
include_once 'iCheckGS1Key.php';
include_once 'ClassCheckCPID.php';
include_once 'ClassCheckGCN.php';
include_once 'ClassCheckGDTI.php';
include_once 'ClassCheckGIAI.php';
include_once 'ClassCheckGINC.php';
include_once 'ClassCheckGLN.php';
include_once 'ClassCheckGMN.php';
include_once 'ClassCheckGRAI.php';
include_once 'ClassCheckGSIN.php';
include_once 'ClassCheckGSRN.php';
include_once 'ClassCheckGTIN.php';
include_once 'ClassCheckSSCC.php';

class classGS1Keys
{

    public function getGS1KeyCodesList() : array
    {
        $resultsArray = array();
        $resultsElement = 0;

        $classArray = get_declared_classes();
        foreach($classArray as $className)
        {
            if(strpos($className, 'ClassCheck') === 0)
            {
                //The class is decided programmatically sp ignore any IDE warnings about
                //missing methods:
                $classCheckGS1Key = new $className();
                $infoArray = $classCheckGS1Key->information();
                $resultsArray[$resultsElement]['gs1_key_code_id'] = $resultsElement + 1;
                $resultsArray[$resultsElement]['gs1_key_code'] = strtolower($infoArray['gs1_key_code']);
                $resultsArray[$resultsElement]['numeric_code'] = $infoArray['numeric_code'];
                $resultsArray[$resultsElement]['code_name'] = $infoArray['full_name'];
                $resultsArray[$resultsElement]['epc'] = $infoArray['epc'];
                $resultsArray[$resultsElement]['GS1XML'] = $infoArray['GS1XML'];
                $resultsArray[$resultsElement]['EANCOM'] = $infoArray['EANCOM'];
                $resultsElement++;
            }
        }
        return $resultsArray;
    }

    public function testIntegrity($gs1KeyCode, $gs1KeyValue)
    {
        $className = 'ClassCheck' . strtoupper($gs1KeyCode);
        $classCheckGS1Key = new $className();

        $resultArray = $classCheckGS1Key->testIntegrity($gs1KeyValue);
        $result['result_code'] = $resultArray['ErrorCode'];
        $result['result_message'] = $resultArray['Message'];
        if($resultArray['ErrorCode'] === 0)
        {
            $result['default_format'] = $classCheckGS1Key->defaultFormat($gs1KeyValue);
        }
        else
        {
            $result['default_format'] = '';
        }

        return $result;
    }

    public function defaultFormat($gs1KeyCode, $gs1KeyValue) : string
    {
        $className = 'ClassCheck' . strtoupper($gs1KeyCode);
        $classCheckGS1Key = new $className();
        return $classCheckGS1Key->defaultFormat($gs1KeyValue);
    }
}