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
// eslint-disable-next-line consistent-return
function matchPathVariables(doc, qualifiers) {
  try {
    let allVariablesMatchFlag = false;
    for (const qualifierPath of Object.keys(doc)) {
      if (doc[qualifierPath].variables && Array.isArray(doc[qualifierPath].variables) && doc[qualifierPath].variables.length === qualifiers.length) {
        let variableMatchCount = 0;
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < qualifiers.length; index++) {
          for (const variable of doc[qualifierPath].variables) {
            // A keyMatch is True if the current variable key matches the current qualifier key:
            const keyMatch = Object.keys(variable)[0] === Object.keys(qualifiers[index])[0];
            // A valueMatch is True if the current variable value is a {variable} OR the current variable value matches the current fixed qualifier value:
            const valueMatch = Object.values(variable)[0].includes('{') || Object.values(variable)[0] === Object.values(qualifiers[index])[0];

            if (keyMatch && valueMatch) {
              const q = qualifiers[index];
              const [_objVariable] = Object.values(variable);
              q.variable = _objVariable;
              // q.variable = Object.values(variable)[0];
              qualifiers[index] = q;
              variableMatchCount += 1;
              // If the ALL variable names have matched and we have the same number of matches
              // as there are found in doc[qualifierPath].variables then we have a full match.
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
          // eslint-disable-next-line no-plusplus
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
 * It also can flag that this is inexact, allowing Resolver to issue an HTTP 303 'See Other' redirect.
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
 * @returns {{redirect: string, exact: boolean, doc: {}}|{}}
 */
// eslint-disable-next-line consistent-return
const getQualifierPathDoc = (doc, qualifiers) => {
  let dlQualifiersPath = '';
  const responseDoc = {
    doc: {},
    exact: true,
    redirect: '',
  };

  // If we can get a matched path with all the variables assigned then we have the correct QualifierPathDoc
  // and can return it from this function immediately.
  const matchedResponse = matchPathVariables(doc, qualifiers);
  if (matchedResponse) {
    responseDoc.doc = matchedResponse;
    return responseDoc;
  }

  // Let's look at the non-template responses and see if we can get a match using the 'walking up the tree' process:
  const qualifiersOriginalLength = qualifiers.length;
  while (qualifiers.length > 0) {
    // Build the qualifier path from the array of name/value pair objects in qualifiers
    dlQualifiersPath = '';
    for (const thisQualifier of qualifiers) {
      dlQualifiersPath += `/${Object.keys(thisQualifier)[0]}/${thisQualifier[Object.keys(thisQualifier)[0]]}`;
    }
    // test this new qualifier path to see if we get a match in the doc:
    if (doc[dlQualifiersPath]) {
      // We have found a matching variant in the document so we'll stop here, but flag up that this was
      // not an exact match unless we are still in the first run of the loop and have all the requested qualifiers:
      responseDoc.doc = doc[dlQualifiersPath];
      responseDoc.exact = qualifiersOriginalLength === qualifiers.length;
      responseDoc.redirect = `${doc._id}${dlQualifiersPath}`;
      return responseDoc;
    }
    // Take off the last qualifier and loop around again
    qualifiers.pop();
  }

  // By the time we reach here, we have no qualifiers! We will just return the 'root qualifier' "/"
  if (!doc[dlQualifiersPath]) {
    // We have no matching qualifiers, or there are no qualifiers to match with, so
    // see if we can match the 'root qualifier' signified by the '/' symbol.
    const _rootLevelDoc = doc['/'];
    if (!_rootLevelDoc) {
      // SIGNAL that there is nothing that matches so later we will show the 200.html page (later)
      // by returning an empty object that will be detected by the calling function.
      return {};
    }
    responseDoc.doc = _rootLevelDoc;
    responseDoc.exact = qualifiersOriginalLength === qualifiers.length;
    responseDoc.redirect = doc._id;
    return responseDoc;
  }

  // We've failed if we're reached here.
  responseDoc.doc = null;
  responseDoc.exact = false;
  responseDoc.redirect = '';
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
  // First, to get a linktype match, make sure that the incoming linktype has a gs1 or schema.org prefix. If it has no
  // prefix, add the "gs1": prefix:
  if (!requestedAttributes.linkType.includes('gs1:') && !requestedAttributes.linkType.includes('sch:')) {
    requestedAttributes.linkType = `gs1:${requestedAttributes.linkType}`;
  }

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

  let suitableResponse = {};

  // Now we are going to loop through all the language/contexts requested (e,g, {ianaLanguage: 'en', context: 'GB')
  // to see if we can get a match. Web clients normally supply language/contexts in descending order of preference
  // so the earlier we get a match in this for() loop the better:
  for (const languageContext of requestedAttributes.languageContexts) {
    // We will loop through all the mimeTypes requested to see if we can get a match.
    // Web clients normally supply mimeTypes in descending order of preference.
    for (const mimeType of requestedAttributes.mimeTypes) {
      suitableResponse = qualifierPathDoc.responses.find((response) => {
        // eslint-disable-next-line object-curly-newline
        const { linkType: resLinkType, ianaLanguage: resIanaLanguage, context: resContext, mimeType: resMimetype } = response;
        // eslint-disable-next-line object-curly-newline
        const { linkType: reqLinkType } = requestedAttributes;
        const { ianaLanguage: langIanaLanguage, context: langContext } = languageContext;
        return (
            // eslint-disable-next-line operator-linebreak
            resLinkType.toLowerCase() === reqLinkType.toLowerCase() &&
            // eslint-disable-next-line operator-linebreak
            resIanaLanguage.toLowerCase() === langIanaLanguage.toLowerCase() &&
            // eslint-disable-next-line operator-linebreak
            resContext.toLowerCase() === langContext.toLowerCase() &&
            resMimetype.toLowerCase() === mimeType.toLowerCase()
        );
      });

      if (suitableResponse) {
        return suitableResponse;
      }
    }

    // OK so no Full match was found, and we tried all the different requested mimeTypes.
    // Let's see if we can find a match with linkType, ianaLanguage and context with a defaultMimeType flag set:
    suitableResponse = qualifierPathDoc.responses.find((response) => {
      // eslint-disable-next-line object-curly-newline
      const { linkType: resLinkType, ianaLanguage: resIanaLanguage, context: resContext, defaultMimeType: resDefaultMimeType } = response;
      // eslint-disable-next-line object-curly-newline
      const { linkType: reqLinkType } = requestedAttributes;
      const { ianaLanguage: langIanaLanguage, context: langContext } = languageContext;
      return (
          // eslint-disable-next-line operator-linebreak
          resLinkType.toLowerCase() === reqLinkType.toLowerCase() &&
          // eslint-disable-next-line operator-linebreak
          resIanaLanguage.toLowerCase() === langIanaLanguage.toLowerCase() &&
          // eslint-disable-next-line operator-linebreak
          resContext.toLowerCase() === langContext.toLowerCase() &&
          resDefaultMimeType
      );
    });

    if (suitableResponse) {
      return suitableResponse;
    }

    // Still no match was found. Let's see if we can find a match with linkType, ianaLanguage and default context:
    suitableResponse = qualifierPathDoc.responses.find((response) => {
      const { linkType: resLinkType, ianaLanguage: resIanaLanguage, defaultContext: resDefaultContext } = response;
      const { linkType: reqLinkType } = requestedAttributes;
      const { ianaLanguage: langIanaLanguage } = languageContext;
      return resLinkType.toLowerCase() === reqLinkType.toLowerCase() && resIanaLanguage.toLowerCase() === langIanaLanguage.toLowerCase() && resDefaultContext;
    });

    if (suitableResponse) {
      return suitableResponse;
    }
  }

  // Still no match was found, and that was with trying to match with all the supplied language/contexts.
  // Let's see if we can find a match with just linkType and default ianaLanguage:
  suitableResponse = qualifierPathDoc.responses.find(
      (response) => response.linkType.toLowerCase() === requestedAttributes.linkType.toLowerCase() && response.defaultIanaLanguage,
  );

  if (suitableResponse) {
    return suitableResponse;
  }

  // Still no match was found. Let's see if we can find a match with linkType only:
  suitableResponse = qualifierPathDoc.responses.find((response) => response.linkType.toLowerCase() === requestedAttributes.linkType.toLowerCase());

  if (suitableResponse) {
    return suitableResponse;
  }

  // Still no match was found. Let's see if we can find a match with the default linkType:
  suitableResponse = qualifierPathDoc.responses.find((response) => response.defaultLinkType);

  if (suitableResponse) {
    return suitableResponse;
  }

  // We're out of options - let's just return the first entry
  if (qualifierPathDoc.responses.length > 0) {
    return qualifierPathDoc.responses[0];
  }

  // We shouldn't ever be here but this can happen with data issues, so we'll just stop here
  // and 'undefined' will be returned to the calling function, which will return a 404 NOT FOUND
  console.log('NO MATCH');
  return false;
};

module.exports = {
  getQualifierPathDoc,
  findSuitableResponse,
};
