const HttpStatus = require('http-status-codes');
const fetch = require('node-fetch');
const fs = require('fs');
const util = require('util');
const db = require('./db');
const responseFuncs = require('./responses');
const docFuncs = require('./documentFuncs');

const readFilePromise = util.promisify(fs.readFile);

/**
 * getDigitalLinkStructure calls into the GS1 DigitalInk Toolkit library and
 * returns the object structure (if any) or an error. This is an async (Promise)
 * function so as not to block calls during complex processing.
 * @param uri
 * @returns {Promise<{}|*>}
 */
const getDigitalLinkStructure = async (uri) => {
  let structuredObject = { result: '', error: '' };

  try {
    const fetchResponse = await fetch(`http://digitallink-toolkit-service/analyseuri${uri}`);
    const result = await fetchResponse.json();

    if (fetchResponse.status === 200) {
      structuredObject = result.data;
      structuredObject.result = 'OK';
    } else {
      structuredObject.result = 'ERROR';
      structuredObject.error = result.data;
      console.log(`getDigitalLinkStructure error: ${result.data}`);
    }
    return structuredObject;
  } catch (err) {
    structuredObject.result = 'ERROR';
    structuredObject.error = err.toString();
    return structuredObject;
  }
};

/**
 * Processes specific linktypes (that are not 'all') or when no linktype is supplied and the default must be found
 * @param httpRequest
 * @param incomingRequestDigitalLinkStructure
 * @param resolverFullDocument
 * @param httpResponse
 * @param processStartTime
 */
