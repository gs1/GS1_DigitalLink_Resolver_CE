/* eslint-disable no-undef */
const format = require('biguint-format');
const crypto = require('crypto');
const utils = require('../bin/resolver_utils');

const processBatchValidationResp = (batchRespFromDB) => {
  const resultSet = { validations: [] };
  if (batchRespFromDB && Array.isArray(batchRespFromDB) && batchRespFromDB.length > 0) {
    // if a batch is pending, the call to [VALIDATE_Get_Validation_Results] will result in a single row
    // with column 'PENDING' set to 'Y'.
    if (batchRespFromDB.length === 1 && batchRespFromDB[0].PENDING === 'Y') {
      resultSet.STATUS = 7; // A value used by the VbG platform to denote 'pending'
    } else {
      resultSet.STATUS = 1; // A value used by the VbG platform to denote 'completed'
      resultSet.validations = batchRespFromDB;

      // Convert the response status from DB value to API equivalent value
      // eslint-disable-next-line guard-for-in
      for (const resultIndex in resultSet.validations) {
        resultSet.validations[resultIndex].validation_code = convertResponseStatusCodeFromDBValue(resultSet.validations[resultIndex].validation_code);
      }
    }
  } else {
    resultSet.STATUS = 7;
  }

  return resultSet;
};

/**
 * convertResponseStatusCodeFromDBValue() converts
 * from entryResponseStatusCodesInDB value
 * to entryResponseStatusCode equivalent value
 * @param code
 * @returns {number}
 */
const convertResponseStatusCodeFromDBValue = (code) => {
  const entryResponseStatusCodes = Object.entries(entryResponseStatusCode);
  const entryResponseStatusCodesInDB = Object.entries(entryResponseStatusCodeInDB);
  const codeName = entryResponseStatusCodesInDB.find((codeEntry) => codeEntry[1] === code);
  const codeValue = entryResponseStatusCodes.find((dbCodeEntry) => dbCodeEntry[0] === codeName[0]);
  return codeValue[1];
};

/**
 * Loops through the array of entries checking of there's anything immediately wrong with any entry.
 * The array validationResultsArray contains 'bad entries' which will be returned immediately
 * to the end user.
 * @param resolverEntriesArray
 * @returns {[]|*[]}
 */
const validateResolverEntriesArray_QuickCheck = async (resolverEntriesArray) => {
  const validationResultsArray = [];
  if (Array.isArray(resolverEntriesArray)) {
    for (const resolverEntry of resolverEntriesArray) {
      const result = await validateResolverEntry_QuickCheck(resolverEntry);
      // Only add to the results array if it's not OK
      if (result.validationCode !== global.entryResponseStatusCode.OK) {
        // Bad entry found! We'll be sending it back as one of an array of bad entries
        // back to the end user. First, we'll change the numeric identificationKeyType back to its label
        // (e.g. '01' becomes 'gtin').
        resolverEntry.identificationKeyType = utils.convertAINumericToShortCode(resolverEntry.identificationKeyType);
        // Now we push (add) this bad entry to the bottom of the array.
        // validationResultsArray.push(validateResolverEntry_QuickCheck(resolverEntry));
        validationResultsArray.push(result);
      }
    }
    return validationResultsArray;
  }
  return [];
};

/**
 * Checks that the mandatory elements of a resolver entry object are present. If all is well
 * The responses are sent via entryResponseStatusCode values initialised at the top of this source file:
 * @param resolverEntry
 * @returns {{identificationKey: string, identificationKeyType: string, validationCode: number}}
 */
