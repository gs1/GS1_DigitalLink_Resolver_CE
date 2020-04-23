const GS1DigitalLinkToolkit = require("./GS1DigitalLinkToolkit");
const Base64_encoding_and_decoding = require("./Base64_encoding_and_decoding");
const resolverJSON_V2 = require("./resolverJSON_V2");
const resolverutils = require("./resolver_utils");
const HttpStatus = require('http-status-codes');
const fetch = require('node-fetch');
const fs = require('fs');
const util = require('util');
const readFilePromise = util.promisify(fs.readFile);

const headerCharRegex = /[^\t\x20-\x7e\x80-\xff]/;

/**
 * getDigitalLinkStructure calls into the GS1 DigitalInk Toolkit library and
 * returns the object structure (if any) or an error. This is an async (Promise)
 * function so as not to block calls during complex processing.

 * @param uri
 * @returns {Promise<{}|*>}
 */
const getDigitalLinkStructure = (uri) =>
{
    let gs1dlt = new GS1DigitalLinkToolkit();
    try
    {
        const structuredObject = gs1dlt.analyseURI(uri, true).structuredOutput;
        structuredObject.result = "OK";
        return structuredObject;
    }
    catch (err)
    {
        let errorObject = {};
        errorObject.result = "ERROR";
        errorObject.error = err.toString();
        resolverutils.logThis(`getDigitalLinkStructure error:" ${errorObject.error}`);
        return errorObject;
    }
};


/**
 * Processes specific linktypes (that are not 'all') or when no linktype is supplied and the default must be found
 * @param httpRequest
 * @param incomingRequestDigitalLinkStructure
 * @param resolverDBdocument
 * @param httpResponse
 * @param processStartTime
 */
