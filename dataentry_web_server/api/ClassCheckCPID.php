<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 01/11/2018
 * Time: 10:36
 */
class ClassCheckCPID implements iCheckGS1Key
{
    public function testIntegrity($alphaValueToTest) : array
    {
        $result_array = array();
        $result_array['ErrorCode'] = 0;
        $result_array['Message'] = 'CPID Integrity Test Not Yet Implemented';

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
        $result_array['gs1_key_code'] = 'CPID';
        $result_array['numeric_code'] = '8010';
        $result_array['full_name'] = 'Component / Part Identifier';
        $result_array['description'] = 'Components and parts such as drive motor for washing machine, fan assembly for a jet engine, starter motor for vehicle, wheel axle. Individual components or parts, by combining CPID with a serial number. Note: The CPID identifier shall not be used in open supply chains. It is restricted to use by mutual agreement.';
        $result_array['epc'] = 'urn:epc:id:cpi:CompanyPrefix.ComponentPartReference. Serial';
        $result_array['GS1XML'] = '';
        $result_array['EANCOM'] = '';
        return $result_array;
    }

}