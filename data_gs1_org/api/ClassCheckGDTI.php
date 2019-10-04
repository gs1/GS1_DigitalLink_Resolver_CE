<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 01/11/2018
 * Time: 10:35
 */

class ClassCheckGDTI implements iCheckGS1Key
{
    public function testIntegrity($alphaValueToTest) : array
    {
        $result_array = array();
        $result_array['ErrorCode'] = 0;
        $result_array['Message'] = 'GDTI Integrity Test Not Yet Implemented';

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
        $result_array['gs1_key_code'] = 'GDTI';
        $result_array['numeric_code'] = '253';
        $result_array['full_name'] = 'Global Document Type Identifier';
        $result_array['description'] = 'hysical documents such as certificates, invoices, driving licenses. Electronic documents such as digital images, EDI messages. The GDTI identifies the type of the document, and if needed also the individual document instances via the optional serial number.';
        $result_array['epc'] = 'urn:epc:id:gdti:CompanyPrefix.DocumentType.SerialNumber';
        $result_array['GS1XML'] = 'string \d{13} [-!»%&’()*+,./0-9:;<=>?A-Z_a-z]{0,27}';
        $result_array['EANCOM'] = 'an..35';
        return $result_array;
    }

}