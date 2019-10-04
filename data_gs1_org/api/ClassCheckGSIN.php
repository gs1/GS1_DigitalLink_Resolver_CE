<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 01/11/2018
 * Time: 10:34
 */

class ClassCheckGSIN implements iCheckGS1Key
{
    public function testIntegrity($alphaValueToTest) : array
    {
        $result_array = array();
        $result_array['ErrorCode'] = 0;
        $result_array['Message'] = 'GSIN Integrity Test Not Yet Implemented';

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
        $result_array['gs1_key_code'] = 'GSIN';
        $result_array['numeric_code'] = '402';
        $result_array['full_name'] = 'Global Shipment Identification Number';
        $result_array['description'] = 'Shipments, comprised of one or more logistic units intended to be delivered together. The logistic units belonging to a particular shipment keep the same GSIN during all transport stages, from origin to final destination. Note: Meets the WCO requirements for UCR (Unique Consignment Reference). Compatible with ISO/IEC 15459 – part 8: grouping of transport units.';
        $result_array['epc'] = 'urn:epc:id:gsin:CompanyPrefix.ShipperReference';
        $result_array['GS1XML'] = 'string \d{17}';
        $result_array['EANCOM'] = 'an..70';
        return $result_array;
    }

}