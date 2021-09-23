/* eslint-disable new-cap */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
// This script file is to hold any common utility functions used across two or more of the other scripts
const { response } = require('express');
const fetch = require('node-fetch');

const aiArray = [
  {
    title: 'Serial Shipping Container Code (SSCC) ',
    label: 'SSCC',
    shortcode: 'sscc',
    ai: '00',
  },
  {
    title: 'Global Trade Item Number (GTIN)',
    label: 'GTIN',
    shortcode: 'gtin',
    ai: '01',
  },
  {
    title: 'Global Document Type Identifier (GDTI)',
    label: 'GDTI',
    shortcode: 'gdti',
    ai: '253',
  },
  {
    title: 'Global Coupon Number (GCN)',
    label: 'GCN',
    shortcode: 'gcn',
    ai: '255',
  },
  {
    title: 'Global Identification Number for Consignment (GINC)',
    label: 'GINC',
    shortcode: 'ginc',
    ai: '401',
  },
  {
    title: 'Global Shipment Identification Number (GSIN)',
    label: 'GSIN',
    shortcode: 'gsin',
    ai: '402',
  },
  {
    title: 'Identification of a physical location - Global Location Number',
    label: 'LOC No',
    shortcode: 'gln',
    ai: '414',
  },
  {
    title: 'Party Global Location Number (PGLN)',
    label: 'PARTY',
    shortcode: 'pgln',
    ai: '417',
  },
  {
    title: 'Global Location Number Extension (GLNX)',
    label: 'LOC No extension',
    shortcode: 'glnx',
    ai: '254',
  },
  {
    title: 'Global Returnable Asset Identifier (GRAI)',
    label: 'GRAI',
    shortcode: 'grai',
    ai: '8003',
  },
  {
    title: 'Global Individual Asset Identifier (GIAI)',
    label: 'GIAI',
    shortcode: 'giai',
    ai: '8004',
  },
  {
    title: 'Identification of an individual trade item piece',
    label: 'ITIP',
    shortcode: 'itip',
    ai: '8006',
  },
  {
    title: 'Component/Part Identifier (CPID)',
    label: 'CPID',
    shortcode: 'cpid',
    ai: '8010',
  },
  {
    title: 'Global Service Relation Number - Provider',
    label: 'GSRN - PROVIDER',
    shortcode: 'gsrnp',
    ai: '8017',
  },
  {
    title: 'Global Service Relation Number - Recipient',
    label: 'GSRN - RECIPIENT',
    shortcode: 'gsrn',
    ai: '8018',
  },
];

/**
 * Tests if the language incoming to the API matches the legal set of IANA languages.
 * Note that it must be lowercase - uppercase language alpha2s are not allowed and will return false.
 * @param language
 * @returns {boolean}
 */
const isValidIANALanguage = (language) => {
  const result = global.iana_language_array.find((value) => value.alpha2 === language);
  return result !== undefined;
};

/**
 * Tests if the mediaType incoming to the API matches the 'legal' set of media MIME types
 * @param mediaType
 * @returns {boolean}
 */
const isValidMediaType = (mediaType) => {
  const result = global.media_types_array.find((value) => value['Media Type'] === mediaType);
  return result !== undefined;
};

/**
 * Logs incoming text to the console with a date/time stamp
 * @param textToLog
 */
const logThis = (textToLog) => {
  console.log(`${new Date().toUTCString()} >> ${textToLog}`);
};

const getLinkTypesFromGS1ORG = async (sourceUrl) => {
  logThis(`Updating Linktypes from GS1 Production at ${sourceUrl}`);
  try {
    const fetchResponse = await fetch(sourceUrl, {
      method: 'get',
      headers: { Accept: 'application/json' },
    });

    if (fetchResponse.status === 200) {
      global.linkTypesArray = [];
      const linkTypesList = await fetchResponse.json();
      for (const [key, value] of Object.entries(linkTypesList)) {
        // Save this linkType for future use in the checking process.
        // Both formats for linktypes are saved as both are compatible:
        global.linkTypesArray.push({
          title: value.title,
          description: value.description,
          curie: `gs1:${key}`,
          url: `https://gs1.org/voc/${key}`,
        });
      }
      logThis(`Updating Linktypes from ${sourceUrl} completed successfully`);
    } else {
      logThis(`getLinkTypesFromGS1: Updating Linktypes from ${sourceUrl} failed with HTTP ${fetchResponse.status}`);
    }
  } catch (err) {
    logThis(`getLinkTypesFromGS1: Updating Linktypes from ${sourceUrl} failed with error: ${err}`);
  }
};

