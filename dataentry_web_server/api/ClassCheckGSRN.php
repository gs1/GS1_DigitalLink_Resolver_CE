<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 01/11/2018
 * Time: 10:35
 */

class ClassCheckGSRN implements iCheckGS1Key
{
    public function testIntegrity($alphaValueToTest) : array
    {
        $result_array = array();
        $result_array['ErrorCode'] = 0;
        $result_array['Message'] = 'GSRN Integrity Test Not Yet Implemented';

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
        $result_array['gs1_key_code'] = 'GSRN';
        $result_array['numeric_code'] = '8018';
        $result_array['full_name'] = 'Global Service Relation Number';
        $result_array['description'] = 'Service provider relationships of an organisation and the provider of the service, such as the doctors employed by a hospital. Service recipient relationships of an organisation offering a service and the recipient of the service such as the loyalty account of a customer with a retailer, the registration of a patient at a hospital, the account of a customer with an electricity company. In combination with the Service Relation Instance Number (SRIN) it can identify service encounters, such as the phases of a medical treatment.';
        $result_array['epc'] = 'urn:epc:id:gsin:CompanyPrefix.ShipperReference';
        $result_array['GS1XML'] = 'string \d{17}';
        $result_array['EANCOM'] = 'an..70';
        return $result_array;
    }

}