const validateResolverEntry_QuickCheck = async (resolverEntry) => {
  const returnObj = {
    identificationKeyType: resolverEntry.identificationKeyType,
    identificationKey: resolverEntry.identificationKey,
    qualifierPath: resolverEntry.qualifierPath,
    validationCode: global.entryResponseStatusCode.OK,
  };

  // Check for the presence of all properties
  if (!checkResolverEntryPropertiesArePresent(resolverEntry)) {
    returnObj.validationCode = global.entryResponseStatusCode.RESOLVER_ENTRY_MISSING_PROPERTIES;
    return returnObj;
  }


  // Now see if the entry passes a test from the GS1 DigitalLink Toolkit:
  const officialDef = await utils.getDigitalLinkStructure(`/${resolverEntry.identificationKeyType}/${resolverEntry.identificationKey}`);
  if (!officialDef.SUCCESS) {
    returnObj.validationCode = global.entryResponseStatusCode.FAILED_DIGITAL_LINK_TEST;
    return returnObj;
  }

  // loop through the responses looking for anything missing for the response.
  // NB I'm using a conventional for loop rather than for..of as I am making a change to resolverResponse.linkType
  //  which needs to be reflected in the resolverEntry object.
  for (let i = 0; i < resolverEntry.responses.length; i += 1) {
    // If the title of the linktype was uploaded, change it to the CURIE version in this function call:
    // console.log('BEFORE', resolverEntry.responses[i]);
    setLinkType(resolverEntry.responses[i]);

    // Now check it:
    setMissingDefaultsForAbsentResolverResponseProperties(cleanResolverEntry(resolverEntry.responses[i]));
    if (resolverEntry.responses[i] === null || !checkResolverResponsePropertiesArePresent(resolverEntry.responses[i])) {
      // Only one response in the resolverEntry.responses[] array has to be wrong for the whole entry to be marked as having missing properties.
      returnObj.validationCode = global.entryResponseStatusCode.RESOLVER_ENTRY_MISSING_PROPERTIES;
      return returnObj; // return early as we have found a problem with one of the responses
    }

    // Validate URI Template variables
    const element = resolverEntry.responses[i];
    const _qualifierPath = decodeURI(resolverEntry.qualifierPath);
    let qualifierPathURIVariables = _qualifierPath !== null && _qualifierPath !== 0 ? _qualifierPath : '';
    const _targetUrl = decodeURI(element.targetUrl);
    let targetURLURIVariables = _targetUrl !== null && _targetUrl !== 0 ? _targetUrl : '';
    qualifierPathURIVariables = qualifierPathURIVariables.match(/\{.+?\}/g) || [];
    targetURLURIVariables = targetURLURIVariables.match(/\{.+?\}/g) || [];

    // make sure that variables mentioned in responses are also in the qualifier path.
    // The exception is special variable '{0}' used to denote the serial number found embedded
    // in the identifier key value itself, and {1) is used for the entire identifier key value
    for (const variable of targetURLURIVariables) {
      if (variable !== '{0}' && variable !== '{1}' && !qualifierPathURIVariables.includes(variable)) {
        returnObj.validationCode = global.entryResponseStatusCode.RESOLVER_ENTRY_MISMATCH_URI_VARIABLES;
        return returnObj;
      }
    }
  }

  return returnObj;
};

/**
 * Checks that all the Resolver entry properties are present and of the correct type.
 * @param resolverEntry
 * @returns {boolean}
 */
const checkResolverEntryPropertiesArePresent = (resolverEntry) => {
  const goodIdentificationKeyType =  resolverEntry.identificationKeyType && typeof resolverEntry.identificationKeyType === 'string' && resolverEntry.identificationKeyType !== '';
  const goodIdentificationKey =  resolverEntry.identificationKey && typeof resolverEntry.identificationKeyType === 'string' && resolverEntry.identificationKey !== '';
  const goodEntryResolverEntry = resolverEntry.itemDescription && typeof resolverEntry.identificationKeyType === 'string' && resolverEntry.itemDescription !== '';
  const goodQualifierPath = resolverEntry.qualifierPath && typeof resolverEntry.identificationKeyType === 'string' && resolverEntry.qualifierPath !== '';
  const goodActive = resolverEntry.active !== undefined && typeof resolverEntry.active === 'boolean' && resolverEntry.responses !== '';
  const goodResponses =  resolverEntry.responses && Array.isArray(resolverEntry.responses);

  if (!goodIdentificationKeyType) console.log('checkResolverEntryPropertiesArePresent: fail for identificationKeyType', JSON.stringify(resolverEntry, null, 2));
  if (!goodIdentificationKey) console.log('checkResolverEntryPropertiesArePresent: fail for identificationKey', JSON.stringify(resolverEntry, null, 2));
  if (!goodEntryResolverEntry) console.log('checkResolverEntryPropertiesArePresent: fail for itemDescription', JSON.stringify(resolverEntry, null, 2));
  if (!goodQualifierPath) console.log('checkResolverEntryPropertiesArePresent: fail for qualifierPath', JSON.stringify(resolverEntry, null, 2));
  if (!goodActive) console.log('checkResolverEntryPropertiesArePresent: fail for active', JSON.stringify(resolverEntry, null, 2));
  if (!goodResponses) console.log('checkResolverEntryPropertiesArePresent: fail for responses', JSON.stringify(resolverEntry, null, 2));

    return goodIdentificationKeyType && goodIdentificationKey && goodEntryResolverEntry && goodQualifierPath && goodActive && goodResponses;
};

