const base64_encoding_and_decoding = require('./base64_encoding_and_decoding');
const db = require('./db');
const HttpStatus = require('http-status-codes');
const fetch = require('node-fetch');
const fs = require('fs');
const util = require('util');
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

  try {
    // STEP 1: FIND MATCHING QUALIFIERS (since there can be more than one in the same document as the 'resolverFullDocument' presents the
    //         entire knowledge base for the this product, useful in certain scenarios.
    const qualifierPathDoc = getQualifierPathDoc(resolverFullDocument, incomingRequestDigitalLinkStructure.qualifiers);
    if (!qualifierPathDoc) {
      // There is no suitable qualifierPath being found. Return 404 NOT FOUND
      resolverHTTPResponse(httpResponse, { 'Content-Type': 'application/json' }, '{"Error": "No document found"}', 404, processStartTime);
      return;
    }

    // STEP 2: Find the desired for contexts: linkType, langiage, context and MimeType
    //        linkType, then language (lang), then context, then finally mime_type (document type, eg 'text/html').
    //        This will result in an object with four values - link, fwqs, linktype_uri and title.

    // Get an object with this format: // : {linkType: "", {languageContexts: [{ianaLanguage: "", context: ""], mimeTypes: [""]}}
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
    const resolverObj = findSuitableResponse(qualifierPathDoc, requestedAttributes);

    if (!resolverObj) {
      // Game over - there is nothing more we can do as there is no data match.
      response_NotFoundPage(identifierKeyType, identifierKey, httpResponse, processStartTime).then();
      return;
    }

    // STEP 3: Build the Link Header, which contains all the linktypes, languages, contexts and mime_types in qualifierPathDoc.
    // and build it into the addition HTTP headers to be sent back to the client.
    // It can be be in linkSet or linkHeader format
    const additionalHttpHeaders = {
      Link: '', // <-- empty string that will be populated below - see additionalHttpHeaders.Link = ...
      Location: formatRedirectLink(httpRequest.url, resolverObj.link, resolverObj.fwqs),
    };

    if (httpRequest.url.toLowerCase().includes('linktype=linkset')) {
      // <-- note: lowercase matching
      // We are going to send back a page with a link set
      const linkSetData = getLinkSetData(qualifierPathDoc, incomingRequestDigitalLinkStructure);
      additionalHttpHeaders.Link = linkSetData.link;
      resolverHTTPResponse(httpResponse, additionalHttpHeaders, JSON.stringify(linkSetData.body, null, 2), 200, processStartTime);
    } else {
      // We are going to send back a page with a standard link header
      additionalHttpHeaders.Link = getLinkHeaderText(qualifierPathDoc, incomingRequestDigitalLinkStructure);
      resolverHTTPResponse(httpResponse, additionalHttpHeaders, null, 307, processStartTime);
    }
  } catch (error) {
    // Catches the no document found for further processing
    console.log(`processSpecificLinkType error: ${error.toString()}`);
    response_NotFoundPage(identifierKeyType, identifierKey, httpResponse, processStartTime).then();
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
 * This function returns the most suitable response for the given requested attributes.
 * When looking at the logic bear in mind that the attributes have a priority order:
 * 1. LinkType ("gs1:pip")
 * 2. ianaLanguage ("en", "fr")
 * 3. context (in this Resolver, territory ("GB", "US", "FR")
 * 4. mimeType ("text/html")
 * So we can match entries that match, say, linkType, ianaLanguage and context but not mimeType.
 * Or entries that match linkType and ianaLanguage but not context or mimeType.
 * To help us, Resolver data entry allows for 'default' flags set to true or false for each attribute.
 * For example, if we can match on linkType, ianaLanguage but not context, we can look for an entry
 * with matching linkType, ianaLanguage and with 'defaultContext' set to true.
 * Example (responses snippet)
 *responses": [
 {
        "link": "https://dalgiardino.com/where-to-buy/",
        "title": "Product Information Page",
        "linkType": "gs1:hasRetailers",
        "ianaLanguage": "en",
        "context": "xx",
        "mimeType": "text/html",
        "active": true,
        "fwqs": true,
        "defaultLinkType": false,
        "defaultIanaLanguage": true,
        "defaultContext": true,
        "defaultMimeType": true
      },
 {
        "link": "https://dalgiardino.com/extra-virgin-olive-oil/",
        "title": "Product Information Page",
        "linkType": "gs1:pip",
        "ianaLanguage": "en",
        "context": "xx",
        "mimeType": "text/html",
        "active": true,
        "fwqs": true,
        "defaultLinkType": true,
        "defaultIanaLanguage": true,
        "defaultContext": true,
        "defaultMimeType": true
      }, ...
 * @param qualifierPathDoc
 * @param requestedAttributes
 * @returns {*|[]|*[]}
 */
const findSuitableResponse = (qualifierPathDoc, requestedAttributes) => {
  // requestedAttributes has this two-array format plus linkType:
  // example: {linkType: "gs1:pip", {languageContexts: [{ianaLanguage: "en", context: "GB"], mimeTypes: ["text/html"]}}

  // Do we have a linktype (other than the 'no-linktype' = 'xx' value?) If not let's get the default linktype:
  if (requestedAttributes.linkType === 'xx') {
    const defaultLinkTypeResponse = qualifierPathDoc.responses.find((response) => response.defaultLinkType);
    if (defaultLinkTypeResponse) {
      requestedAttributes.linkType = defaultLinkTypeResponse.linkType;
    } else {
      // We should not ever be here - it means that not only is there is no linktype arrived with the request,
      // but the data for this group of responses has no default flag set!
      // In this case we will take the linktype in the first response entry and issue a warning message to stdout.
      requestedAttributes.linkType = qualifierPathDoc.responses[0].linkType;
      console.log('WARNING No default linktype assigned for qualifier path', qualifierPathDoc, 'so first linktype chosen');
    }
  }

  console.log('DEBUG findSuitableResponse linkType ==>', requestedAttributes.linkType);
  let suitableResponse = {};

  // Now we are going to loop through all the language/contexts requested (e,g, {ianaLanguage: 'en', context: 'GB')
  // to see if we can get a match. Web clients normally supply language/contexts in descending order of preference
  // so the earlier we get a match in this for() loop the better:
  for (const languageContext of requestedAttributes.languageContexts) {
    console.log('DEBUG findSuitableResponse languageContext==>', languageContext);
    // We will loop through all the mimeTypes requested to see if we can get a match.
    // Web clients normally supply mimeTypes in descending order of preference.
    for (const mimeType of requestedAttributes.mimeTypes) {
      console.log('DEBUG findSuitableResponse mimeType==>', mimeType);
      suitableResponse = qualifierPathDoc.responses.find(
        (response) =>
          response.linkType.toLowerCase() === requestedAttributes.linkType.toLowerCase() &&
          response.ianaLanguage.toLowerCase() === languageContext.ianaLanguage.toLowerCase() &&
          response.context.toLowerCase() === languageContext.context.toLowerCase() &&
          response.mimeType.toLowerCase() === mimeType.toLowerCase(),
      );

      if (suitableResponse) {
        console.log('DEBUG findSuitableResponse ==> FULL MATCH of linkType, language, context and mimeType');
        return suitableResponse;
      }
    }

    // OK so no Full match was found, and we tried all the different requested mimeTypes.
    // Let's see if we can find a match with linkType, ianaLanguage and context with a defaultMimeType flag set:
    suitableResponse = qualifierPathDoc.responses.find(
      (response) =>
        response.linkType.toLowerCase() === requestedAttributes.linkType.toLowerCase() &&
        response.ianaLanguage.toLowerCase() === languageContext.ianaLanguage.toLowerCase() &&
        response.context.toLowerCase() === languageContext.context.toLowerCase() &&
        response.defaultMimeType,
    );

    if (suitableResponse) {
      console.log('DEBUG findSuitableResponse ==> MATCH of linkType, language, context and default MimeType');
      return suitableResponse;
    }

    // Still no match was found. Let's see if we can find a match with linkType, ianaLanguage and default context:
    suitableResponse = qualifierPathDoc.responses.find(
      (response) =>
        response.linkType.toLowerCase() === requestedAttributes.linkType.toLowerCase() &&
        response.ianaLanguage.toLowerCase() === languageContext.ianaLanguage.toLowerCase() &&
        response.defaultContext,
    );

    if (suitableResponse) {
      console.log('DEBUG findSuitableResponse ==> MATCH of linkType, language, and default context');
      return suitableResponse;
    }
  }

  // Still no match was found, and that was with trying to match with all the supplied language/contexts.
  // Let's see if we can find a match with just linkType and default ianaLanguage:
  suitableResponse = qualifierPathDoc.responses.find(
    (response) => response.linkType.toLowerCase() === requestedAttributes.linkType.toLowerCase() && response.defaultIanaLanguage,
  );

  if (suitableResponse) {
    console.log('DEBUG findSuitableResponse ==> MATCH of linkType and default language');
    return suitableResponse;
  }

  // Still no match was found. Let's see if we can find a match with linkType only:
  suitableResponse = qualifierPathDoc.responses.find((response) => response.linkType.toLowerCase() === requestedAttributes.linkType.toLowerCase());

  if (suitableResponse) {
    console.log('DEBUG findSuitableResponse ==> MATCH of linkType only');
    return suitableResponse;
  }

  // Still no match was found. Let's see if we can find a match with the default linkType:
  suitableResponse = qualifierPathDoc.responses.find((response) => response.defaultLinkType);

  if (suitableResponse) {
    console.log('DEBUG findSuitableResponse ==> MATCH of default linkType only');
    return suitableResponse;
  }

  // We shouldn't ever be here but this can happen with data issues, so we'll just stop here
  // and 'undefined' will be returned to the calling function, which will return a 404 NOT FOUND
  console.log('NO MATCH');
};

const makeDestLinkCompatibleWithURITemplate = (resolverObj, incomingRequestDigitalLinkStructure) => {
  // TODO: Rajesh's original code
  // Make destinationLink compatible with uri template
  const URI_TEMPLATE_SPECIFIER_VALUE = {
    serialnumber: '21',
  };
  let _destinationLink = decodeURI(resolverObj.link);
  _destinationLink = _destinationLink.match(/\{.+?\}/g).map((uriTemplate) => {
    const _tempStr = uriTemplate.match(/\{([\s\S]+)\}/)[1];
    const _uriValue = URI_TEMPLATE_SPECIFIER_VALUE[_tempStr];
    let _objfind = incomingRequestDigitalLinkStructure.qualifiers.find((q) => q[_uriValue]);
    _objfind = _objfind[_uriValue];
    const _qualifierValueFromObj = _objfind.match(/\{([\s\S]+)\}/)[1];
    _destinationLink.replace(/{serialnumber}/, _qualifierValueFromObj);
    return _destinationLink;
  });
};

/**
 *  * Processes LinkType=all requests with an interstitial page
 * @param httpRequest
 * @param incomingRequestDigitalLinkStructure
 * @param resolverDBdocument
 * @param httpResponse
 * @param processStartTime
 * @returns {Promise<void>}
 */
const processLinkTypeAll = async (httpRequest, incomingRequestDigitalLinkStructure, resolverDBdocument, httpResponse, processStartTime) => {
  const requestContentType = httpRequest.headers.accept;
  let jsonOrHtml = 'HTML';
  if (requestContentType !== undefined && requestContentType.includes('json')) {
    jsonOrHtml = 'JSON';
  }

  if (resolverDBdocument) {
    const qualifierPathDoc = getQualifierPathDoc(resolverDBdocument, incomingRequestDigitalLinkStructure.qualifiers);

    // We don't show internal value 'xx' (meaning 'not applicable') to the outside world! Instead we make it an empty string.
    resolverDBdocument = JSON.parse(JSON.stringify(resolverDBdocument).replace(/'"xx"/g, '""'));

    // Send the interstitial page back
    await response_InterstitialPage(httpResponse, incomingRequestDigitalLinkStructure, resolverDBdocument, qualifierPathDoc, jsonOrHtml, processStartTime);
  } else {
    await response_NotFoundPage(incomingRequestDigitalLinkStructure, resolverDBdocument, httpResponse, processStartTime);
  }
};

/**
 * * Performs variable matching on qualifier paths
 * Here we look to see if the incoming request can be satisfied with a qualifier path containing variables
 * in the format example: http://resolverdomain/01/00889842179354/10/{lotnumber}/21/{serialnumber}.
 * The actual variable names between the curly brackets can be any ascii string! What's important is that
 * the exact same variable names can be found in each of the resolver[].link properties.
 * In this example: link="http://destination-domain-name/gtin/00889842179354/lot/{lotnumber}?serial={serialnumber}
 * which happens to be the format that the destination web server application is expecting values.
 *
 * To do this, we check the incoming qualifiers array associated with the request, with entries containing
 * a match variables array. Our goal is to find a match and, if so, link the requests actual values and
 * the qualifiers path's variable names.
 * For example:
 * We receive this request: http://resolverdomain/01/00889842179354/lot/ABC/ser/123
 * The requested qualifiers are: /lot/ABC/ser/123
 * DigitalLink Toolkit authors a qualifiers array which arrives in this matchPathVariables() function
 * in the 'qualifiers' variable: [{ '10': 'ABC' }, { '21': '123' }]
 * We look through all the qualifierPaths in the incoming 'doc' variable to see if we can find any with a
 * 'variables' property - this property has been added by the Build application if it finds any {variables}
 * in the 'qualifiers' column of the SQL database table 'uri_responses'.
 * In this case, the variables array has value: [{ '10': '{lot}' }, { '21': '{serialnumber}' }]
 *
 * Sometimes the variables array can include fixed valyes. e.g. lot has fixed value '1111'
 * http://resolverdomain/01/00889842179354/10/1111/21/{serialnumber}
 * In this case, the variables array has value: [{ '10': '1111' }, { '21': '{serialnumber}' }]
 * Since lot value uis fixed it cannot be substituted, so will match an incoming request such as:
 * http://resolverdomain/01/00889842179354/10/1111/21/{serialnumber}.
 *
 * This allows our logic to choose different qualifierPaths for:
 * http://resolverdomain/01/00889842179354/10/1111/21/1234
 * http://resolverdomain/01/00889842179354/10/1234/21/1234
 *
 * We then use these values to replace the variables with actual values, altering the link property in
 * all the responses.
 * WE must link ALL the variables - we can't leave any link URLs with {variables} in them. If this happens
 * we reject the match.
 * @param doc
 * @param qualifiers
 * @returns {*}
 */
function matchPathVariables(doc, qualifiers) {
  try {
    let allVariablesMatchFlag = false;
    for (const qualifierPath of Object.keys(doc)) {
      if (doc[qualifierPath].variables && Array.isArray(doc[qualifierPath].variables) && doc[qualifierPath].variables.length === qualifiers.length) {
        let variableMatchCount = 0;
        for (let index = 0; index < qualifiers.length; index++) {
          for (const variable of doc[qualifierPath].variables) {
            //A keyMatch is True if the current variable key matches the current qualifier key:
            const keyMatch = Object.keys(variable)[0] === Object.keys(qualifiers[index])[0];
            //A valueMatch is True if the current variable value is a {variable} OR the current variable value matches the current fixed qualifier value:
            const valueMatch = Object.values(variable)[0].includes('{') || Object.values(variable)[0] === Object.values(qualifiers[index])[0];

            if (keyMatch && valueMatch) {
              const q = qualifiers[index];
              q.variable = Object.values(variable)[0];
              qualifiers[index] = q;
              variableMatchCount += 1;
              //If the ALL variable names have matched and we have the same number of matches
              //as there are found in doc[qualifierPath].variables then we have a full match.
              if (variableMatchCount === doc[qualifierPath].variables.length) {
                allVariablesMatchFlag = true;
              }
            }
          }
        }
      }

      if (allVariablesMatchFlag) {
        // Now replace all variables in the doc[qualifierPath] with actual values
        // To this, loop through all the responses.link in doc[qualifierPath] and replace them!
        qualifiers.forEach((qualifier) => {
          for (let i = 0; i < doc[qualifierPath].responses.length; i++) {
            let { link } = doc[qualifierPath].responses[i];
            link = decodeURI(link).replace(qualifier.variable, Object.values(qualifier)[0].toString());
            doc[qualifierPath].responses[i].link = link;
          }
        });
        // Return the altered responses document
        return doc[qualifierPath];
      }
    }
    // no match happened so return undefined for qualifierPath
  } catch (e) {
    console.log('matchPathVariables error:', e.toString());
    // an error occurred so return undefined for qualifierPath
  }
}

/**
 * getQualifierPathDoc Locates and returns the required subset of the document returned earlier by the resolver's
 * document database.
 * Build the qualifierPath from the qualifiers array (which came from the DigitalLink Toolkit response)
 * This loop will start with the maximum number of qualifiers then, if there's no match, try again with
 * the 'last' qualifier removed, and then 2 removed, and so on until either we have a match or we run of out
 * of qualifiers.
 * e.g. if the initial qualifierPath is "/lot/ABC/ser/123456" and we don't get a match, we take off the
 * the right-most qualifier and try match again e.g. "/lot/ABC" - a process known as 'walking up the tree'.
 * This is because leftmost qualifiers are more 'significant' than rightmost qualifiers.
 * For GTIN, a cpv can have many lots and each lot can have many serial numbers, so the Digital Link standard
 * states that the order should be: /cpv/nnnn/lot/nnnnn/ser/nnnnnnn
 * @param doc
 * @param qualifiers
 * @returns {null|*}
 */
const getQualifierPathDoc = (doc, qualifiers) => {
  let dlQualifiersPath = '';

  //If we can get a matched path with all the variables assigned then we have the correct QualifierPathDoc
  //and can return it form this function immediately.
  const matchedResponse = matchPathVariables(doc, qualifiers);
  if (matchedResponse) {
    return matchedResponse;
  }
  // Let's look at the non-template responses and see if we can get a match using the 'walking up the tree' process:
  for (let qualifiersCountToConcatenate = qualifiers.length; qualifiersCountToConcatenate > 0; qualifiersCountToConcatenate--) {
    dlQualifiersPath = '';
    // this loops builds a specific qualifier list
    for (let thisQualifier = 0; thisQualifier < qualifiersCountToConcatenate; thisQualifier++) {
      const qualifierKey = Object.keys(qualifiers[thisQualifier])[0];
      const qualifierKeyValue = qualifiers[thisQualifier][qualifierKey];
      dlQualifiersPath += `/${qualifierKey}/${qualifierKeyValue}`;
    }

    // test this new qualifier list to see if we get a match
    if (doc[dlQualifiersPath]) {
      return doc[dlQualifiersPath]; // We have found a matching variant in the document so we'll stop here.
    }
  }

  // By the time we reach here, we have no qualifiers! We will just return the 'root qualifier' "/"
  if (!doc[dlQualifiersPath]) {
    // We have no matching qualifiers, or there are no qualifiers to match with, so
    // see if we can match the 'root qualifier' signified by the '/' symbol.
    const _rootLevelDoc = doc['/'];
    if (!_rootLevelDoc) {
      // SIGNAL that there is nothing that matches so later we will show the interstitial page (later)
      // by returning an empty object that will be detected by the calling function.
      return {};
    }
    return _rootLevelDoc;
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
 * Rebuilds the original request using just the output from DigitalLinkToolkit which
 * will be used by calling functions to see if the incoming request is different (that is, compressed):
 * @param incomingRequestDigitalLinkStructure
 * @returns {string}
 */
const reBuildOriginalRequestFromDLStructure = (incomingRequestDigitalLinkStructure) => {
  let originalRequest = '';
  for (const identifier of incomingRequestDigitalLinkStructure.identifiers) {
    originalRequest += `/${Object.keys(identifier)[0]}/${identifier[Object.keys(identifier)[0]]}`;
  }
  for (const qualifier of incomingRequestDigitalLinkStructure.qualifiers) {
    originalRequest += `/${Object.keys(qualifier)[0]}/${qualifier[Object.keys(qualifier)[0]]}`;
  }
  return originalRequest;
};

/**
 * If the incoming string text passes a Char Regex test defined in headerCharRegex then return a base64-encoded
 * version. This is to allow passage of the text data through HTTP 1.x which only allows ASCII characters,
 * @param text
 * @returns {string|*}
 */
const base64EncodeIfNeeded = (text) => {
  const headerCharRegex = /[^\t\x20-\x7e\x80-\xff]/;
  if (headerCharRegex.test(text)) {
    return base64_encoding_and_decoding.encodeStringToBase64(text);
  }
  return text;
};

/**
 * getLinkHeaderText builds the relational links for this product variant which will be later output as an HTTP header
 * by the resolver.
 * @param qualifierPathDoc
 * @param incomingRequestDigitalLinkStructure
 * @returns {string}
 */
const getLinkHeaderText = (qualifierPathDoc, incomingRequestDigitalLinkStructure) => {
  let linkText = '';
  let title = '';
  try {
    qualifierPathDoc.responses.forEach((response) => {
      title = base64EncodeIfNeeded(response.title);
      linkText += `<${response.link}>; rel="${response.linkType}"; type="${response.mimeType}"; hreflang="${response.ianaLanguage}"; title="${title}", `;
    });
    // Rebuild the original digital link request an append it as an 'owl:sameAs" property. This is because
    // the reference digital link version may be different from the original incoming request because it is
    // in a compressed format, or the requested used '/gtin/' rather than '/01/'.
    const rebuiltRequest = reBuildOriginalRequestFromDLStructure(incomingRequestDigitalLinkStructure);
    return `${linkText}<https://id.gs1.org${rebuiltRequest}>; rel="owl:sameAs"`;
  } catch (e) {
    console.log(`getLinkHeaderText error: ${e}`);
    return '';
  }
};

/**
 * Expands a DB-compressed linkType to its full URI version for gs1 and schema.org vocabularies
 * @param linkType
 * @returns {string}
 */
const expandLinkType = (linkType) => {
  // Convert linkTYpe with compressed format 'gs1*hasRetailers' to 'https://gs1.org/voc/hasRetailers'
  const linkTypeSections = linkType.split('*');
  let expandedLinkType = 'https://';

  if (linkTypeSections[0] === 'gs1') {
    expandedLinkType += 'gs1.org/voc/';
  } else {
    expandedLinkType += 'schema.org/';
  }
  return expandedLinkType + linkTypeSections[1];
};

/**
 * getLinkSetData builds the relational links for this product qualifier which will be later output as an HTTP header
 * by the resolver. This format uses the new Digital Link v1.2 (draft) standard as implemented in IETF RFC8288
 * https://tools.ietf.org/html/rfc8288
 * @param qualifierPathDoc
 * @param incomingRequestDigitalLinkStructure
 * @returns {{link: string, body: {linkSet: []}}}
 */
const getLinkSetData = (qualifierPathDoc, incomingRequestDigitalLinkStructure) => {
  const result = {
    link: '',
    body: { linkSet: [] },
  };

  const gs1KeyCode = Object.keys(incomingRequestDigitalLinkStructure.identifiers[0])[0];
  const gs1KeyValue = incomingRequestDigitalLinkStructure.identifiers[0][gs1KeyCode];
  const anchor = `${process.env.RESOLVER_FQDN}/${gs1KeyCode}/${gs1KeyValue}`;
  let linkText = ''; // <-- empty string ready to be filled by looping through responses

  const linkSetEntry = {
    anchor,
    itemDescription: qualifierPathDoc.item_name,
    linkTypes: [],
  };

  try {
    qualifierPathDoc.responses.forEach((response) => {
      const expandedLinkType = expandLinkType(response.linkType);

      // if we have not encountered this linkType yet, set it up as a new empty array.
      if (!linkSetEntry[expandedLinkType]) {
        linkSetEntry[expandedLinkType] = [];
      }

      const linkSetValues = {
        hreflang: response.ianaLanguage === 'xx' ? '' : response.ianaLanguage,
        title: base64EncodeIfNeeded(response.title),
        href: response.link,
        context: response.context === 'xx' ? '' : response.context,
        mimeType: response.mimeType === 'xx' ? '' : response.mimeType,
      };
      // This allows grouping of data by linkType whatever the actual order of responses.
      linkSetEntry[expandedLinkType].push(linkSetValues);

      // Append this response entry to linkText
      linkText += `<${response.link}>; rel="${response.linkType}"; type="${linkSetValues.mimeType}"; hreflang="${linkSetValues.hreflang}"; title="${linkSetValues.title}"; anchor="${anchor}", `;
    });

    // Rebuild the digital link request from its originally supplied structure. This has the effect of
    // returning an 'original' reference digital link, uncompressed and full length.
    const rebuiltRequest = reBuildOriginalRequestFromDLStructure(incomingRequestDigitalLinkStructure);

    // Return the linkset with the rebuilt request with the 'owl:sameAs' linktype append to the end of the Links header, and prepended
    // with the fully-qualified domain name of this resolver, in environment variable process.env.RESOLVER_FQDN
    result.link = `${linkText}<${process.env.RESOLVER_FQDN}${rebuiltRequest}>; rel="owl:sameAs"`;
    result.body.linkSet.push(linkSetEntry);
    return result;
  } catch (e) {
    console.log(`getLinkSetData error: ${e}`);
    return result;
  }
};

/**
 * response_InterstitialPage gets the interstitial web page and prepares its html to be returned to the
 * client by the 'resolve' function. 'resolve' will call this function if the incoming request
 * includes 'linktype=all' and the request header is not specifically asking for a JSON response.
 * @param httpResponse
 * @param structure
 * @param resolverDBdocument
 * @param qualifierPathDoc
 * @param jsonOrHtml
 * @param processStartTime
 * @returns {Promise<void>}
 */
const response_InterstitialPage = async (httpResponse, structure, resolverDBdocument, qualifierPathDoc, jsonOrHtml, processStartTime) => {
  let body = '';
  const additionalHttpHeaders = {
    Link: getLinkHeaderText(qualifierPathDoc, structure),
  };

  // Get the required interstitial page template by checking the identifier key
  const gs1Key = Object.keys(structure.identifiers[0])[0];
  try {
    if (jsonOrHtml === 'HTML') {
      const pageHtml = await readFilePromise(`${__dirname}/../templates/interstitial/${gs1Key}.html`, 'utf8');
      body = pageHtml.replace('{"resolver_document": "here"}', JSON.stringify(resolverDBdocument));
      additionalHttpHeaders['Content-Type'] = 'text/html';
      resolverHTTPResponse(httpResponse, additionalHttpHeaders, body, 200, processStartTime);
    } else {
      body = JSON.stringify(resolverDBdocument);
      additionalHttpHeaders['Content-Type'] = 'application/json';
      resolverHTTPResponse(httpResponse, additionalHttpHeaders, body, 200, processStartTime);
    }
  } catch (error) {
    console.log(`response_InterstitialPage: error is ${error}`);
    body = JSON.stringify(resolverDBdocument);
    additionalHttpHeaders['Content-Type'] = 'application/json';
    resolverHTTPResponse(httpResponse, additionalHttpHeaders, body, 200, processStartTime);
  }
};

/**
 * Returns a 404 Not Found page
 * @param identifierKeyType
 * @param identifierKey
 * @param httpResponse
 * @param processStartTime
 * @returns {Promise<string>}
 */
const response_NotFoundPage = async (identifierKeyType, identifierKey, httpResponse, processStartTime) => {
  let html = '';
  // Get the required interstitial page template by checking the identifier key
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

/**
 * Converts a numeric GS1 Identifier Into its label (shortcode) equivalent.
 * If the incoming value is not a number, just returns it!
 * @param aiNumeric
 * @returns {string}
 */
const convertAINumericToLabel = async (aiNumeric) => {
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
        await resolverHTTPResponse(httpResponse, { 'Content-Type': 'application/json' }, wellKnownJson, 200, processStartTime);
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
    await resolverHTTPResponse(httpResponse, { 'Content-Type': 'application/json' }, resolverDescriptionFile, 200, processStartTime);
  } catch (error) {
    console.log(`processWellKnownRequest error: ${error}`);
  }
};

/**
 * processRequest - is the core processing function which takes the incoming request and processes it
 * into output. It manages the HTTP response back to the calling client.
 * @param httpRequest
 * @param incomingRequestDigitalLinkStructure
 * @param resolverDBdocument
 * @param httpResponse
 * @param processStartTime
 */
const processRequest = (httpRequest, incomingRequestDigitalLinkStructure, resolverDBdocument, httpResponse, processStartTime) => {
  // Test if "linktype=all" was provided in the request, in which case we just
  // send the interstitial page (or just JSON if JSON was requested in the request headers)
  if (httpRequest.url.toLowerCase().includes('linktype=all')) {
    processLinkTypeAll(httpRequest, incomingRequestDigitalLinkStructure, resolverDBdocument, httpResponse, processStartTime).then();
  } else {
    processSpecificLinkType(httpRequest, incomingRequestDigitalLinkStructure, resolverDBdocument, httpResponse, processStartTime);
  }
};

/**
 * processGCPRedirect builds and sends a 307 Temporary Redirect of a GCP entry
 * @param httpRequest
 * @param gcpDoc
 * @param httpResponse
 * @param processStartTime
 */
const processGCPRedirect = (httpRequest, gcpDoc, httpResponse, processStartTime) => {
  const additionalHttpHeaders = { Location: gcpDoc.resolve_url_format + httpRequest.url };
  resolverHTTPResponse(httpResponse, additionalHttpHeaders, null, 307, processStartTime);
};

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

const calculateProcessingTime = (processStartTime) => {
  const processEndTime = new Date().getTime();
  return processEndTime - processStartTime;
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
          if (!isNaN(urlArray[3])) {
            pageNumber = urlArray[3];
          }
        }
        if (urlArray.length === 7 && urlArray[5] === 'limit' && !isNaN(urlArray[6])) {
          pageSize = urlArray[6];
        }

        const dataResult = await db.getPagedEntriesFromUnixTime(minUnixTime, pageNumber, pageSize);

        result = {
          PAGE: pageNumber,
          LIMIT: pageSize,
          DATA: dataResult,
        };
      }

      await resolverHTTPResponse(response, { 'Content-Type': 'application/json' }, JSON.stringify(result, null, 2), 200, processStartTime);
    } else {
      result = { MESSAGE: 'ERROR: Malformed unixtime syntax - use "/unixtime/<fromunixtime>/count" or "/unixtime/<fromunixtime>/page/<pagenumber>/limit/<limit>"' };

      await resolverHTTPResponse(response, { 'Content-Type': 'application/json' }, JSON.stringify(result, null, 2), 400, processStartTime);
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
  resolverHTTPResponse,
  response_NotFoundPage,
  processWellKnownRequest,
  processUnixTime,
};
