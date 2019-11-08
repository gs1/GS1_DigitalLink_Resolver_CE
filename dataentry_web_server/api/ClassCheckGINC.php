<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 01/11/2018
 * Time: 10:34
 */

class ClassCheckGINC implements iCheckGS1Key
{
    public function testIntegrity($alphaValueToTest) : array
    {
        $result_array = array();
        $result_array['ErrorCode'] = 0;
        $result_array['Message'] = 'GINC Integrity Test Not Yet Implemented';

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
        $result_array['gs1_key_code'] = 'GINC';
        $result_array['numeric_code'] = '401';
        $result_array['full_name'] = 'Global Identification Number for Consignment';
        $result_array['description'] = 'Consignments comprised of one or more logistic units (potentially belonging to different shipments) intended to be transported together for part of their journey. Logistic units may be associated with different GINCs by carriers or freight forwarders during subsequent transport stages.';
        $result_array['epc'] = 'urn:epc:id:ginc:CompanyPrefix.ConsignmentReference';
        $result_array['GS1XML'] = 'string [-!»%&’()*+,./0-9:;<=>?A-Z_a-z]{4,30}';
        $result_array['EANCOM'] = 'an..35';
        return $result_array;
    }
}