const getLinkTypesFromElsewhere = async (sourceUrl) => {
  logThis(`Updating Linktypes from GS1 Experimental at ${sourceUrl}`);
  try {
    // eslint-disable-next-line no-shadow
    const response = await fetch(sourceUrl, { headers: { Accept: 'application/ld+json' } });
    if (response.status === 200) {
      const data = await response.json();
      global.linkTypesArray = [];

      for (const entry of data['@graph']) {
        if (entry['rdfs:subPropertyOf'] && entry['rdfs:subPropertyOf']['@id'] === 'gs1:linkType') {
          const linkTypeName = entry['@id'].replace('gs1:', '');

          global.linkTypesArray.push({
            title: entry['rdfs:label']['@value'],
            description: entry['rdfs:comment']['@value'],
            curie: `gs1:${linkTypeName}`,
            url: `https://gs1.org/voc/${linkTypeName}`,
          });
        }
      }
    } else {
      logThis('Loading LinkTypes failed with HTTP', response.status, ' from source URL ', sourceUrl);
    }
  } catch (error) {
    logThis(`getLinkTypesFromElsewhere: Updating Linktypes from ${sourceUrl} failed with HTTP ${response.status}`);
    return null;
  }
};

/**
 * Run by a daemon service to update the global linkTypesArray list (runs once every 24 hours).
 * from the URL specified in environment variable LINKTYPES_SOURCE_URL
 * @returns {Promise<void>}
 */
const getLinkTypesFromGS1 = async () => {
  if (process.env.LINKTYPES_SOURCE_URL.includes('gs1.org/voc')) {
    await getLinkTypesFromGS1ORG(process.env.LINKTYPES_SOURCE_URL);
  } else {
    await getLinkTypesFromElsewhere(process.env.LINKTYPES_SOURCE_URL);
  }
  // Remove gs1:defaultLink, gs1:defaultLinkMulti, and gs1:handledBy from allowed linktypes
  const tempLinksArray = [];
  global.linkTypesArray.forEach((element) => {
    if (element.curie !== 'gs1:defaultLink' && element.curie !== 'gs1:defaultLinkMulti' && element.curie !== 'gs1:handledBy') {
      tempLinksArray.push(element);
    }
  });
  global.linkTypesArray = tempLinksArray;
  logThis(`${global.linkTypesArray.length} linkType entries loaded`);
};

/**
 * Converts a text GS1 Identifier Into its numeric equivalent.
 * If the incoming value is a number, just returns it!
 * @param aiLabel
 * @returns @returns {*|null}
 */
const convertShortCodeToAINumeric = (aiLabel) => {
  const aiNumeric = aiLabel;
  if (isNaN(aiNumeric)) {
    const result = aiArray.find((aiEntry) => aiEntry.shortcode === aiLabel);
    return result.ai ? result.ai : null;
  }
  return aiNumeric;
};

/**
 * Converts a numeric GS1 Identifier Into its label (shortcode) equivalent.
 * If the incoming value is not a number, just returns it!
 * @param aiNumeric
 * @returns {*|null}
 */

/**
 * ]
 * @param aiNumeric
 * @returns {*|null}
 */
const convertAINumericToShortCode = (aiNumeric) => {
  if (!isNaN(aiNumeric)) {
    // const aiEntry = dlToolkit.aitable.find((entry) => entry.ai === aiNumeric);
    // return aiEntry.shortcode;
    const result = aiArray.find((entry) => entry.ai === aiNumeric);
    return result.shortcode ? result.shortcode : null;
  }
  return aiNumeric;
};

/**
 * This updated function now calls across to the separate digitallink toolkit server
 * @returns {Promise<{SUCCESS: boolean, identificationKey: string, identificationKeyType: string}>}
 * @param uri
 */
