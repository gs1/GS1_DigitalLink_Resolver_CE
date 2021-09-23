/* eslint-disable guard-for-in */
const base64EncodingAndDecoding = require('./base64_encoding_and_decoding');

/**
 * LinkSets are a particular form of JSOn that conforms to the new IETF linkset standard
 * as (at the time of coding) authored at: https://datatracker.ietf.org/doc/draft-wilde-linkset/
 */

/**
 * getLinkSetJson builds the json output for HTTP header "accept: application/json"
 * querystring and linktype=all or linktype=linkset
 * If qualifierpath is just this value: '/' then remove that final '/' from the anchor URL
 * @param qualifierPathDoc
 * @param gs1KeyCode
 * @param gs1KeyValue
 * @param qualifierPath
 * @param unixtime
 * @returns {{unixtime: *, anchor: string, itemDescription: string|*}}
 */
const getLinkSetJson = (qualifierPathDoc, gs1KeyCode, gs1KeyValue, qualifierPath, unixtime) => {
  const result = {
    anchor: `${process.env.RESOLVER_FQDN ? process.env.RESOLVER_FQDN : 'https://id.gs1.org'}/${gs1KeyCode}/${gs1KeyValue}${qualifierPath === '/' ? '' : qualifierPath}`,
    itemDescription: qualifierPathDoc.itemDescription,
    unixtime,
  };

  // Author the default link type entry for this qualifier
  authorLinkSetDefaultLinkType(qualifierPathDoc.responses, result);

  try {
    // For Each response, build up the linkset array:
    const sortedResponses = sortResponses(qualifierPathDoc.responses);

    // Now loop through each sorted response
    for (const index in sortedResponses) {
      const response = sortedResponses[index];
      const prevResponse = index > 0 ? sortedResponses[index - 1] : null;

      const expandedLinkType = expandLinkType(response.linkType);

      // Create this entry's linkset values (no need to base64encode the title if it using UTF characters
      // because this will be returned in that body of the response rather than the Link: header
      // (all HTTP headers must be in ASCII for HTTP 1.x web servers)

      // Create a new entry for this expandedLinkType if it does not exist already:
      if (!result[expandedLinkType]) {
        result[expandedLinkType] = [];
      }

      if (hasLinkSetGroupingChanged(response, prevResponse)) {
        result[expandedLinkType].push({
          href: response.link,
          title: response.title,
        });
      }

      // For ease of code readability, create a variable representing this new entry endpoint
      // and feel the love for how, in javascript, new variables can be linked to existing ones
      // rather than be a wholly independent new variable.
      const entry = result[expandedLinkType][result[expandedLinkType].length - 1];

      // For context, mimeType and hreflang[], we will only include them if there arte
      // values to save. "Don't show it if you don't know it!" - quote by Nick Lansley 12/Jan/2021 :-)

      // if context is not the 'context not applicable' value, add it into the entry:
      if (response.context !== 'xx') {
        entry.context = response.context;
      }

      // if mimeType is not the 'type not applicable' value, add it into the entry:
      if (response.mimeType !== 'xx') {
        entry.type = response.mimeType;
      }

      // Add the first language if language exists which is not 'xx' (which means 'language not applicable')
      if (response.ianaLanguage !== 'xx' && response.ianaLanguage.trim() !== '') {
        // We'll only create an hreflang array if there are 1 or more hreflang[] values to save:
        if (!entry.hreflang) {
          entry.hreflang = [];
        }

        // Just check that the language is not already there before adding it to the hreflang[] array:
        if (!entry.hreflang.some((storedLang) => storedLang === response.ianaLanguage)) {
          entry.hreflang.push(response.ianaLanguage);
        }

        if (entry.hreflang.length > 1) {
          // Add subsequent languages here:
          if (!entry['title*']) {
            entry['title*'] = [];
          }
          entry['title*'].push({ value: response.title, language: response.ianaLanguage });
        }
      }
    }

    authorLinkSetDefaultLinkTypeStar(result);

    return result;
  } catch (e) {
    console.log(`getLinkSetJson error: ${e}`, e);
    return result;
  }
};

