<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 31/10/2018
 * Time: 15:40
 */
include_once 'iCheckGS1Key.php';

class ClassCheckGLN implements iCheckGS1Key
{
    public function testIntegrity($alphaValueToTest) : array
    {
        $result_array = array();
        $result_array['ErrorCode'] = 0;
        $result_array['Message'] = 'GLN Integrity Test successful';

        if(!is_numeric($alphaValueToTest))
        {
            $result_array['ErrorCode'] = 1;
            $result_array['Message'] = 'GLN not numeric';
        }
        elseif(strlen($alphaValueToTest) !== 13)
        {
            $result_array['ErrorCode'] = 2;
            $result_array['Message'] = 'GLN not 13 digits';
        }

        return $result_array;
    }

    public function defaultFormat($alphaValue): string
    {
        // TODO: Implement defaultFormat() method.
        return $alphaValue;
    }

    public function information(): array
    {
        $result_array = array();
        $result_array['gs1_key_code'] = 'GLN';
        $result_array['numeric_code'] = '414';
        $result_array['full_name'] = 'Global Location Number';
        $result_array['description'] = 'Physical Locations: An organisation’s geographical addresses such as Ship From, Ship To, Read Point. In combination with the GLN extension also internal physical locations such as storage bins, dock doors, bar code scan / read points. Parties: An organisation’s legal and functional entities engaging in business transactions. Note: Recognized in ISO standard 6523, international code designator (ICD) for GLN is ‘0088’';
        $result_array['epc'] = 'urn:epc:id:sgln:CompanyPrefix.LocationReference.Extension';
        $result_array['GS1XML'] = 'string \d{13}';
        $result_array['EANCOM'] = 'n13';
        return $result_array;
    }

}