/**
 * The batch id is a randomly generated 9-digit number between 100000000 and 999999999
 * used to temporarily and uniquely identify a batch(single array upload) of entries in the database.
 * In the database, batchId adds to a unique combination of the GLN of the uploading user, and a time period
 * of up to 7 days giving a solid level of uniqueness for thr purpose needed (batchId is stored as an INT
 * in the uri_entries db table).
 */
const generateBatchId_v2 = () => {
  // These functions are sourced from:
  // https://stackoverflow.com/questions/33609404/node-js-how-to-generate-random-numbers-in-specific-range-using-crypto-randomby
  const randomC = (qty) => format(crypto.randomBytes(qty), 'dec');
  const random = (low, high) => (randomC(4) / 2 ** (4 * 8 - 1)) * (high - low) + low;

  // I use the above two functions to generate the desired always-9-digit number:
  return parseInt(random(100000000, 999999999), 10);
};

/**
 * Not all properties need to be present on the inbound request, so defaults are set here if they are missing.
 * @param resolverEntry
 * @returns {{active}|*}
 */
const setMissingDefaultsForAbsentResolverEntryProperties = (resolverEntry) => {
  // Check for presence of the optional active flag. If not defined create it and set it to true,
  // otherwise set it to whatever boolean value it was beforehand
  resolverEntry.active = resolverEntry.active === undefined || resolverEntry.active;

  // If the qualifier path is missing, set it to "/":
  resolverEntry.qualifierPath = resolverEntry.qualifierPath === undefined ? '/' : resolverEntry.qualifierPath;

  return resolverEntry;
};

/**
 * Cleans a Resolver Entry object by removing some disallowed characters (\n, \r, ', and ;)
 * @param resolverEntry
 * @returns {*}
 */
const cleanResolverEntry = (resolverEntry) => {
  const cleanedResolverEntry = {};
  for (const [key, value] of Object.entries(resolverEntry)) {
    if (typeof value === 'string') {
      // eslint-disable-next-line newline-per-chained-call
      cleanedResolverEntry[key] = value.replace('\n', '').replace('\r', '').replace("'", '').replace(';', '').trim();
    } else {
      cleanedResolverEntry[key] = value;
    }
  }
  return cleanedResolverEntry;
};

/**
 * Not all properties need to be present on the inbound request, so defaults are set here if they are missing.
 * @param resolverResponse
 * @returns {{defaultMimeType}|*}
 */
const setMissingDefaultsForAbsentResolverResponseProperties = (resolverResponse) => {
  resolverResponse.active = resolverResponse.active === undefined || resolverResponse.active;
  resolverResponse.defaultLinkType = resolverResponse.defaultLinkType === undefined || resolverResponse.defaultLinkType;
  resolverResponse.defaultIanaLanguage = resolverResponse.defaultIanaLanguage === undefined || resolverResponse.defaultIanaLanguage;
  resolverResponse.defaultContext = resolverResponse.defaultContext === undefined || resolverResponse.defaultContext;
  resolverResponse.defaultMimeType = resolverResponse.defaultMimeType === undefined || resolverResponse.defaultMimeType;
  resolverResponse.ianaLanguage = resolverResponse.ianaLanguage === undefined ? 'xx' : resolverResponse.ianaLanguage;
  resolverResponse.context = resolverResponse.context === undefined ? 'xx' : resolverResponse.context;
  resolverResponse.mimeType = resolverResponse.mimeType === undefined ? '' : resolverResponse.mimeType;

  return resolverResponse;
};

/**
 * Checks that the mandatory elements of a resolverResponse object are present. If all is well
 * then the resolver response is returned - if not, null is returned.
 * (more checks can be added as needed) * @param resolverResponse
 * @returns {boolean}
 */
