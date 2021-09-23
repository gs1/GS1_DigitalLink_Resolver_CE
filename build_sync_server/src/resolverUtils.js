// This script file is to hold any common utility functions used across two or more of the other scripts
// eslint-disable-next-line import/no-unresolved
const fetch = require('node-fetch');

/**
 * Logs incoming text to the console with a date/time stamp
 * @param textToLog
 */
const logThis = (textToLog) => {
  console.log(`${new Date().toUTCString()} >> ${textToLog}`);
};

/**
 * getDigitalLinkStructure calls into the GS1 DigitalInk Toolkit library and
 * returns the object structure (if any) or an error. The qualifiers are sorted
 * into the correct order (if there are any).
 * @param uri
 * @returns {{result: string, error: string}}
 */
const getDigitalLinkStructure = async (uri) => {
  let structuredObject = { result: '', error: '' };
  try {
    const fetchURI = `http://digitallink-toolkit-service/analyseuri${uri}`;
    const fetchResponse = await fetch(fetchURI); // Note - NO / before the uri variable!
    const result = await fetchResponse.json();
    if (fetchResponse.status === 200) {
      structuredObject = result.data;
      structuredObject.result = 'OK';
    } else {
      logThis(`getDigitalLinkStructure error: ${JSON.stringify(result.data, null, 2)}`);
    }
    return structuredObject;
  } catch (err) {
    structuredObject.result = 'ERROR';
    structuredObject.error = err.toString();
    return structuredObject;
  }
};

/**
 * @param textThatIsSQLSafe
 * @return string
 * Purpose: Restores 'SQL Safe' text back to the original string from Base64
 *          if it is prefixed with the double-character '[]' symbol
 */
const decodeTextFromSQLSafe = (textThatIsSQLSafe) => {
  /* eslint-disable new-cap */
  let result = textThatIsSQLSafe;
  if (textThatIsSQLSafe.startsWith('[]')) {
    const buff = new Buffer.from(textThatIsSQLSafe.substring(2), 'base64');
    result = buff.toString('utf8');
  }
  if (result == null) {
    result = '';
  }
  return result;
};

/**
 * getDigitalLinkVocabWord takes the linktype and creates a 'compressed' version (CURIE).
 * For example, 'https:/gs1.org/voc/hasRetailers' becomes 'gs1:hasRetailers', and
 *              alternative format 'gs1:hasRetailers' becomes 'gs1:hasRetailers'
 * Currently this function detects and supports 'gs1' and 'schema' CURIEs
 * @param linkTypeURL
 * @return string
 */
const getDigitalLinkVocabWord = (linkTypeURL) => {
  if (linkTypeURL.includes('/')) {
    const list = linkTypeURL.split('/');
    if (linkTypeURL.includes('gs1')) {
      return `gs1:${list[list.length - 1]}`;
    }
    if (linkTypeURL.includes('schema')) {
      return `schema:${list[list.length - 1]}`;
    }
    // Just return the original
    return list[list.length - 1];
  }

  if (linkTypeURL.includes('gs1:') || linkTypeURL.includes('schema:')) {
    // It's already a CURIE! Nice one :-)
    return linkTypeURL;
  }
  // We haven't much choice just to return what we were given - add a warning to console.
  logThis(`getDigitalLinkVocabWord WARNING: unformatted CURIE linktype ${linkTypeURL} returned`);
  return linkTypeURL;
};
/**
 * Converts a numeric GS1 Identifier Into its label (shortcode) equivalent.
 * If the incoming value is not a number, just returns it!
 * @param aiLabel
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
      logThis(`convertAINumericToLabel error: ${result}`);
      return null;
    } catch (err) {
      logThis(`convertAINumericToLabel error: ${err}`);
    }
    return null;
  }
  return aiNumeric;
};

module.exports = { logThis, getDigitalLinkStructure, decodeTextFromSQLSafe, getDigitalLinkVocabWord, convertAINumericToLabel };
