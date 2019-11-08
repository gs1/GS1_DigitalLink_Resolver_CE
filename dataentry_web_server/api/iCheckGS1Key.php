<?php
/**
 * Created by PhpStorm.
 * User: nick
 * Date: 31/10/2018
 * Time: 15:43
 */

interface iCheckGS1Key
{
    public function testIntegrity($alphaValue) : array;

    public function defaultFormat($alphaValue) : string;

    public function information() : array;
}