const processSpecificLinkType = (httpRequest, incomingRequestDigitalLinkStructure, resolverFullDocument, httpResponse, processStartTime) => {
  const identifierKeyType = Object.keys(incomingRequestDigitalLinkStructure.identifiers[0])[0];
  const identifierKey = incomingRequestDigitalLinkStructure.identifiers[0][identifierKeyType];
  const requestContentType = httpRequest.headers.accept;

  // This three-way flag is used to decide whether to output a JSON body, a LinkSet body, or No body at all (a classic redirect)
  let flagJsonLinkSetNone = 'NONE';
  if (requestContentType !== undefined && (requestContentType.includes('linkset+json') || requestContentType.includes('json+linkset'))) {
    flagJsonLinkSetNone = 'JSON';
  } else if (requestContentType !== undefined && requestContentType.includes('linkset')) {
    flagJsonLinkSetNone = 'LINKSET';
  }

  try {
    // STEP 1: FIND MATCHING QUALIFIERS (since there can be more than one in the same document as the 'resolverFullDocument' presents the
    //         entire knowledge base for the this product, useful in certain scenarios.
    // console.log("DEBUG =====> resolverFullDocument", resolverFullDocument);

    const responseDoc = docFuncs.getQualifierPathDoc(resolverFullDocument, incomingRequestDigitalLinkStructure.qualifiers);
    const qualifierPathDoc = responseDoc.doc;

    if (!qualifierPathDoc) {
      // There is no suitable qualifierPath being found. Return 404 NOT FOUND
      responseFuncs.response_404_Not_Found_JSON(httpResponse, processStartTime).then();
      return;
    }

    // check status for lincence fee paid or not by seeing active property false or true
    // if active is false means lincence fee not paid by the client so, we need send the 410 http status code with error message "entry gone away"
    if (!qualifierPathDoc.active) {
      responseFuncs.response_410_Gone_Away(httpResponse, identifierKeyType, identifierKey, processStartTime).then();
      return;
    }
    if (!responseDoc.exact) {
      responseFuncs.response_303_See_Other(httpResponse, httpRequest.url, responseDoc.doc, processStartTime).then();
      return;
    }

    // STEP 2: Find the desired response for the four contexts: linkType, language, context/territory and MimeType
    //        linkType, then language (lang), then context, then finally mime_type (document type, eg 'text/html').
    //        This will result in an object with four values - link, fwqs, linktype_uri and title.

    // USe getAttributeFromHTTPHeaders(httpRequest) to get a returned object with this format:
    // {linkType: "", {languageContexts: [{ianaLanguage: "", context: ""], mimeTypes: [""]}}
    // Real world example where a web browser is sending a request to into resolver:
    // {
    // "linkType":"",
    // "languageContexts":[{"ianaLanguage":"en","context":"GB"},
    //                     {"ianaLanguage":"en","context":"US"},
    //                     {"ianaLanguage":"en","context":"xx"}],
    // "mimeTypes":["text/html",
    //              "application/xhtml+xml",
    //              "application/xml",
    //              "image/avif",
    //              "image/webp",
    //              "image/apng",
    //              "*/*",
    //              "application/signed-exchange"]
    // }

    const requestedAttributes = getAttributeFromHTTPHeaders(httpRequest);
    // Now get the linkType from the digital link structure
    // and populate the existing but empty-string property requestedAttributes.linkType
    requestedAttributes.linkType = getRequestLinkType(incomingRequestDigitalLinkStructure);

    // Now find suitable response using these requested attributes:
    const resolverObj = docFuncs.findSuitableResponse(qualifierPathDoc, requestedAttributes);

    if (!resolverObj) {
      // Game over - there is nothing more we can do as there is no data match.
      responseFuncs.response_404_Not_Found_HTML_Page(identifierKeyType, identifierKey, httpResponse, processStartTime).then();
      return;
    }

    // STEP 3: Build the Link Header, which contains all the linktypes, languages, contexts and mime_types in qualifierPathDoc.
    // and build it into the addition HTTP headers to be sent back to the client.
    // It can be be in linkSet or linkHeader format
    const additionalHttpHeaders = {
      Link: '', // <-- empty string that will be populated below - see additionalHttpHeaders.Link = ...
      Location: responseFuncs.formatRedirectLink(httpRequest.url, resolverObj.link, resolverObj.fwqs),
    };

    if (flagJsonLinkSetNone === 'NONE') {
      // We are going to send back a page with a standard link header
      additionalHttpHeaders.Link = qualifierPathDoc.linkHeaderText;
      responseFuncs.resolverHTTPResponse(httpResponse, additionalHttpHeaders, null, 307, processStartTime);
    } else if (flagJsonLinkSetNone === 'JSON') {
      additionalHttpHeaders.Link = qualifierPathDoc.linkHeaderText;
      const linkSetJson = { linkset: qualifierPathDoc.linkset };
      responseFuncs.resolverHTTPResponse(httpResponse, additionalHttpHeaders, JSON.stringify(linkSetJson, null, 2), 200, processStartTime);
    } else {
      // flagJsonLinkSetNone === "LINKSET"
      const linkSetData = { linkset: qualifierPathDoc.linkset };
      additionalHttpHeaders.Link = linkSetData;
      responseFuncs.resolverHTTPResponse(httpResponse, additionalHttpHeaders, linkSetData, 200, processStartTime);
    }
  } catch (error) {
    // Catches the no document found for further processing
    console.log(`processSpecificLinkType error: ${error.toString()}`, error);
    responseFuncs.response_404_Not_Found_HTML_Page(identifierKeyType, identifierKey, httpResponse, processStartTime).then();
  }
};

/**
 * Gets the linktype that has arrived with the request (if any)
 * @param digitalLinkStructure
 * @returns {string}
 */
const getRequestLinkType = (digitalLinkStructure) => {
  let linkType = 'xx'; // linkType is initialised with its 'not applicable' internal value.
  if (digitalLinkStructure.other && Array.isArray(digitalLinkStructure.other) && digitalLinkStructure.other.length > 0) {
    digitalLinkStructure.other.forEach((other) => {
      Object.keys(other).forEach((name) => {
        if (name.toLowerCase() === 'linktype') {
          linkType = other[name];
        }
      });
    });
  }
  return linkType;
};

/**
 * Processes LinkType=all requests by sending an HTML page or linkset JSON
 * @param httpRequest
 * @param incomingRequestDigitalLinkStructure
 * @param resolverFullDocument
 * @param httpResponse
 * @param processStartTime
 * @returns {Promise<void>}
 */
