const fs = require('fs');
const util = require('util');
const fetch = require('node-fetch');

const readFilePromise = util.promisify(fs.readFile);

/**
 * Delivers the final response to the calling web client, and ends the HTTP connection
 * @param httpResponse
 * @param additionalHttpHeaders
 * @param body
 * @param httpResponseCode
 * @param processStartTime
 */
const resolverHTTPResponse = (httpResponse, additionalHttpHeaders, body, httpResponseCode, processStartTime) => {
  const fixedHttpHeaders = {
    Vary: 'Accept-Encoding',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'HEAD, GET, OPTIONS',
    'Access-Control-Expose-Headers': 'Link, Content-Length',
    'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate',
    'X-Resolver-ProcessTimeMS': calculateProcessingTime(processStartTime),
  };

  // Join the two sets of headers to produce one output set
  const outputHttpHeaders = { ...fixedHttpHeaders, ...additionalHttpHeaders };

  httpResponse.writeHead(httpResponseCode, outputHttpHeaders);
  httpResponse.end(body);
};

/**
 * response_200_Page gets the 200.html web page and prepares its html to be returned to the
 * client by the 'resolve' function. 'resolve' will call this function if the incoming request
 * includes 'linktype=all' and the request header is not specifically asking for a JSON response.
 * @param httpResponse
 * @param structure
 * @param linkSetDocument
 * @param qualifierPathDoc
 * @param jsonOrHtml
 * @param processStartTime
 * @returns {Promise<void>}
 */
// eslint-disable-next-line camelcase
const response_200_Page = async (httpResponse, structure, linkSetDocument, qualifierPathDoc, jsonOrHtml, processStartTime) => {
  let jsonLinkSetDocument = JSON.stringify(linkSetDocument, null, 2);
  const additionalHttpHeaders = {
    Link: qualifierPathDoc.linkHeaderText,
  };

  try {
    if (jsonOrHtml === 'HTML') {
      const pageHtml = await readFilePromise(`${__dirname}/../templates/responses/200.html`, 'utf8');
      jsonLinkSetDocument = pageHtml.replace('{"resolver_document": "here"}', jsonLinkSetDocument);
      additionalHttpHeaders['Content-Type'] = 'text/html';
      resolverHTTPResponse(httpResponse, additionalHttpHeaders, jsonLinkSetDocument, 200, processStartTime);
    } else {
      additionalHttpHeaders['Content-Type'] = 'application/json';
      resolverHTTPResponse(httpResponse, additionalHttpHeaders, jsonLinkSetDocument, 200, processStartTime);
    }
  } catch (error) {
    console.log(`response_200_Page: error is ${error}`);
    additionalHttpHeaders['Content-Type'] = 'application/json';
    resolverHTTPResponse(httpResponse, additionalHttpHeaders, jsonLinkSetDocument, 200, processStartTime);
  }
};

/**
 * Processes an HTTP 303 'See Other' redirect and used if, for example, the requested serial number qualifier is
 * not found from an exact match, but we know about 'higher' qualifiers such as lot number, thus 'See Other'.
 * @param httpResponse
 * @param url
 * @param qualifierPathDoc
 * @param processStartTime
 * @returns {Promise<void>}
 */
const response_303_See_Other = async (httpResponse, url, qualifierPathDoc, processStartTime) => {
  const additionalHttpHeaders = {
    Link: qualifierPathDoc.linkHeaderText,
    Location: formatRedirectLink(url, qualifierPathDoc.linkset.anchor, true),
  };
  await resolverHTTPResponse(httpResponse, additionalHttpHeaders, '', 303, processStartTime);
};

/**
 * Processes an HTTP 404 'Not Found' error, used whjen we have no record of this entry at all in the database
 * @param httpResponse
 * @param responseDoc
 * @param processStartTime
 * @returns {Promise<void>}
 */
const response_404_Not_Found_JSON = async (httpResponse, processStartTime) => {
  await resolverHTTPResponse(httpResponse, { 'Content-Type': 'application/json' }, '{ERROR: "Entry Not Found"}', 404, processStartTime);
};

/**
 * Processes an HTTP 410 'Gone Away' error, used when we have a record of this entry but its active flag is set to false.
 * @param httpResponse
 * @param responseDoc
 * @param processStartTime
 * @returns {Promise<void>}
 */

