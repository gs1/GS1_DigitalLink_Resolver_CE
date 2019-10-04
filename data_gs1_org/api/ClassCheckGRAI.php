<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 01/11/2018
 * Time: 10:34
 */

class ClassCheckGRAI implements iCheckGS1Key
{
    public function testIntegrity($alphaValueToTest) : array
    {
        $result_array = array();
        $result_array['ErrorCode'] = 0;
        $result_array['Message'] = 'GRAI Integrity Test Not Yet Implemented';

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
        $result_array['gs1_key_code'] = 'GRAI';
        $result_array['numeric_code'] = '8003';
        $result_array['full_name'] = 'Global Returnable Asset Identifier';
        $result_array['description'] = 'Mostly used to identify Returnable Transport Items (RTI) such as pallets, roll containers, crates. The GRAI identifies the type of returnable asset, and if needed also the individual instances of the returnable asset via the optional serial number.';
        $result_array['epc'] = 'urn:epc:id:grai:CompanyPrefix.AssetType.SerialNumber';
        $result_array['GS1XML'] = 'string \d{14}[-!»%&’()*+,./0-9:;<=>?A-Z_a-z]{0,16}';
        $result_array['EANCOM'] = 'an..35';
        return $result_array;
    }

}