/**
 * Helper function for getLinkSetJson which multi-sorts the responses array
 * by mimeType within context within linkType. Grouped sort routine source:
 * https://bithacker.dev/javascript-object-multi-property-sort )
 * @param responseArray
 * @returns {*}
 */
const sortResponses = (responseArray) => {
  // Preprocess context and MimeType properties that may be set to empty string or are set to 'xx'
  // (which means 'not applicable') such that all instances of '' are converted to 'xx' for consistency.
  for (const i in responseArray) {
    if (responseArray[i].context.trim() === '') {
      responseArray[i].context = 'xx';
    }
    if (responseArray[i].mimeType.trim() === '') {
      responseArray[i].mimeType = 'xx';
    }
  }

  // Set up the sort priority order with direction = 1 (meaning 'ascending' whereas -1 means descending)
  const sortBy = [
    {
      prop: 'linkType',
      direction: 1,
    },
    {
      prop: 'context',
      direction: 1,
    },
    {
      prop: 'mimeType',
      direction: 1,
    },
  ];

  // Sort!
  return responseArray.sort((a, b) => {
    let i = 0;
    let result = 0;
    while (i < sortBy.length && result === 0) {
      result =
        sortBy[i].direction * (a[sortBy[i].prop].toString() < b[sortBy[i].prop].toString() ? -1 : a[sortBy[i].prop].toString() > b[sortBy[i].prop].toString() ? 1 : 0);
      i += 1;
    }
    return result;
  });
};

/**
 * Helper function for getLinkSetJson which returns true if any of
 * linktype, context, link or mimeType has changed between current and previous responses
 * (including if previousResponse is null as there is no previous response)
 * @param currentResponse
 * @param previousResponse
 * @returns {boolean}
 */
const hasLinkSetGroupingChanged = (currentResponse, previousResponse) => {
  if (previousResponse) {
    return !(
      currentResponse.linkType === previousResponse.linkType &&
      currentResponse.context === previousResponse.context &&
      currentResponse.mimeType === previousResponse.mimeType &&
      currentResponse.link === previousResponse.link
    );
  }
  return true;
};

/**
 * Expands a DB-compressed linkType to its full URI version for gs1 and schema.org vocabularies
 * @param linkType
 * @returns {string}
 */
const expandLinkType = (linkType) => {
  // Convert linkTYpe with compressed format 'gs1*hasRetailers' to 'https://gs1.org/voc/hasRetailers'
  const linkTypeSections = linkType.split(':');
  let expandedLinkType = 'https://';

  if (linkTypeSections[0] === 'gs1') {
    expandedLinkType += 'gs1.org/voc/';
  } else {
    expandedLinkType += 'schema.org/';
  }
  return expandedLinkType + linkTypeSections[1];
};

/**
 * Authors the linkset JSON for linkSet's "defaultLink" and optionally
 * defaultLinkMulti" if there is more than one default language.
 * @param responses
 * @param linkSet
 */
