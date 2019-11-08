<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 01/11/2018
 * Time: 10:36
 */

class ClassCheckGMN implements iCheckGS1Key
{
    public function testIntegrity($alphaValueToTest) : array
    {
        $result_array = array();
        $result_array['ErrorCode'] = 0;
        $result_array['Message'] = 'GMN Integrity Test Not Yet Implemented';

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
        $result_array['gs1_key_code'] = 'GMN';
        $result_array['numeric_code'] = '8013';
        $result_array['full_name'] = 'Global Model Number';
        $result_array['description'] = 'The Global Model Number enables users to uniquely identify the product model through the entire life cycle of the product: design - production – procurement – use – maintenance - disposal. Note: The GMN has currently only been approved for regulated healthcare identification of medical devices. Other applications may be added in the future';
        $result_array['epc'] = '';
        $result_array['GS1XML'] = '';
        $result_array['EANCOM'] = '';
        return $result_array;
    }

}