const processLinkTypeAll = async (httpRequest, incomingRequestDigitalLinkStructure, resolverFullDocument, httpResponse, processStartTime) => {
  const requestContentType = httpRequest.headers.accept;
  let jsonOrHtml = 'HTML';
  if (requestContentType !== undefined && requestContentType.includes('json')) {
    jsonOrHtml = 'JSON';
  }

  if (resolverFullDocument) {
    const linkSetArray = { linkset: [] };
    let qualifierPathDoc;

    // This loop gets all the linkset documents, one for each set of incomingRequestDigitalLinkStructure.qualifiers.
    // So if a request qualifierPath is "/lot/ABC/ser/123" then we retrieve the linkset document from that qualifier path.
    // After than we want the linkset document for "/lot/ABC" and finally for "/". In this example, the array
    // incomingRequestDigitalLinkStructure.qualifiers looks like this:
    // [ { '10': 'ABC' }, { '21': '123' } ]
    // By removing the final element with pop()'), we then get the linkset document for the remaining qualifier.
    // Finally, once the array is empty, we then get the linkset document for the 'root' '/' qualifier.
    let finishFlag = false;
    do {
      finishFlag = incomingRequestDigitalLinkStructure.qualifiers.length === 0;
      const responseDoc = docFuncs.getQualifierPathDoc(resolverFullDocument, incomingRequestDigitalLinkStructure.qualifiers);

      if (!responseDoc.exact) {
        await responseFuncs.response_303_See_Other(httpResponse, httpRequest.url, responseDoc.doc, processStartTime);
        return;
      }

      qualifierPathDoc = responseDoc.doc;

      // TODO: Once data rebuild has completed, qualifierPathDoc.linkSet will be an object, no longer an array on resolver-dv1
      const thisQualifiersLinkSet = Array.isArray(qualifierPathDoc.linkset) ? qualifierPathDoc.linkset[0] : qualifierPathDoc.linkset;

      // If a qualifier is not matched in the qualifierPathDoc (using the above example, we asked for ser 124 which does not
      // exist), then qualifierPathDoc will be the result of getQualifierPathDoc() 'walking up the tree' - correct when used
      // elsewhere in this application, but we end up doubling up the first 'walking up the tree' document when this loop
      // 'walks up the tree' itself by pop()'ing the qualifier list from the qualifiers array.
      // So only if the doc is not already there (by comparing the .anchor properties), then add it.
      if (!linkSetArray.linkset.some((linksetEntry) => linksetEntry.anchor === thisQualifiersLinkSet.anchor)) {
        linkSetArray.linkset.push(thisQualifiersLinkSet);
      }

      // Now remove the 'bottom' entry from the incomingRequestDigitalLinkStructure.qualifiers array:
      incomingRequestDigitalLinkStructure.qualifiers.pop();
    } while (!finishFlag);

    // We don't show internal value 'xx' (meaning 'not applicable') to the outside world! Instead we make it an empty string.
    const linkSetDocument = JSON.parse(JSON.stringify(linkSetArray).replace(/'"xx"/g, '""'));

    // Send the response 200 page back
    await responseFuncs.response_200_Page(httpResponse, incomingRequestDigitalLinkStructure, linkSetDocument, qualifierPathDoc, jsonOrHtml, processStartTime);
  } else {
    await responseFuncs.response_404_Not_Found_HTML_Page(incomingRequestDigitalLinkStructure, resolverFullDocument, httpResponse, processStartTime);
  }
};

/**
 * Returns the requested linkType, language, context and mimeType from the incoming request headers, where found.
 * @param httpRequest
 * @returns {{mimeTypes: [], languageContexts: [], linkType: string}}
 */
const getAttributeFromHTTPHeaders = (httpRequest) => {
  const attributes = {
    linkType: '',
    languageContexts: [],
    mimeTypes: [],
  };

  // Example header value: 'accept-language': 'en-GB,en;q=0.9,fr-FR;q=0.8'
  if (httpRequest.headers['accept-language']) {
    // <-- note how Node HTTP sees these as lower-case header names
    const languagesArray = httpRequest.headers['accept-language'].split(',');

    // Here we are extracting the requested languages ('en') and contexts ('GB') from the accept-language array.
    // Note that sometimes a language does not have a context. In this case we use value 'xx' if there is no
    // context for a particular language. See the example above in these comments for two languages with contexts and one with none.
    // Some languages have q=values for preference. We are sort-of ignoring them but they tend to
    // arrive in descending order of preference in any case, so higher preferences will appear earlier in our array,
    // and we'll be matching them with a document as early as possible in processSpecificLinkType().
    languagesArray.forEach((language) => {
      const languageContext = {
        ianaLanguage: language.substring(0, 2),
        context: 'xx',
      };

      const wantedLangSection = language.split(';');
      if (wantedLangSection[0].length === 5) {
        languageContext.context = language.substring(3, 5);
      }

      attributes.languageContexts.push(languageContext);
    });
  }

  // Example header value: 'Accept': text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
  if (httpRequest.headers.accept) {
    const acceptArray = httpRequest.headers.accept.split(',');

    // Here we are extracting the requested acceptable mimeTypes by splitting the list by comma.
    // Some mimeTypes have q=values for preference. We are sort-of ignoring them but they tend to
    // arrive in descending order of preference in any case, so higher preferences will appear earlier in our array
    // and we'll be matching them with a document as early as possible in processSpecificLinkType().
    acceptArray.forEach((accept) => {
      attributes.mimeTypes.push(accept.split(';')[0]);
    });
  }
  return attributes;
};

/**
 * Returns the well-known json response to a '/.well-known/gs1resolver' request
 * @param httpResponse
 * @param processStartTime
 * @returns {Promise<void>}
 */
const processWellKnownRequest = async (httpResponse, processStartTime) => {
  console.log('Building .well-known/gs1resolver');
  const readFileAsync = util.promisify(fs.readFile);
  let wellKnownJson = '';
  try {
    // Get the wellknown main file, which we will be adding the linktypes to:
    wellKnownJson = await readFileAsync('./src/wellknown.json', { encoding: 'utf8' });
    try {
      // Go and get the up to date linktypes list
      const fetchResponse = await fetch('https://www.gs1.org/voc/?show=linktypes', {
        method: 'get',
        headers: { Accept: 'application/json' },
      });

      if (fetchResponse.status === 200) {
        // Get the linktypes list as JSON from the response
        const linkTypes = await fetchResponse.json();
        // Convert the JSON in wellKnownJSON to an object
        const wellKnown = JSON.parse(wellKnownJson);

        // Add GTIN to each linktype property as applying to that particular GS! key Code
        for (const linkTypeKey of Object.keys(linkTypes)) {
          linkTypes[linkTypeKey].gs1key = 'gtin';
        }

        // Add the linktypes list to the wellknown document
        wellKnown.activeLinkTypes = {};
        wellKnown.activeLinkTypes['en-GB'] = linkTypes;
        wellKnown.activeLinkTypes['en-US'] = linkTypes;

        // Convert the wellknown doc back to JSON
        wellKnownJson = JSON.stringify(wellKnown, null, 2);
        // Send the results back to the calling user
        await responseFuncs.resolverHTTPResponse(httpResponse, { 'Content-Type': 'application/json' }, wellKnownJson, 200, processStartTime);
      } else {
        httpResponse.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        console.log('processWellKnownRequest get linktypes error: received status ', fetchResponse.status);
      }
    } catch (err) {
      console.log('processWellKnownRequest get linktypes error: ', err);
      httpResponse.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  } catch (error) {
    console.log(`processWellKnownRequest error: ${error}`);
  }
};

/**
 * Returns the resolver description file at /resolver/src/resolverDescriptionFile.schema.json
 * @param httpResponse
 * @param processStartTime
 * @returns {Promise<void>}
 */
const processResolverDescriptionFile = async (httpResponse, processStartTime) => {
  const readFileAsync = util.promisify(fs.readFile);
  let resolverDescriptionFile = '';
  try {
    resolverDescriptionFile = await readFileAsync('/resolver/src/resolverDescriptionFile.schema.json', { encoding: 'utf8' });
    await responseFuncs.resolverHTTPResponse(httpResponse, { 'Content-Type': 'application/json' }, resolverDescriptionFile, 200, processStartTime);
  } catch (error) {
    console.log(`processWellKnownRequest error: ${error}`);
  }
};

/**
 * processRequest - is the core processing function which takes the incoming request and processes it
 * into output. It manages the HTTP response back to the calling client.
 * @param httpRequest
 * @param incomingRequestDigitalLinkStructure
 * @param resolverFullDocument
 * @param httpResponse
 * @param processStartTime
 */
const processRequest = (httpRequest, incomingRequestDigitalLinkStructure, resolverFullDocument, httpResponse, processStartTime) => {
  // Test if "linktype=all" was provided in the request, in which case we just
  // send the 200.html page (or just JSON if JSON was requested in the request headers)
  if (httpRequest.url.toLowerCase().includes('linktype=all')) {
    processLinkTypeAll(httpRequest, incomingRequestDigitalLinkStructure, resolverFullDocument, httpResponse, processStartTime).then();
  } else {
    processSpecificLinkType(httpRequest, incomingRequestDigitalLinkStructure, resolverFullDocument, httpResponse, processStartTime);
  }
};

/**
 * processGCPRedirect builds and sends a 307 Temporary Redirect of a GCP entry
 * @param httpRequest
 * @param gcpDoc
 * @param httpResponse
 * @param processStartTime
 * @param identifierKeyType
 */
const processGCPRedirect = (httpRequest, gcpDoc, httpResponse, processStartTime, identifierKeyType) => {
  const additionalHttpHeaders = { Location: `${gcpDoc.resolve_url_format}/${identifierKeyType}${httpRequest.url}` };
  // Add 'gs1:handledBy' to GCP Redirects as link header
  additionalHttpHeaders.Link = '<linkType>; rel="gs1:handledBy"';
  responseFuncs.resolverHTTPResponse(httpResponse, additionalHttpHeaders, null, 307, processStartTime);
};

/**
 * The unixtime process allows clients to download data from the resolver in paged batches.
 * Commands are:
 * /unixtime/<unixtime>/count
 * /unixtime/<unixtime>/page/<page number/limit/<limit>
 * @param url
 * @param response
 * @param processStartTime
 * @returns {Promise<void>}
 */
const processUnixTime = async (url, response, processStartTime) => {
  try {
    const urlArray = url.toLowerCase().split('/');
    let result = {};
    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(urlArray[2])) {
      const minUnixTime = urlArray[2];
      const command = urlArray[3];
      if (command === 'count') {
        const count = await db.countEntriesFromUnixTime(minUnixTime);
        result = { count };
      } else if (command === 'page') {
        let pageSize = 1000;
        let pageNumber = 1;

        if (urlArray.length >= 5) {
          // eslint-disable-next-line no-restricted-globals
          if (!isNaN(urlArray[3])) {
            // eslint-disable-next-line prefer-destructuring
            pageNumber = urlArray[3];
          }
        }
        // eslint-disable-next-line no-restricted-globals
        if (urlArray.length === 7 && urlArray[5] === 'limit' && !isNaN(urlArray[6])) {
          // eslint-disable-next-line prefer-destructuring
          pageSize = urlArray[6];
        }

        const dataResult = await db.getPagedEntriesFromUnixTime(minUnixTime, pageNumber, pageSize);

        result = {
          PAGE: pageNumber,
          LIMIT: pageSize,
          DATA: dataResult,
        };
      }

      await responseFuncs.resolverHTTPResponse(response, { 'Content-Type': 'application/json' }, JSON.stringify(result, null, 2), 200, processStartTime);
    } else {
      result = { MESSAGE: 'ERROR: Malformed unixtime syntax - use "/unixtime/<fromunixtime>/count" or "/unixtime/<fromunixtime>/page/<pagenumber>/limit/<limit>"' };
      const pageHtml = await readFilePromise(`${__dirname}/../templates/responses/400.html`, 'utf8');
      const jsonLinkSetDocument = pageHtml.replace('{"resolver_document": "here"}', result);
      await responseFuncs.resolverHTTPResponse(response, { 'Content-Type': 'text/html' }, jsonLinkSetDocument, 400, processStartTime);
    }
  } catch (err) {
    console.log(`processUnixTime error: ${err}`);
  }
};

module.exports = {
  getDigitalLinkStructure,
  processResolverDescriptionFile,
  processRequest,
  processGCPRedirect,
  processWellKnownRequest,
  processUnixTime,
};