const processSpecificLinkType = (httpRequest, incomingRequestDigitalLinkStructure, resolverDBdocument, httpResponse, processStartTime) =>
{
    const gs1KeyCode = Object.keys(incomingRequestDigitalLinkStructure.identifiers[0])[0];
    const gs1KeyValue = incomingRequestDigitalLinkStructure.identifiers[0][gs1KeyCode];

    // STEP 1: FIND MATCHING QUALIFIERS (since there can be more than one in the same document as the resolverDBdocument presents the
    //         entire knowledge base for the this product, useful in certain scenarios.
    const docVariant = getVariantDocument(resolverDBdocument,  incomingRequestDigitalLinkStructure.qualifiers);
    //STEP 2: Navigate through the supplied document using the supplied - or default - attributes of
    //        linkType, then language (lang), then context, then finally mime_type (document type, eg 'text/html').
    //        This will result in an object with four values - link, fwqs, linktype_uri and title.
    if (!docVariant)
    {
        resolverHTTPResponse(httpResponse, {'Content-Type': 'application/json'}, '{"Error": "No document found"}', 404, processStartTime);
    }
    else
    {
        try
        {
            const langDoc = getAttributeDoc(incomingRequestDigitalLinkStructure, docVariant.responses, "linktype", httpRequest);
            if (langDoc !== undefined)
            {
                const contextDoc = getAttributeDoc(incomingRequestDigitalLinkStructure, langDoc, "lang", httpRequest);
                if (contextDoc !== undefined)
                {
                    const mimeTypeDoc = getAttributeDoc(incomingRequestDigitalLinkStructure, contextDoc, "context", httpRequest);
                    if (mimeTypeDoc !== undefined)
                    {
                        const resolverObj = getAttributeDoc(incomingRequestDigitalLinkStructure, mimeTypeDoc, "mime_type", httpRequest);

                        //STEP 3: Build the Link Header, which contains all the linktypes, languages, contexts and mime_types in docVariant.
                        //and build it into the addition HTTP headers to be sent back to the client:
                        const additionalHttpHeaders = {
                            'Link': getLinkHeaderText(docVariant, incomingRequestDigitalLinkStructure),
                            'Location': formatRedirectLink(httpRequest.url, resolverObj.link, resolverObj.fwqs)
                        };

                        resolverHTTPResponse(httpResponse, additionalHttpHeaders, null, 307, processStartTime);
                    }
                    else
                    {
                        response_NotFoundPage(gs1KeyCode, gs1KeyValue, httpResponse, processStartTime).then();
                    }
                }
                else
                {
                    response_NotFoundPage(gs1KeyCode, gs1KeyValue, httpResponse, processStartTime).then();
                }
            }
            else
            {
                response_NotFoundPage(gs1KeyCode, gs1KeyValue, httpResponse, processStartTime).then();
            }

        }
        catch (error)
        {
            //Catches the no document found for further processing
            resolverutils.logThis(`processSpecificLinkType error: ${error}`);
            response_NotFoundPage(gs1KeyCode, gs1KeyValue, httpResponse, processStartTime);
        }
    }
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
const processLinkTypeAll = async (httpRequest, incomingRequestDigitalLinkStructure, resolverDBdocument, httpResponse, processStartTime) =>
{
    const requestContentType = httpRequest.headers['accept'];
    let jsonOrHtml = "HTML";
    if (requestContentType !== undefined && requestContentType.includes("json"))
    {
        jsonOrHtml = "JSON";
    }

    if (resolverDBdocument)
    {
        const docVariant = getVariantDocument(resolverDBdocument,  incomingRequestDigitalLinkStructure.qualifiers);

        if(httpRequest.url.toLowerCase().includes("json=v2"))
        {
            resolverDBdocument = resolverJSON_V2.convertResolverDocV1ToV2(resolverDBdocument);
        }

        //From the DB, colons in linktype names are converted from * to escaped colons for responding to the client with JSON (or HTML woth JSOn embedded)
        resolverDBdocument = JSON.parse(JSON.stringify(resolverDBdocument).replace(/"gs1\*/g, '"gs1\:'));
        //Send the interstitial page back
        await response_InterstitialPage(httpResponse, incomingRequestDigitalLinkStructure, resolverDBdocument, docVariant, jsonOrHtml, processStartTime);
    }
    else
    {
        await response_NotFoundPage(incomingRequestDigitalLinkStructure, resolverDBdocument, httpResponse, processStartTime);
    }
};




/**
 * getAttributeDoc returns the 'next' part of the attribute hierarchy contained in the database document. This 'next'
 * os depending on the supplied attribute name.
 * Attributes are stored hierarchically in the database document in order of:
 * linktype, language ('lang'), context and mimetype ('mime_type').
 * So, a request with attributeName of:
 *  value 'linktype' will return the 'lang' children,
 *  value 'lang' will return the 'context' children,
 *  value 'context' will return the 'mime_type' children.

 * If the incoming qualifiers don't provide all or any of the four attributes of
 * linktype, language (lang), context and mime_type, the document includes default values which this function
 * can use in absence of any supplied values.
 * @param structure
 * @param variantDoc
 * @param attributeName
 * @param httpRequest
 * @returns {*}
 */
const getAttributeDoc = (structure, variantDoc, attributeName, httpRequest) =>
{
    if (!variantDoc)
    {
        return undefined; //there's nothing we can do when nothing arrives!
    }

    let attributeValue = null;

    //Two of the attributes can be found in the HTTP Headers:

    //The attribute (linktype, lang, context) is going to be in the 'OTHERS' array of the structure object
    // if it has been requested, otherwise we find the default.
    for (const thisOther of structure.other)
    {
        const requestedAttributeName = Object.keys(thisOther)[0];
        if (requestedAttributeName.toLowerCase() === attributeName)
        {
            if (attributeName === "linktype")
            {
                attributeValue = convertCURIEStandardToLinkTypeInDB(thisOther[requestedAttributeName]);
            }
            else
            {
                attributeValue = thisOther[requestedAttributeName]
            }
            break;
        }
    }

    //If we haven't found the attribute value from the request URL, but maybe it is in the
    //HTTP Headers of the incoming request? Let's find out:
    if (!attributeValue)
    {
        attributeValue = getAttributeFromHTTPHeaders(attributeName, httpRequest);
    }

    if (!attributeValue || !variantDoc[attributeName][attributeValue])
    {
        //We did our best but couldn't find any requested attribute value, so we will use
        //the defaults always available in the variantDoc.
        if (attributeName === "linktype")
        {
            attributeValue = convertCURIEStandardToLinkTypeInDB(variantDoc["default_" + attributeName]);
        }
        else
        {
            attributeValue = variantDoc["default_" + attributeName];
        }
    }
    return variantDoc[attributeName][attributeValue];
};


/**
 * getVariantDocument Locates and returns the required subset of the document returned earlier by the resolver's
 * document database.
 * @param doc
 * @param qualifiers
 * @returns {null|*}
 */
const getVariantDocument = (doc, qualifiers) =>
{
    let dlQualifiersVariant = '';
    let qualifierKey = '';
    let variantDoc = null;


    //This loop will start with the maximum number of qualifiers then, if there's no match, try again with
    //the 'last' qualifier removed, and then 2 removed, and so on until either we have a match or we run of out
    //of qualifiers.
    for (let qualifiersCountToConcatenate = qualifiers.length; qualifiersCountToConcatenate > 0; qualifiersCountToConcatenate--)
    {
        dlQualifiersVariant = '';
        //this loops builds a specific qualifier list
        for (let thisQualifier = 0; thisQualifier < qualifiersCountToConcatenate; thisQualifier++)
        {
            qualifierKey = Object.keys(qualifiers[thisQualifier])[0];
            dlQualifiersVariant += "/" + qualifierKey + "/" + qualifiers[thisQualifier][qualifierKey];
        }

        //test this new qualifier list to see if we get a match
        variantDoc = doc[dlQualifiersVariant];
        if (variantDoc)
        {
            return variantDoc; //We have found a matching variant in the document so we'll stop here.
        }
    }

    if (!variantDoc)
    {
        //We have no matching qualifiers, or there are no qualifiers to match with, so
        //see if we can match the 'root variant' signified by the '/' symbol.
        variantDoc = doc['/'];

        if (!variantDoc)
        {
            //SIGNAL that there is nothing that matches so later we will show the interstitial page (later)
            //by returning an empty object that will be detected by the calling function.
            variantDoc = {}
        }
    }

    return variantDoc;
};




const getAttributeFromHTTPHeaders = (attributeName, httpRequest) =>
{
    if (attributeName === "lang" && httpRequest.headers['accept-language'])
    {
        //example header value: 'accept-language': 'en-GB,en;q=0.9,fr-FR;q=0.8'
        //we want to extract the first two characters from this string.
        return httpRequest.headers['accept-language'].substring(0,2);
    }
    else if (attributeName === "mime_type" && httpRequest.headers['accept'])
    {
        //example header: accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        //we want to extract the string before the first comma so we'll split by comma and return the first array element
        const acceptArray = httpRequest.headers['accept'].split(',');
        return acceptArray[0];
    }
    return null;
};

/**
 * Rebuilds the original request using just the output from DigitalLinkToolkit which
 * will be used by calling functions to see if the incoming request is different (that is, compressed):
 * @param incomingRequestDigitalLinkStructure
 * @returns {string}
 */
const reBuildOriginalRequestFromDLStructure = (incomingRequestDigitalLinkStructure) =>
{
    let originalRequest = "";
    for (let identifier of incomingRequestDigitalLinkStructure.identifiers)
    {
        originalRequest += "/" + Object.keys(identifier)[0] + "/" + identifier[Object.keys(identifier)[0]];
    }
    for (let qualifier of incomingRequestDigitalLinkStructure.qualifiers)
    {
        originalRequest += "/" + Object.keys(qualifier)[0] + "/" + qualifier[Object.keys(qualifier)[0]];
    }
    return originalRequest;
};


/**
 * getLinkHeaderText builds the relational links for this product variant which will be later output as an HTTP header
 * by the resolver.
 * @param docVariant
 * @param incomingRequestDigitalLinkStructure
 * @returns {string}
 */
const getLinkHeaderText = (docVariant, incomingRequestDigitalLinkStructure) =>
{
    let linkText = "";
    try
    {
        for (const linkType of Object.keys(docVariant.responses.linktype))
        {
            for (const language of Object.keys(docVariant.responses.linktype[linkType].lang))
            {
                for (const context of Object.keys(docVariant.responses.linktype[linkType].lang[language].context))
                {
                    for (const mimeType of Object.keys(docVariant.responses.linktype[linkType].lang[language].context[context].mime_type))
                    {
                        let { link, title } = docVariant.responses.linktype[linkType].lang[language].context[context].mime_type[mimeType];

                        //test if the title passes the regex test. If so, bae64 it!
                        if (headerCharRegex.test(title))
                        {
                            title = Base64_encoding_and_decoding.encodeStringToBase64(title);
                        }
                        linkText += `<${link}>; rel="${linkType.replace("*", ":")}"; type="${mimeType}"; hreflang="${language}"; title="${title}", `
                    }
                }
            }
        }

        //Remove the last two characters (the ', ') from the linkText text then return it.
        const rebuiltRequest = reBuildOriginalRequestFromDLStructure(incomingRequestDigitalLinkStructure);
        return linkText + `<https://id.gs1.org${rebuiltRequest}>; rel="owl:sameAs"`;
    }
    catch(e)
    {
        resolverutils.logThis(`getLinkHeaderText error: ${e}`);
        return "";
    }
};


/**
 * response_InterstitialPage gets the interstitial web page and prepares its html to be returned to the
 * client by the 'resolve' function. 'resolve' will call this function if the incoming request
 * includes 'linktype=all' and the request header is not specifically asking for a JSON response.
 * @param httpResponse
 * @param structure
 * @param resolverDBdocument
 * @param docVariant
 * @param jsonOrHtml
 * @param processStartTime
 * @returns {Promise<void>}
 */
const response_InterstitialPage = async (httpResponse, structure, resolverDBdocument, docVariant, jsonOrHtml, processStartTime) =>
{
    let body = "";
    const additionalHttpHeaders = {
        'Link': getLinkHeaderText(docVariant, structure),
    };

    //Get the required interstitial page template by checking the identifier key
    const gs1Key = Object.keys(structure.identifiers[0])[0];
    try
    {
        if (jsonOrHtml === "HTML")
        {
            let pageHtml = await readFilePromise(`${__dirname}/../templates/interstitial/${gs1Key}.html`,'utf8');
            body = pageHtml.replace('{"resolver_document": "here"}', JSON.stringify(resolverDBdocument));
            additionalHttpHeaders['Content-Type'] = 'text/html';
            resolverHTTPResponse(httpResponse, additionalHttpHeaders, body, 200, processStartTime);
        }
        else
        {
            body =  JSON.stringify(resolverDBdocument);
            additionalHttpHeaders['Content-Type'] = 'application/json';
            resolverHTTPResponse(httpResponse, additionalHttpHeaders, body, 200, processStartTime);
        }
    }
    catch (error)
    {
        resolverutils.logThis(`response_InterstitialPage: error is ${error}`);
        body =  JSON.stringify(resolverDBdocument);
        additionalHttpHeaders['Content-Type'] = 'application/json';
        resolverHTTPResponse(httpResponse, additionalHttpHeaders, body, 200, processStartTime);
    }
};


/**
 * Returns a 404 Not Found page
 * @param gs1KeyCode
 * @param gs1KeyValue
 * @param httpResponse
 * @param processStartTime
 * @returns {Promise<string>}
 */
const response_NotFoundPage = async (gs1KeyCode, gs1KeyValue, httpResponse, processStartTime) =>
{
    let html = "";
    //Get the required interstitial page template by checking the identifier key
    try
    {
        let pageHtml = await readFilePromise(`${__dirname}/../templates/responses/404.html`,'utf8' );

        //Look for a specific string literal in the html with this template literals for gs1 key code and value,
        // and replace them with an appropriate message.
        html = pageHtml.replace('{"gs1KeyCode"}', gs1KeyCode);
        html = html.replace('{"gs1KeyValue"}', gs1KeyValue);
    }
    catch (e)
    {
        html = `<h2>Item /${gs1KeyCode}/${gs1KeyValue}not found </h2>`;
        resolverutils.logThis(`response_NotFoundPage error: ${e}`);
    }
    resolverHTTPResponse(httpResponse, { 'Content-Type': 'text/html' }, html, 404, httpResponse, processStartTime);
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
const formatRedirectLink = (requestUrl, destinationLink, fwqsFlag) =>
{
    //If no request forwardstrings are allowed to be forwarded then just return it.
    if (fwqsFlag === 0)
    {
        return destinationLink;
    }

    //The request url gets split into two by the "?" and we use the second half, the text in in array element 1,
    //to append to the destination link:
    const requestQueryStrings = requestUrl.split("?")[1];

    if (requestQueryStrings === undefined)
    {
        //No querystrings were in the request so just return it.
        return destinationLink;
    }
    else if (destinationLink.includes("?"))
    {
        //The '?' delimiter is already there, so we'll use a & to append the request query strings
        return destinationLink + "&" + requestQueryStrings;
    }
    else
    {
        //The '?' delimiter is NOT there, so we can use a ? to append the request query strings
        return destinationLink + "?" + requestQueryStrings;
    }
};



/**
 * Returns the well-known json response to a '/.well-known/gs1resolver' request
 * @param httpResponse
 * @param processStartTime
 * @returns {Promise<void>}
 */
const processWellKnownRequest = async (httpResponse, processStartTime) =>
{
    console.log("Building .well-known/gs1resolver");
    const readFileAsync = util.promisify(fs.readFile);
    let wellKnownJson = '';
    try
    {
        //Get the wellknown main file, which we will be adding the linktypes to:
        wellKnownJson = await readFileAsync('./src/wellknown.json', {encoding: 'utf8'});
        try
        {
            //Go and get the up to date linktypes list
            let fetchResponse = await fetch('https://www.gs1.org/voc/?show=linktypes', {
                method: 'get',
                headers: { 'Accept': 'application/json' },
            });

            if (fetchResponse.status === 200)
            {
                //Get the linktypes list as JSON from the response
                const linkTypes = await fetchResponse.json();
                //Convert the JSON in wellKnownJSON to an object
                let wellKnown = JSON.parse(wellKnownJson);

                //Add GTIN to each linktype property as applying to that particular GS! key Code
                for (let linkTypeKey of Object.keys(linkTypes))
                {
                    linkTypes[linkTypeKey].gs1key = "gtin";
                }

                //Add the linktypes list to the wellknown document
                wellKnown.activeLinkTypes = {}
                wellKnown.activeLinkTypes["en-GB"] = linkTypes;
                wellKnown.activeLinkTypes["en-US"] = linkTypes;

                //Convert the wellknown doc back to JSON
                wellKnownJson = JSON.stringify(wellKnown, null, 2);
                //Send the results back to the calling user
                await resolverHTTPResponse(httpResponse, {'Content-Type': 'application/json' }, wellKnownJson, 200, processStartTime);
            }
            else
            {
                httpResponse.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
                console.log("processWellKnownRequest get linktypes error: received status ", fetchResponse.status);
            }
        }
        catch(err)
        {
            console.log("processWellKnownRequest get linktypes error: ", err);
            httpResponse.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    catch (error)
    {
        resolverutils.logThis(`processWellKnownRequest error: ${error}`);
    }
};



const processResolverDescriptionFile = async (httpResponse, processStartTime) =>
{
    const readFileAsync = util.promisify(fs.readFile);
    let resolverDescriptionFile = '';
    try
    {
        resolverDescriptionFile = await readFileAsync('/resolver/src/resolverDescriptionFile.schema.json', {encoding: 'utf8'});
        await resolverHTTPResponse(httpResponse, {'Content-Type': 'application/json' }, resolverDescriptionFile, 200, processStartTime);
    }
    catch (error)
    {
        resolverutils.logThis(`processWellKnownRequest error: ${error}`);
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
const processRequest = (httpRequest, incomingRequestDigitalLinkStructure, resolverDBdocument, httpResponse, processStartTime) =>
{
    //Test if "linktype=all" was provided in the request, in which case we just
    //send the interstitial page (or just JSON if JSON was requested in the request headers)
    if (httpRequest.url.toLowerCase().includes("linktype=all"))
    {
        processLinkTypeAll(httpRequest, incomingRequestDigitalLinkStructure, resolverDBdocument, httpResponse, processStartTime);
    }
    else
    {
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
const processGCPRedirect = (httpRequest, gcpDoc, httpResponse, processStartTime) =>
{
    const additionalHttpHeaders = {'Location': gcpDoc.resolve_url_format + httpRequest.url };
    resolverHTTPResponse(httpResponse, additionalHttpHeaders, null, 307, processStartTime);
};


/**
 * Converts a colon of a CURIE (compressed) linktype to a '*' as document databases can't store
 * names (in name/value pairs) with colons in them.
 * @param linkType
 * @returns {string|void|*}
 */
const convertCURIEStandardToLinkTypeInDB = (linkType) =>
{
    if (linkType ==='all')
    {
        return 'all';
    }
    else if(linkType.includes("*"))
    {
        //We have an already converted to DB format! Just return it
        return linkType;
    }
    else if(linkType.includes("https://gs1.org/voc/"))
    {
        //We have a full GS1 URI-based linktype which we need to shorten:
        return 'gs1*' + linkType.replace('https://gs1.org/voc/', '');
    }
    else if(linkType.includes("https://schema.org/"))
    {
        //We have a full Schema URI-based linktype which we need to shorten:
        return 'schema*' + linkType.replace('https://schema.org/', '');
    }
    else if(!linkType.includes(':'))
    {
        //If the linkType does not have a CURIE (no 'gs1:' or 'schema:' prefix) then
        //Add a 'gs1*' prefix and return
        return 'gs1*' + linkType;
    }
    else
    {
        //Otherwise just convert the colon to the asterisk
        return linkType.replace(':', '*');
    }
};

/**
 * Delivers the final response to the calling web client, and ends the HTTP connection
 * @param httpResponse
 * @param additionalHttpHeaders
 * @param body
 * @param httpResponseCode
 * @param processStartTime
 */
const resolverHTTPResponse = (httpResponse, additionalHttpHeaders, body, httpResponseCode, processStartTime) =>
{
    const fixedHttpHeaders =  {
        'Vary': 'Accept-Encoding',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'HEAD, GET, OPTIONS',
        'Access-Control-Expose-Headers': 'Link, Content-Length',
        'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate',
        'X-Resolver-ProcessTimeMS' : calculateProcessingTime(processStartTime)
    };

    //Join the two sets of headers to produce one output set
    const outputHttpHeaders = {...fixedHttpHeaders, ...additionalHttpHeaders};

    httpResponse.writeHead(httpResponseCode, outputHttpHeaders);
    httpResponse.end(body)
};


const calculateProcessingTime = (processStartTime) =>
{
    const processEndTime = new Date().getTime();
    return processEndTime - processStartTime;
};


module.exports =
    {
        getDigitalLinkStructure,
        processResolverDescriptionFile,
        processRequest,
        processGCPRedirect,
        resolverHTTPResponse,
        response_NotFoundPage,
        processWellKnownRequest
    };