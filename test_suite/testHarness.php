<?php

// Define a constant for the User Agent string
const UASTRING = 'GS1_Resolver_Test/0.1';

// Create a new instance of the Guzzle HTTP client (equivalent to LWP::UserAgent)
$client = new \GuzzleHttp\Client(['headers' => ['User-Agent' => UASTRING]]);

// Define an array to store the request headers
$reqHeaders = [];

// Check for environment variables and add them to the request headers if set
if (!empty($_SERVER['HTTP_USER_AGENT'])) {
    $reqHeaders['User-Agent'] = $_SERVER['HTTP_USER_AGENT'];
}
if (!empty($_SERVER['HTTP_ACCEPT'])) {
    $reqHeaders['Accept'] = $_SERVER['HTTP_ACCEPT'];
}
if (!empty($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
    $reqHeaders['Accept-Language'] = $_SERVER['HTTP_ACCEPT_LANGUAGE'];
}

// Define a function to parse the URL query string
function parseQueryString($queryString) {
    $params = [];
    foreach (explode('&', $queryString) as $pair) {
        list($key, $value) = explode('=', $pair);
        $params[$key] = urldecode($value);
    }
    return $params;
}

// Define a function to get the HTTP version
function getHTTPVersion($domain) {
    $uri = "http://$domain";
    $response = $client->head($uri, ['headers' => $reqHeaders]);
    $statusCode = $response->getStatusCode();
    if ($statusCode === 200) {
        $versionRegex = '/HTTP\/(\d\.\d).*/';
        preg_match($versionRegex, (string)$response->getBody(), $matches);
        return $matches[1];
    } else {
        throw new Exception("Error getting HTTP version: " . $response->getReasonPhrase());
    }
}

// Define a function to get all headers
function getAllHeaders($uri) {
    $response = $client->head($uri, ['headers' => $reqHeaders]);
    $statusCode = $response->getStatusCode();
    if ($statusCode === 200) {
        $headers = $response->getHeaders();
        $text = '{"httpCode":"' . $statusCode . '",';
        $text .= '"httpMsg":"' . $response->getReasonPhrase() . '",';
        $text .= '"requestURI":"' . $_SERVER['QUERY_STRING'] . '",';
        $text .= '"Requesting_User_Agent":"' . $_SERVER['HTTP_USER_AGENT'] . '",';
        $text .= '"Requesting_Accept_Header":"' . $_SERVER['HTTP_ACCEPT'] . '",';
        $text .= '"Requesting_Accept_Language":"' . $_SERVER['HTTP_ACCEPT_LANGUAGE'] . '",';
        foreach ($headers as $header => $value) {
            if (is_array($value)) {
                $text .= '"' . $header . '":[';
                foreach ($value as $val) {
                    $val = str_replace('"', '\\"', $val);
                    $text .= '"' . $val . '",';
                }
                $text = rtrim($text, ',') . '],';
            } else {
                $value = str_replace('"', '\\"', $value);
                $text .= '"' . $header . '":"' . $value . '",';
            }
        }
        return rtrim($text, ',') . '}';
    } else {
        throw new Exception("Error getting headers: " . $response->getReasonPhrase());
    }
}

// Define a function to show all headers (for debugging)
function showAllHeaders($uri) {
    $response = $client->head($uri, ['headers' => $reqHeaders]);
    $statusCode = $response->getStatusCode();
    if ($statusCode === 200) {
        $headers = $response->getHeaders();
        $text = "Headers for $uri are:\n\n";
        foreach ($headers as $header => $value) {
            $text .= "$header=$value\n\n";
        }
        return $text;
    } else {
        throw new Exception("Error getting headers: " . $response->getReasonPhrase());
    }
}

// Output the HTTP version
echo getHTTPVersion('id.gs1.org') . "\n";

// Output all headers
echo getAllHeaders('https://id.gs1.org') . "\n";

// Output debug information
echo showAllHeaders('https://id.gs1.org') . "\n";
