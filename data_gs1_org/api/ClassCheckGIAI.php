<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 01/11/2018
 * Time: 10:35
 */

class ClassCheckGIAI implements iCheckGS1Key
{
    public function testIntegrity($alphaValueToTest) : array
    {
        $result_array = array();
        $result_array['ErrorCode'] = 0;
        $result_array['Message'] = 'GIAI Integrity Test Not Yet Implemented';

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
        $result_array['gs1_key_code'] = 'GIAI';
        $result_array['numeric_code'] = '8004';
        $result_array['full_name'] = 'Global Individual Asset Identifier';
        $result_array['description'] = 'Fixed assets such as office equipment, transport equipment, IT equipment, vehicles. The GIAI identifies individual asset instances regardless of the type of asset.';
        $result_array['epc'] = 'urn:epc:id:giai:CompanyPrefix.IndividualAssetReference';
        $result_array['GS1XML'] = 'string [-!»%&’()*+,./0-9:;<=>?A-Z_a-z]{4,30}';
        $result_array['EANCOM'] = 'an..35';
        return $result_array;
    }

}