const response_410_Gone_Away_JSON = async (httpResponse, url, qualifierPathDoc, processStartTime) => {
  const additionalHttpHeaders = {
    // Link: url,
    // Location: url,
    'Content-Type': 'application/json',
  };
  await resolverHTTPResponse(httpResponse, additionalHttpHeaders, '{ERROR: "Entry Gone Away"}', 410, processStartTime);
};

/**
 * Returns a 404 Not Found page
 * @param identifierKeyType
 * @param identifierKey
 * @param httpResponse
 * @param processStartTime
 * @returns {Promise<string>}
 */
const response_404_Not_Found_HTML_Page = async (identifierKeyType, identifierKey, httpResponse, processStartTime) => {
  let html = '';
  try {
    const pageHtml = await readFilePromise(`${__dirname}/../templates/responses/404.html`, 'utf8');

    // Look for a specific string literal in the html with this template literals for gs1 key code and value,
    // and replace them with an appropriate message.
    html = pageHtml.replace('{"identifierKeyType"}', `${await convertAINumericToLabel(identifierKeyType)} (${identifierKeyType})`);
    html = html.replace('{"identifierKey"}', identifierKey);
  } catch (e) {
    html = `<h2>Entry /${identifierKeyType}/${identifierKey} not found</h2>`;
    console.log(`response_NotFoundPage error: ${e}`);
  }
  resolverHTTPResponse(httpResponse, { 'Content-Type': 'text/html' }, html, 404, processStartTime);
};

const calculateProcessingTime = (processStartTime) => {
  const processEndTime = new Date().getTime();
  return processEndTime - processStartTime;
};

/**
 * Converts a numeric GS1 Identifier Into its label (shortcode) equivalent.
 * If the incoming value is not a number, just returns it!
 * @param aiNumeric
 * @returns {string}
 */
const convertAINumericToLabel = async (aiNumeric) => {
  // eslint-disable-next-line no-restricted-globals
  if (!isNaN(aiNumeric)) {
    // const aiEntry = dlToolkit.aitable.find((entry) => entry.ai === aiNumeric);
    // return aiEntry.shortcode;

    try {
      const uriToTest = `http://digitallink-toolkit-service/ailookup/${aiNumeric}`;
      const fetchResponse = await fetch(uriToTest);
      const result = await fetchResponse.json();
      if (fetchResponse.status === 200) {
        return result.data;
      }
      console.log(`convertAINumericToLabel error: ${result}`);
      return null;
    } catch (err) {
      console.log(`convertAINumericToLabel error: ${err}`);
    }
    return null;
  }
  return aiNumeric;
};

/**
 * formatRedirectLink builds the redirect link, adding query strings provided in the request if the link's
 * fwqsFlag (Forward request querystrings) is set to 1, but not if set to 0. The destinationLink may have its
 * own querystrings (which are always used), so we need to check if the demarcation '?' is already present and,
 * if, so, add the request querystrings with & delimiter, not '?'.
 * @param requestUrl
 * @param destinationLink
 * @param fwqsFlag
 * @returns string
 */
const formatRedirectLink = (requestUrl, destinationLink, fwqsFlag) => {
  try {
    // If no request forward query strings are allowed to be forwarded then just return the original destination link
    if (!fwqsFlag) {
      return destinationLink;
    }

    // The request url gets split into two by the "?" and we use the second half, the text in in array element 1,
    // to append to the destination link:
    const requestQueryStrings = requestUrl.split('?')[1];

    if (requestQueryStrings === undefined) {
      // No query-strings were in the request so just return it.
      return destinationLink;
    }
    if (destinationLink.includes('?')) {
      // The '?' delimiter is already there, so we'll use a & to append the request query strings
      return `${destinationLink}&${requestQueryStrings}`;
    }
    // The '?' delimiter is NOT there, so we can use a ? to append the request query strings
    return `${destinationLink}?${requestQueryStrings}`;
  } catch (e) {
    console.log('formatRedirectLink ERROR: ', e);
    return '';
  }
};

module.exports = {
  resolverHTTPResponse,
  response_200_Page,
  response_303_See_Other,
  response_404_Not_Found_HTML_Page,
  response_404_Not_Found_JSON,
  response_410_Gone_Away_JSON,
  calculateProcessingTime,
  formatRedirectLink,
};