const getDigitalLinkStructure = async (uri) => {
  const officialDefinition = {
    identificationKeyType: '',
    identificationKey: '',
    SUCCESS: true,
  };
  try {
    const uriToTest = `http://digitallink-toolkit-service/analyseuri${uri}`;
    const fetchResponse = await fetch(uriToTest);
    const result = await fetchResponse.json();
    if (fetchResponse.status === 200) {
      const structuredObject = result.data;
      [officialDefinition.identificationKeyType] = Object.keys(structuredObject.identifiers[0]);
      officialDefinition.identificationKey = structuredObject.identifiers[0][officialDefinition.identificationKeyType];
    } else {
      logThis(`getDigitalLinkStructure error: ${result}`);
      officialDefinition.SUCCESS = false;
    }
  } catch (err) {
    logThis(`getDigitalLinkStructure error: ${err}`);
    officialDefinition.SUCCESS = false;
  }
  return officialDefinition;
};

// Helper function to convert the object key to their camel Case type
const toCamelCase = (s) => s.replace(/([-_][a-z])/gi, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));

// Get the AI code for the identificationKeyType value
const retrievePropValueFromAILabel = (propName, propValue) => {
  if (propName === 'identification_key_type') {
    return convertShortCodeToAINumeric(propValue);
  }
  return propValue;
};

// Convert the Resolver DB result properties to their respective API Format
const convertPropsToAPIFormat = async (dbObject) => {
  // Default property value to some key
  const defaultKeyValue = {
    member_primary_gln: 'issuerGLN',
    forward_request_querystrings: 'fwqs',
    linktype: 'linkType',
    default_linktype: 'defaultLinkType',
  };

  const convertedObj = [];
  if (Array.isArray(dbObject)) {
    dbObject.forEach((item) => {
      const _renameProps = {};
      Object.keys(item).forEach((prop) => {
        const _propValue = retrievePropValueFromAILabel(prop, item[prop]);
        const _newProp = defaultKeyValue[prop] || toCamelCase(prop);
        _renameProps[_newProp] = _propValue;
      });
      convertedObj.push(_renameProps);
    });
  }
  return convertedObj;
};

/**
 * Restores 'SQL Safe' string properties  back to the original string from Base64
 * if it is prefixed with the double-character '[]' symbol.
 * In addition, any string property is 'cleaned' of disallowed characters
 * @param rrObj
 * @returns {*}
 */
// eslint-disable-next-line camelcase
const decodeSQLSafeResolverObject_v2 = (rrObj) => {
  const keys = Object.keys(rrObj);
  for (const thisKey of keys) {
    if (typeof rrObj[thisKey] === 'string') {
      if (rrObj[thisKey].startsWith('[]')) {
        const buff = new Buffer.from(rrObj[thisKey].substring(2), 'base64');
        rrObj[thisKey] = buff.toString('utf8');
      }

      // Clean the string value
      rrObj[thisKey] = rrObj[thisKey].replace('\n', '').replace('\r', '').replace("'", '').trim();
    }
  }
  return rrObj;
};

/**
 * SQL Safe to Text Decodes an array of objects (see decodeSQLSafeResolverObject() javadoc)
 * @param rrArray
 * @returns {*}
 */
// eslint-disable-next-line camelcase
const decodeSQLSafeResolverArray_v2 = (rrArray) => {
  if (Array.isArray(rrArray)) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < rrArray.length; i++) {
      rrArray[i] = decodeSQLSafeResolverObject_v2(rrArray[i]);
    }
  }
  return rrArray;
};

/**
 * Converts text to a Base64 format prefixed with the symbol '[]'.
 * This symbol is uses by function decodeTextFromSQLSafe() to detect that
 * stored data for a given property is encoded. Occasionally, this function
 * should be preventing the encoding (text may already be encoded) so if
 * the text starts '[]' already then it is simply returned.
 * @param incomingText
 * @returns {string}
 */
// eslint-disable-next-line camelcase
const convertTextToSQLSafe_v2 = (incomingText) => {
  if (!incomingText.startsWith('[]')) {
    const buff = new Buffer.from(incomingText, 'utf8');
    const base64data = buff.toString('base64');
    return `[]${base64data}`;
  }
  return incomingText;
};

module.exports = {
  isValidIANALanguage,
  isValidMediaType,
  getDigitalLinkStructure,
  convertShortCodeToAINumeric,
  convertAINumericToShortCode,
  getLinkTypesFromGS1,
  logThis,
  convertPropsToAPIFormat,
  toCamelCase,
  decodeSQLSafeResolverArray_v2,
  decodeSQLSafeResolverObject_v2,
  convertTextToSQLSafe_v2,
};