const checkResolverResponsePropertiesArePresent = (resolverResponse) => {
  // Check for the presence of mandatory data.
    setLinkType(resolverResponse);
    const goodLinkType = resolverResponse.linkType && typeof resolverResponse.linkType === 'string' && resolverResponse.linkType !== '';
    const goodIanaLanguage = resolverResponse.ianaLanguage && typeof resolverResponse.ianaLanguage === 'string' && utils.isValidIANALanguage(resolverResponse.ianaLanguage);
    const goodContext = resolverResponse.context && typeof resolverResponse.context === 'string';
    const goodMimeType = resolverResponse.mimeType && typeof resolverResponse.mimeType === 'string' && utils.isValidMediaType(resolverResponse.mimeType);
    const goodLinkTitle = resolverResponse.linkTitle && typeof resolverResponse.linkTitle === 'string' && resolverResponse.linkTitle !== '';
    const goodTargetUrl = resolverResponse.targetUrl && typeof resolverResponse.targetUrl === 'string' && !utils.detectJavaScriptCode(resolverResponse.targetUrl) && lineIncludesInternetURIScheme(resolverResponse.targetUrl);
    const goodDefaultLinkType = resolverResponse.defaultLinkType !== undefined && typeof resolverResponse.defaultLinkType === 'boolean';
    const goodDefaultIanaLanguage = resolverResponse.defaultIanaLanguage !== undefined && typeof resolverResponse.defaultIanaLanguage === 'boolean';
    const goodDefaultContext = resolverResponse.defaultContext !== undefined && typeof resolverResponse.defaultContext === 'boolean';
    const goodDefaultMimeType = resolverResponse.defaultMimeType !== undefined && typeof resolverResponse.defaultMimeType === 'boolean';
    const goodActive = resolverResponse.active !== undefined && typeof resolverResponse.active === 'boolean';
    const goodFwqs = resolverResponse.fwqs !== undefined && typeof resolverResponse.fwqs === 'boolean';


    if(!goodLinkType)  console.log('response: bad linktype');
    if(!goodIanaLanguage)  console.log('response: bad iana language');
    if(!goodContext)  console.log('response: bad context');
    if(!goodMimeType)  console.log('response: bad mime type');
    if(!goodLinkTitle)  console.log('response: bad link title');
    if(!goodTargetUrl)  console.log('response: bad target url');
    if(!goodDefaultLinkType)  console.log('response: bad default link type');
    if(!goodDefaultIanaLanguage)  console.log('response: bad default iana language');
    if(!goodDefaultContext)  console.log('response: bad default context');
    if(!goodDefaultMimeType)  console.log('response: bad default mime type');
    if(!goodActive)  console.log('response: bad active');
    if(!goodFwqs)  console.log('response: bad fwqs');

    if (goodLinkType && goodIanaLanguage && goodContext && goodMimeType && goodLinkTitle && goodTargetUrl && goodDefaultLinkType && goodDefaultIanaLanguage && goodDefaultContext && goodDefaultMimeType && goodActive && goodFwqs)
      return true;

    console.log('response: bad response', resolverResponse)
    return false;
};

const structureResolverRespProps = (obj) => {
  const resolverResponse = { ...obj };
  // Make sure that IANA Language is only two characters
  resolverResponse.ianaLanguage = resolverResponse.ianaLanguage.substring(0, 2);

  // Set flags to appropriate internal values
  resolverResponse.active = resolverResponse.active ? 1 : 0;
  resolverResponse.fwqs = resolverResponse.fwqs ? 1 : 0;
  resolverResponse.defaultLinkType = resolverResponse.defaultLinkType ? 1 : 0;
  resolverResponse.defaultIanaLanguage = resolverResponse.defaultIanaLanguage ? 1 : 0;
  resolverResponse.defaultContext = resolverResponse.defaultContext ? 1 : 0;
  resolverResponse.defaultMimeType = resolverResponse.defaultMimeType ? 1 : 0;
  resolverResponse.linkTitle = convertTextToSQLSafe(resolverResponse.linkTitle);

  // Make sure LinkTitle never exceeds 100 characters (yes it is base64 encoded which
  // expands the characters by approx 35%. If the base64 version is truncated,
  // it can still decoded - it just produces truncated decoded text.
  if (resolverResponse.linkTitle.length > 100) {
    resolverResponse.linkTitle = resolverResponse.linkTitle.substring(0, 100);
  }
  return resolverResponse;
};

