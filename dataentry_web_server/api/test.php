<?php
include_once 'ClassDBAccess.php';
include_once 'ClassGS1Keys.php';
include_once 'ClassMongoDB.php';
$classDBAccess = new ClassDBAccess();
$classGS1Keys = new classGS1Keys();
echo '<p>SQL Server Database connected OK - logging in as sansa.stark@gs1westeros.com with password Winteriscoming...</p>';
$accountSession = $classDBAccess->LoginAccount('sansa.stark@gs1westeros.com', 'Winteriscoming');
$sessionId = $accountSession['session_id'];
if($sessionId === 'LOGIN FAILED')
{
    echo '<p>Login Failed! Has sansa.stark@gs1westeros.com account been disabled or the password changed?</p>';
}
else
{
    echo '<p>Login success! Now to use the session key generated for Sansa Stark to access MongoDB...</p>';
    $classMongo = new ClassMongoDB();
    $testResult = $classMongo->testMongoDBAccess($sessionId);
    if($testResult['OK'])
    {
        echo '<p>MongoDB Database connected OK! Everything looks perfect :-)</p>';
    }
    else
    {
        echo '<p>MongoDB Databases connection failed. Details for technical help below</p><textarea rows="20" cols="40">' . json_encode($testResult, JSON_PRETTY_PRINT) . '</textarea>';
    }
}
echo '<p>System Test completed<p></p>';
exit();
