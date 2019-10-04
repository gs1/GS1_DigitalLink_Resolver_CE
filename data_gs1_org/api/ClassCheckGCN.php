<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 01/11/2018
 * Time: 10:35
 */

class ClassCheckGCN implements iCheckGS1Key
{
    public function testIntegrity($alphaValueToTest) : array
    {
        $result_array = array();
        $result_array['ErrorCode'] = 0;
        $result_array['Message'] = 'GCN Integrity Test Not Yet Implemented';

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
        $result_array['gs1_key_code'] = 'GCN';
        $result_array['numeric_code'] = '255';
        $result_array['full_name'] = 'Global Coupon Number';
        $result_array['description'] = 'Coupons (paper or digital). The GCN identifies the coupon offer, and if needed the individually issued coupons via the optional serial component.';
        $result_array['epc'] = 'urn:epc:id:sgcn:CompanyPrefix.CouponReference. SerialComponent';
        $result_array['GS1XML'] = '';
        $result_array['EANCOM'] = '';
        return $result_array;
    }

}