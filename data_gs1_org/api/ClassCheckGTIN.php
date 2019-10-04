<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 31/10/2018
 * Time: 14:40
 * Based on original code by Dr. Mark Harrison
 */
include_once 'iCheckGS1Key.php';
class ClassCheckGTIN implements iCheckGS1Key
{
    //Data lookup arrays
    private $gs1CountryLookup = array();
    private $restricted = array();
    private $coupon = array();
    private $receipt = array();

    public function __construct()
    {
        //Set up the country lookup array values
        $this->gs1CountryLookup['00[0-9]'] = 'GS1 US';
        $this->gs1CountryLookup['01[0-9]'] = 'GS1 US';
        $this->gs1CountryLookup['03[0-9]'] = 'GS1 US';
        $this->gs1CountryLookup['0[6-9][0-9]'] = 'GS1 US';
        $this->gs1CountryLookup['1[0-3][0-9]'] = 'GS1 US';
        $this->gs1CountryLookup['3[0-7][0-9]'] = 'GS1 France';
        $this->gs1CountryLookup['380'] = 'GS1 Bulgaria';
        $this->gs1CountryLookup['383'] = 'GS1 Slovenija';
        $this->gs1CountryLookup['385'] = 'GS1 Croatia';
        $this->gs1CountryLookup['387'] = 'GS1 BIH (Bosnia-Herzegovina)';
        $this->gs1CountryLookup['389'] = 'GS1 Montenegro';
        $this->gs1CountryLookup['4[0-3][0-9]|440'] = 'GS1 Germany';
        $this->gs1CountryLookup['4[59][0-9]'] = 'GS1 Japan';
        $this->gs1CountryLookup['46[0-9]'] = 'GS1 Russia';
        $this->gs1CountryLookup['470'] = 'GS1 Kyrgyzstan';
        $this->gs1CountryLookup['471'] = 'GS1 Taiwan';
        $this->gs1CountryLookup['474'] = 'GS1 Estonia';
        $this->gs1CountryLookup['475'] = 'GS1 Latvia';
        $this->gs1CountryLookup['476'] = 'GS1 Azerbaijan';
        $this->gs1CountryLookup['477'] = 'GS1 Lithuania';
        $this->gs1CountryLookup['478'] = 'GS1 Uzbekistan';
        $this->gs1CountryLookup['479'] = 'GS1 Sri Lanka';
        $this->gs1CountryLookup['480'] = 'GS1 Philippines';
        $this->gs1CountryLookup['481'] = 'GS1 Belarus';
        $this->gs1CountryLookup['482'] = 'GS1 Ukraine';
        $this->gs1CountryLookup['484'] = 'GS1 Moldova';
        $this->gs1CountryLookup['485'] = 'GS1 Armenia';
        $this->gs1CountryLookup['486'] = 'GS1 Georgia';
        $this->gs1CountryLookup['487'] = 'GS1 Kazakstan';
        $this->gs1CountryLookup['488'] = 'GS1 Tajikistan';
        $this->gs1CountryLookup['489'] = 'GS1 Hong Kong';
        $this->gs1CountryLookup['50[0-9]'] = 'GS1 UK';
        $this->gs1CountryLookup['52[0-1]'] = 'GS1 Association Greece';
        $this->gs1CountryLookup['528'] = 'GS1 Lebanon';
        $this->gs1CountryLookup['529'] = 'GS1 Cyprus';
        $this->gs1CountryLookup['530'] = 'GS1 Albania';
        $this->gs1CountryLookup['531'] = 'GS1 MAC (FYR Macedonia)';
        $this->gs1CountryLookup['535'] = 'GS1 Malta';
        $this->gs1CountryLookup['539'] = 'GS1 Ireland';
        $this->gs1CountryLookup['54[0-9]'] = 'GS1 Belgium & Luxembourg';
        $this->gs1CountryLookup['560'] = 'GS1 Portugal';
        $this->gs1CountryLookup['569'] = 'GS1 Iceland';
        $this->gs1CountryLookup['57[0-9]'] = 'GS1 Denmark';
        $this->gs1CountryLookup['590'] = 'GS1 Poland';
        $this->gs1CountryLookup['594'] = 'GS1 Romania';
        $this->gs1CountryLookup['599'] = 'GS1 Hungary';
        $this->gs1CountryLookup['60[0-1]'] = 'GS1 South Africa';
        $this->gs1CountryLookup['603'] = 'GS1 Ghana';
        $this->gs1CountryLookup['604'] = 'GS1 Senegal';
        $this->gs1CountryLookup['608'] = 'GS1 Bahrain';
        $this->gs1CountryLookup['609'] = 'GS1 Mauritius';
        $this->gs1CountryLookup['611'] = 'GS1 Morocco';
        $this->gs1CountryLookup['613'] = 'GS1 Algeria';
        $this->gs1CountryLookup['615'] = 'GS1 Nigeria';
        $this->gs1CountryLookup['616'] = 'GS1 Kenya';
        $this->gs1CountryLookup['618'] = 'GS1 Ivory Coast';
        $this->gs1CountryLookup['619'] = 'GS1 Tunisia';
        $this->gs1CountryLookup['620'] = 'GS1 Tanzania';
        $this->gs1CountryLookup['621'] = 'GS1 Syria';
        $this->gs1CountryLookup['622'] = 'GS1 Egypt';
        $this->gs1CountryLookup['623'] = 'GS1 Brunei';
        $this->gs1CountryLookup['624'] = 'GS1 Libya';
        $this->gs1CountryLookup['625'] = 'GS1 Jordan';
        $this->gs1CountryLookup['626'] = 'GS1 Iran';
        $this->gs1CountryLookup['627'] = 'GS1 Kuwait';
        $this->gs1CountryLookup['628'] = 'GS1 Saudi Arabia';
        $this->gs1CountryLookup['629'] = 'GS1 Emirates';
        $this->gs1CountryLookup['64[0-9]'] = 'GS1 Finland';
        $this->gs1CountryLookup['69[0-9]'] = 'GS1 China';
        $this->gs1CountryLookup['70[0-9]'] = 'GS1 Norway';
        $this->gs1CountryLookup['729'] = 'GS1 Israel';
        $this->gs1CountryLookup['73[0-9]'] = 'GS1 Sweden';
        $this->gs1CountryLookup['740'] = 'GS1 Guatemala';
        $this->gs1CountryLookup['741'] = 'GS1 El Salvador';
        $this->gs1CountryLookup['742'] = 'GS1 Honduras';
        $this->gs1CountryLookup['743'] = 'GS1 Nicaragua';
        $this->gs1CountryLookup['744'] = 'GS1 Costa Rica';
        $this->gs1CountryLookup['745'] = 'GS1 Panama';
        $this->gs1CountryLookup['746'] = 'GS1 Republica Dominicana';
        $this->gs1CountryLookup['750'] = 'GS1 Mexico';
        $this->gs1CountryLookup['75[4-5]'] = 'GS1 Canada';
        $this->gs1CountryLookup['759'] = 'GS1 Venezuela';
        $this->gs1CountryLookup['76[0-9]'] = 'GS1 Schweiz, Suisse, Svizzera';
        $this->gs1CountryLookup['77[0-1]'] = 'GS1 Colombia';
        $this->gs1CountryLookup['773'] = 'GS1 Uruguay';
        $this->gs1CountryLookup['775'] = 'GS1 Peru';
        $this->gs1CountryLookup['777'] = 'GS1 Bolivia';
        $this->gs1CountryLookup['773'] = 'GS1 Uruguay';
        $this->gs1CountryLookup['775'] = 'GS1 Peru';
        $this->gs1CountryLookup['77[8-9]'] = 'GS1 Argentina';
        $this->gs1CountryLookup['780'] = 'GS1 Chile';
        $this->gs1CountryLookup['784'] = 'GS1 Paraguay';
        $this->gs1CountryLookup['786'] = 'GS1 Ecuador';
        $this->gs1CountryLookup['789|790'] = 'GS1 Brasil';
        $this->gs1CountryLookup['8[0-3][0-9]'] = 'GS1 Italy';
        $this->gs1CountryLookup['84[0-9]'] = 'GS1 Spain';
        $this->gs1CountryLookup['850'] = 'GS1 Cuba';
        $this->gs1CountryLookup['858'] = 'GS1 Slovakia';
        $this->gs1CountryLookup['859'] = 'GS1 Czech';
        $this->gs1CountryLookup['860'] = ' GS1 Serbia';
        $this->gs1CountryLookup['865'] = 'GS1 Mongolia';
        $this->gs1CountryLookup['867'] = 'GS1 North Korea';
        $this->gs1CountryLookup['868|869'] = 'GS1 Turkey';
        $this->gs1CountryLookup['87[0-9]'] = 'GS1 Netherlands';
        $this->gs1CountryLookup['880'] = 'GS1 South Korea';
        $this->gs1CountryLookup['884'] = 'GS1 Cambodia';
        $this->gs1CountryLookup['885'] = 'GS1 Thailand';
        $this->gs1CountryLookup['888'] = 'GS1 Singapore';
        $this->gs1CountryLookup['890'] = 'GS1 India';
        $this->gs1CountryLookup['893'] = 'GS1 Vietnam';
        $this->gs1CountryLookup['896'] = 'GS1 Pakistan';
        $this->gs1CountryLookup['899'] = 'GS1 Indonesia';
        $this->gs1CountryLookup['9[0-1][0-9]'] = 'GS1 Austria';
        $this->gs1CountryLookup['93[0-9]'] = 'GS1 Australia';
        $this->gs1CountryLookup['94[0-9]'] = 'GS1 New Zealand';
        $this->gs1CountryLookup['950'] = 'GS1 Global Office';
        $this->gs1CountryLookup['951'] = 'GS1 Global Office (EPCglobal)';
        $this->gs1CountryLookup['955'] = 'GS1 Malaysia';
        $this->gs1CountryLookup['958'] = 'GS1 Macau';
        $this->gs1CountryLookup['96[0-9]'] = 'GS1 Global Office (GTIN-8s)';
        $this->gs1CountryLookup['977'] = 'Serial publications (ISSN)';
        $this->gs1CountryLookup['978|979'] = 'Bookland (ISBN)';

        $this->restricted['02[0-9]'] = 'Restricted distribution (MO defined)';
        $this->restricted['04[0-9]'] = 'Restricted distribution (MO defined)';
        $this->restricted['2[0-9][0-9]'] = 'Restricted distribution (MO defined)';

        $this->coupon['05[0-9]'] = 'Coupons';
        $this->coupon['98[1-4]'] = 'GS1 coupon identification for common currency areas';
        $this->coupon['99[0-9]'] = 'GS1 coupon identification';

        $this->receipt['980'] = 'Refund receipts';
    }