/**
 * Sets the linkType to its CURIE version if found, else "" which will be caught as an error later.
 * @param resolverResponse
 * @returns {boolean}
 */
const setLinkType = (resolverResponse) => {
  try {
    // Fill in any 'blanks' from the web page selections
    if (resolverResponse.linkType !== '') {
      // Check that the linktype is 'allowed': To this, we check if it in the list stored.
      // We check if it is a URI or CURIE. If so, there is nothing more we need to do as resolverResponse.linkType is 'API ready'.
      // If isTitle instead (which we test lowercase/trimmed versions for max compatibility, we quietly convert the linkType to its CURIE value.
      // If not any of the three, it's an error.
      try {
        const isCURIE = global.linkTypesArray.find((linkType) => linkType.curie.toLowerCase().trim() === resolverResponse.linkType.toLowerCase().trim());
        const isURI = global.linkTypesArray.find((linkType) => linkType.url.toLowerCase().trim() === resolverResponse.linkType.toLowerCase().trim());
        const isTitle = global.linkTypesArray.find((linkType) => linkType.title.toLowerCase().trim() === resolverResponse.linkType.toLowerCase().trim());

        if (!isCURIE && !isURI && !isTitle) {
          // Force linktype to be blank which will trigger an error in calling code
          console.log(`setLinkType error: linkType ${resolverResponse.linkType} is not a valid linkType`);
          resolverResponse.linkType = '';
        } else if (typeof isURI === 'object') {
          // set the linktype to its CURIE version
          resolverResponse.linkType = isURI.curie;
        } else if (typeof isTitle === 'object') {
          // set the linktype to its CURIE version
          resolverResponse.linkType = isTitle.curie;
        } else if (typeof isCURIE === 'object') {
          // set the linktype to its CURIE version
          resolverResponse.linkType = isCURIE.curie;
        } else {
          // It's unlikely we would end up here but we have code to deal with this as we are definitely in a data error.
          resolverResponse.linkType = '';
        }
      } catch (e) {
        utils.logThis(`setLinkType error: ${e} with resolverResponse = ${JSON.stringify(resolverResponse)}`);
        resolverResponse.linkType = '';
      }
    }
    // Used to check linkTypes
  } catch (e2) {
    utils.logThis(`setLinkType error: ${e2} with resolverResponse = ${JSON.stringify(resolverResponse)}`);
  }
};

/**
 * Returns true if the data line includes an instance from this Non-exhaustive list
 * of URI schemes most likely to be used in an upload file.
 * This function is used as a simple way of detecting a data line since a target url
 * is a mandatory item of data to upload.
 * @param dataLine
 * @returns {boolean}
 */
const lineIncludesInternetURIScheme = (dataLine) =>
  dataLine.includes('http://') || // unencrypted web address
  dataLine.includes('https://') || // encrypted web address
  dataLine.includes('ftp://') || // file transfer protocol (file download)
  dataLine.includes('sftp://') || // secure file transfer protocol (file download)
  dataLine.includes('rtsp://') || // media streaming protocol
  dataLine.includes('sip:') || // internet telephone number
  dataLine.includes('tel:') || // standard telephone number
  dataLine.includes('mailto:'); // create an email to send
// To set the response parameters of data entry request, which will prepare for add data in DB with valid entries
const cleanAndParseDataEntryResponse = async (responsesEntries) => {
  const respArr = [];
  for (const resolverEntry of responsesEntries) {
    const fullResolverEntry = setMissingDefaultsForAbsentResolverEntryProperties(cleanResolverEntry(resolverEntry));
    const checkResult = await validateResolverEntry_QuickCheck(fullResolverEntry);
    fullResolverEntry.validationCode = checkResult.validationCode;
    respArr.push(fullResolverEntry);
  }
  return respArr;
};

module.exports = {
  processBatchValidationResp,
  convertResponseStatusCodeFromDBValue,
  validateResolverEntriesArray_QuickCheck,
  validateResolverEntry_QuickCheck,
  checkResolverEntryPropertiesArePresent,
  generateBatchId_v2,
  cleanResolverEntry,
  setMissingDefaultsForAbsentResolverEntryProperties,
  setMissingDefaultsForAbsentResolverResponseProperties,
  checkResolverResponsePropertiesArePresent,
  structureResolverRespProps,
  cleanAndParseDataEntryResponse,
};
