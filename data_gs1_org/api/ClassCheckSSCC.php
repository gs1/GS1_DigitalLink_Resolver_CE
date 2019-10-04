<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 01/11/2018
 * Time: 10:33
 */

class ClassCheckSSCC implements iCheckGS1Key
{
    public function testIntegrity($alphaValueToTest): array
    {
        $result_array = array();
        $result_array['ErrorCode'] = 0;
        $result_array['Message'] = 'SSCC Integrity Test Not Yet Implemented';

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
        $result_array['gs1_key_code'] = 'SSCC';
        $result_array['numeric_code'] = '00';
        $result_array['full_name'] = 'Serial Shipping Container Code';
        $result_array['description'] = 'Logistic units such as unit loads on pallets or roll cages, and parcels. The SSCC enables the unique identification of any combination of trade items packaged together for storage and/or transport purposes. Note: Compatible with ISO/IEC 15459 – part 1: unique identifiers for transport units (the ISO licence plate)';
        $result_array['epc'] = 'urn:epc:id:sscc:CompanyPrefix.SerialReference';
        $result_array['GS1XML'] = 'string \d{18}';
        $result_array['EANCOM'] = 'an..35';
        return $result_array;
    }
}