const dbConnection = require('../dbConnection');

const utills = require('../../helper/utills');
/**
 * findDigitalLinkEntryUsingIdentifier connects to the document database and looks for the document
 * for the values in identifierKeyType and identifierKey
 * @param identifierKeyType
 * @param identifierKey
 * @returns {Promise<{}>}
 */
const findDigitalLinkEntryUsingIdentifier = async ({ identifierKeyType, identifierKey }) => {
  try {
    const mongoConn = await dbConnection();
    const collection = mongoConn.db('gs1resolver').collection('uri');
    const finalResult = await collection.findOne({ _id: `/${identifierKeyType}/${identifierKey}` });
    await mongoConn.close();
    return finalResult;
  } catch (e) {
    utills.logThis('Exception occur in findDigitalLinkEntryUsingIdentifier method');
    utills.logThis(e);
    return e;
  }
};

/**
 * findPrefixEntry looks for prefix versions of the identifierKey. It is normally called should
 * no match be found by function findDigitalLinkEntryInDB().
 * @param identifierKeyType
 * @param identifierKey
 * @returns {Promise<{}>}
 */
const findDigitalLinkPrefixEntry = async ({ identifierKeyType, identifierKey }) => {
  let finalResult = null;
  try {
    const mongoConn = await dbConnection();
    const collection = mongoConn.db('gs1resolver').collection('gcp');

    // To find a match we must chop off more and more of a GS1 Key Value until we get a match
    const identifierKeyOriginalLength = identifierKey.length;
    for (let identifierKeyLength = identifierKeyOriginalLength; identifierKeyLength > 3; identifierKeyLength -= 1) {
      const partialGS1KeyValue = identifierKey.substring(0, identifierKeyLength - 1);
      finalResult = await collection.findOne({ _id: `/${identifierKeyType}/${partialGS1KeyValue}` });
      if (finalResult !== null) {
        break; // we've found a result - stop the loop early!
      }
    }

    // If the finalResult is still null AND identifierKey does not start with "0", run the loop a second time
    // adding a "0" to the start of the partial string. This is needed because, for some GS1 identifiers, the
    // Digital Link Toolkit library does not add a zero prefix. With GTIN-13s, the Library does add a zero prefix to make it GTIN-14.
    if (!finalResult && !identifierKey.startsWith('0')) {
      for (let identifierKeyLength = identifierKeyOriginalLength; identifierKeyLength > 3; identifierKeyLength -= 1) {
        const partialGS1KeyValue = `0${identifierKey.substring(0, identifierKeyLength - 1)}`;
        finalResult = await collection.findOne({ _id: `/${identifierKeyType}/${partialGS1KeyValue}` });
        if (finalResult !== null) {
          break; // we've found a result - stop the loop early!
        }
      }
    }
    await mongoConn.close();
    return finalResult;
  } catch (e) {
    utills.logThis('Exception occur in findPrefixEntry method');
    utills.logThis(e);
    return e;
  }
};

module.exports = {
  findDigitalLinkEntryUsingIdentifier,
  findDigitalLinkPrefixEntry,
};