    /**
    * This function tests the integrity of an incoming GTIN
    * Test include length, invalid characters, the correct check-digit calculation and prefix
    * @param $alphaValueToTest
    * @return array
    */
    public function testIntegrity($alphaValueToTest) : array
    {
        ////////
        $nonDigits = preg_match('/\D+/', $alphaValueToTest);
        $wrongLength = false;
        $wrongLengthComment = '';
        $checkDigitError = false;
        $gs1PrefixError = false;
        $leadingZeroMissingWarning = false;
        $correctedGtinWithLeadingZeroes = '';
        $foundGS1Prefix = '';
        $foundGS1Receipt = '';
        $foundGS1Restricted = '';
        $foundGS1Coupon = '';
        $errorCode = 0;

        $gtinLength = strlen($alphaValueToTest);
        $finalDigit = $alphaValueToTest[$gtinLength - 1];


        //First test the GTIN for non alphabetic characters (performed in preg_match test above)
        if ($nonDigits)
        {
            $errorCode = 301;
        }
        // permitted lengths of GTIN are 8, 12, 13 and 14.  Canonical format is GTIN-14.
        elseif ($gtinLength < 8)
        {
            $wrongLength = true;
            $wrongLengthComment = 'too short';
            $errorCode = 101;
        }
        elseif ($gtinLength > 14)
        {
            $wrongLength = true;
            $wrongLengthComment = 'too long';
            $errorCode = 102;
        }
        elseif ($gtinLength === 11)
        {
            $wrongLength = true;
            $wrongLengthComment = '11 chars but maybe should be 12? Add a leading 0 and retest!';
            $errorCode = 103;
        }
        elseif ($gtinLength > 8 && $gtinLength < 11)
        {
            $wrongLength = true;
            $wrongLengthComment = 'an invalid length';
            $errorCode = 103;
        }
        elseif ($gtinLength < 14 && $alphaValueToTest[0] !== '0')
        {
            $leadingZeroMissingWarning = true;
        }

        $expectedCheckDigit = 0;

        if ((!$nonDigits) && (!$wrongLength))
        {
            // if it's all numeric and a plausible length, verify the check digit
            $counter = 0;
            $total = 0;
            for ($i = $gtinLength - 2; $i >= 0; $i--)
            {
                $digit = $alphaValueToTest[$i];
                if (($counter % 2) === 0)
                {
                    $multiplier = 3;
                }
                else
                {
                    $multiplier = 1;
                }
                $total += $digit * $multiplier;
                $counter++;
            }

            $expectedCheckDigit = (10 - ($total % 10)) % 10;

            if ($finalDigit !== (string)$expectedCheckDigit)
            {
                $checkDigitError = true;
                $errorCode = 104;
            }

            if ($gtinLength >= 12 && $gtinLength <= 14)
            {
                //if it's a 12,13 or 14 digit GTIN, extract the three-digit GS1 prefix and check for plausibility
                //If its length is 12 or 13 digits, then create a canonically-accurate zero-prefixed 14-character GTIN
                if ($gtinLength === 12)
                {
                    $gs1prefix = '0' . substr($alphaValueToTest, 0, 2);
                    $correctedGtinWithLeadingZeroes = '00' . $alphaValueToTest;
                }
                elseif ($gtinLength === 13)
                {
                    $gs1prefix = substr($alphaValueToTest, 0, 3);
                    $correctedGtinWithLeadingZeroes = '0' . $alphaValueToTest;
                }
                else //gtinLength === 14
                {
                    $gs1prefix = substr($alphaValueToTest, 1, 3);
                }


                foreach ($this->gs1CountryLookup as $key => $value)
                {

                    if (preg_match('/^' . $key . '$/', $gs1prefix))
                    {
                        $foundGS1Prefix = $value;
                    }
                }


                foreach ($this->restricted as $key => $value)
                {
                    if (preg_match('/^' . $key . '$/', $gs1prefix))
                    {
                        $foundGS1Restricted = $value;
                        $errorCode = 201;
                    }
                }


                foreach ($this->coupon as $key => $value)
                {
                    if (preg_match('/^' . $key . '$/', $gs1prefix))
                    {
                        $foundGS1Coupon = $value;
                        $errorCode = 202;
                    }
                }


                foreach ($this->receipt as $key => $value)
                {
                    if (preg_match('/^' . $key . '$/', $gs1prefix))
                    {
                        $foundGS1Receipt = $value;
                        $errorCode = 203;
                    }
                }

                if (($foundGS1Prefix === '') && ($foundGS1Restricted === '') && ($foundGS1Coupon === '') && ($foundGS1Receipt === ''))
                {
                    $gs1PrefixError = true;
                    $errorCode = 204;

                }

            }
        }

        //CAREFUL! A GTIN is considered not in error if 'Syntax OK' is returned:
        $returnedResultMessage = 'Syntax OK';

        if ($errorCode > 0)
        {
            if ($wrongLength)
            {
                $returnedResultMessage = 'The length of this GTIN is ' . $wrongLengthComment;
            }
            elseif ($nonDigits)
            {
                $returnedResultMessage = 'A GTIN may not contain any characters except numeric digits. Please check that you have not mistyped O instead of 0 -or- I instead of 1 -or- Z instead of 2 -or- S instead of 5';
            }
            elseif ($checkDigitError)
            {
                $returnedResultMessage = "The final digit of a GTIN is a check digit that is calculated from the preceding digits. For the GTIN that you supplied the final digit was $finalDigit but the check digit (final digit) should have been $expectedCheckDigit ";
            }
            elseif ($gs1PrefixError)
            {
                $returnedResultMessage = 'We could not find a GS1 Member Organisation prefix that matches your input resultsData.';
            }
            elseif ($foundGS1Prefix > '')
            {
                $returnedResultMessage = 'This looks like a GTIN that contains a GS1 Company Prefix that might have been issued by ' . $foundGS1Prefix;
            }
            elseif ($foundGS1Restricted)
            {
                $returnedResultMessage = 'GTIN that contains a restricted results Data GS1 prefix.';
            }
            elseif ($foundGS1Coupon)
            {
                $returnedResultMessage = 'GTIN used for a coupon instead of a product.';
            }
            elseif ($foundGS1Receipt)
            {
                $returnedResultMessage = 'GTIN used for a refund receipt instead of a product.';
            }
            elseif ($leadingZeroMissingWarning)
            {
                $returnedResultMessage = 'GTIN is valid but is missing its leading zero - it should be like this: ' . $correctedGtinWithLeadingZeroes;
            }
        }

        $result_array = array();
        $result_array['ErrorCode'] = $errorCode;
        $result_array['Message'] = "GTIN Integrity of $alphaValueToTest: $returnedResultMessage";

        return $result_array;
    }


    public function defaultFormat($gtin) : string
    {
        while(strlen($gtin) < 14)
        {
            $gtin = '0' . $gtin;
        }
        return $gtin;
    }


    public function information(): array
    {
        // TODO: Implement information() method.
        $result_array = array();
        $result_array['gs1_key_code'] = 'GTIN';
        $result_array['numeric_code'] = '1';
        $result_array['full_name'] = 'Global Trade Item Number';
        $result_array['description'] = 'Products such as consumer goods, pharmaceuticals, medical devices, raw materials at any packaging level (e.g., consumer unit, inner pack, case, pallet). Services such as equipment rental, car rental, ... Individual trade item instance(s) by combining the GTIN with batch / lot number, serial number. Note: Compatible with ISO/IEC 15459 - part 4: individual products and product packages';
        $result_array['epc'] = 'urn:epc:id:sgtin:CompanyPrefix.ItemReference.SerialNumber urn:epc:class:lgtin:CompanyPrefix.ItemRefAndIndicator.Lot';
        $result_array['GS1XML'] = 'string \d{14}';
        $result_array['EANCOM'] = 'n..14';
        return $result_array;
    }
}