const authorLinkSetDefaultLinkType = (responses, linkSet) => {
  linkSet['https://gs1.org/voc/defaultLink'] = [];

  try {
    // First let's get the list of qualifying default responses.
    const defaultLinkTypeResponses = responses.filter((response) => response.defaultLinkType);

    if (defaultLinkTypeResponses.length === 0) {
      // If no default responses are set, then choose the first one (there's nothing else we can do!):
      linkSet['https://gs1.org/voc/defaultLink'][0] = {
        href: responses[0].link,
        title: responses[0].title,
      };
    } else if (defaultLinkTypeResponses.length === 1) {
      // Nice and easy: We set the value to this single entry:
      linkSet['https://gs1.org/voc/defaultLink'][0] = {
        href: defaultLinkTypeResponses[0].link,
        title: defaultLinkTypeResponses[0].title,
      };
    } else if (defaultLinkTypeResponses.every((response) => response.linkType === defaultLinkTypeResponses[0].linkType)) {
      // The above test sees if every response.linktype matches the linktype in the first entry of defaultLinkTypeResponses.
      // So if we have reached here, it means that all the responses in defaultLinkTypeResponses are the same (a good thing!)
      // and the data owner is specifying that there are different languages for this default response type.
      // So we do 3 things:

      // 1. Set the value for defaultLink (same as when defaultLinkTypeResponses.length === 1 above)
      linkSet['https://gs1.org/voc/defaultLink'][0] = {
        href: defaultLinkTypeResponses[0].link,
        title: defaultLinkTypeResponses[0].title,
      };

      // 2. We also create a new 'defaultLinkMulti' entry that is like 'defaultLink' will include languages:
      linkSet['https://gs1.org/voc/defaultLinkMulti'] = [];

      // 3. We create a temporary property storing the linktype - later, in getLinkSetJson(),
      //   linkSet['https://gs1.org/voc/defaultLinkMulti'] will be populated with the entirety of the array of that
      //   default linktype which has not be created yet. Finally, this temporary property will be deleted.
      linkSet._temp_default_linkType = expandLinkType(defaultLinkTypeResponses[0].linkType);
    } else {
      // In this case, it means that more than one linktype has been set as the default. What we'll do here is
      // find the linktype used in the most responses, and use that one.
      // To do this:
      // 1: Create a new array which we will fill with the linktypes and the count of each one found:
      const linkTypeCountArray = [];
      responses.forEach((response) => {
        if (response.defaultLinkType) {
          if (linkTypeCountArray.length === 0) {
            linkTypeCountArray.push({ linkType: response.linkType, count: 1 });
          } else {
            for (const index in linkTypeCountArray) {
              if (linkTypeCountArray[index].linkType === response.linkType) {
                linkTypeCountArray[index].count += 1;
              }
            }
          }
        }
      });

      // 2: Sort the array in descending order of count:
      linkTypeCountArray.sort((a, b) => (a.count < b.count ? 1 : -1));

      // Grab the first entry (which has the highest (or joint highest) count and use that as our 'winning' linkType
      // by using it to filter responses to just that linkType:
      const winningResponses = responses.filter((response) => response.linkType === linkTypeCountArray[0].linkType);

      // Finally we will call this self same function recursively with this revised set of responses, which will
      // actually run the code in the:
      // "else if (defaultLinkTypeResponses.every(response => response.linkType === defaultLinkTypeResponses[0].linkType)) {...}"
      // ..section of this function:
      authorLinkSetDefaultLinkType(winningResponses, linkSet);
    }
  } catch (e) {
    console.log(e);
  }
};

/**
 * Author the 'https://gs1.org/voc/defaultLinkMulti' entry, a function executed once the linkSet has
 * been fully authored. 'defaultLinkMulti' will have an array matching the array of the default linktype which is
 * now already authored in the linkSet. However, 'context' is not allowed and, if present, is specifically
 * removed from all elements of the 'defaultLinkMulti' array where present.
 * @param linkSet
 */
const authorLinkSetDefaultLinkTypeStar = (linkSet) => {
  if (linkSet._temp_default_linkType) {
    linkSet['https://gs1.org/voc/defaultLinkMulti'] = linkSet[linkSet._temp_default_linkType];
    for (const i in linkSet['https://gs1.org/voc/defaultLinkMulti']) {
      if (linkSet['https://gs1.org/voc/defaultLinkMulti'][i].context) {
        delete linkSet['https://gs1.org/voc/defaultLinkMulti'][i].context;
      }
    }

    // Remove that temporary variable
    delete linkSet._temp_default_linkType;
  }
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
    return base64EncodingAndDecoding.encodeStringToBase64(text);
  }
  return text;
};

module.exports = { getLinkSetJson, getLinkHeaderText };
