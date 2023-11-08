const dbConnection = require('../dbConnection');

const utills = require('../../helper/utills');
/**
 * findDigitalLinkEntryUsingIdentifier connects to the document database and looks for the document
 * for the values in identifierKeyType and identifierKey.
 * A couple of AIs include their serial numbers alongside the GS1 Company Prefix in the identifier itself.
 * In this case, we remove more and more of the right-hand side of the identifierKey until we get a match
 * or there still isn't anything.
 * @param identifierKeyType
 * @param identifierKey
 * @returns {Promise<{}>}
 */
const findDigitalLinkEntryUsingIdentifier = async ({identifierKeyType, identifierKey}) => {
    try {
        const mongoConn = await dbConnection();
        const collection = mongoConn.db('gs1resolver').collection('uri');
        let doc;
        if (identifierKeyType === '8004' || identifierKeyType === '8003') {
            let partialKey = identifierKey;
            while (partialKey.length > 4) {
                doc = await collection.findOne({_id: `/${identifierKeyType}/${partialKey}`});
                if (!doc) {
                    // Nothing found so take a character off the end:
                    partialKey = partialKey.substring(0, partialKey.length - 1);
                } else {
                    break;
                }
            }
            // Now we obtain the serial number by seeing what's left when we remove the partialKey from the identifierKey:
            const serial = identifierKey.replace(partialKey, '');
            // Now update the doc to convert all {0} instances to the serial value and all {1}s to the full identifierKey
            // Here I converted the doc object to a string, parsed it with regex replacing all
            // '{0}' instances, then converted it back to an object again!
            doc = JSON.parse(JSON.stringify(doc).replace(/\{0\}/g, serial).replace(/\{1\}/g, identifierKey));
        } else {
            doc = await collection.findOne({_id: `/${identifierKeyType}/${identifierKey}`});
        }
        await mongoConn.close();
        return doc;
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
const findDigitalLinkPrefixEntry = async ({identifierKeyType, identifierKey}) => {
    let finalResult = null;
    try {
        const mongoConn = await dbConnection();
        const collection = mongoConn.db('gs1resolver').collection('gcp');

        // To find a match we must chop off more and more of a GS1 Key Value until we get a match
        const identifierKeyOriginalLength = identifierKey.length;
        for (let identifierKeyLength = identifierKeyOriginalLength; identifierKeyLength > 2; identifierKeyLength -= 1) {
            const partialGS1KeyValue = identifierKey.substring(0, identifierKeyLength - 1);
            finalResult = await collection.findOne({_id: `/${identifierKeyType}/${partialGS1KeyValue}`});
            if (finalResult !== null) {
                break; // we've found a result - stop the loop early!
            }
        }

        // If the finalResult is still null AND identifierKey does not start with "0", run the loop a second time
        // adding a "0" to the start of the partial string. This is needed because, for some GS1 identifiers, the
        // Digital Link Toolkit library does not add a zero prefix. With GTIN-13s, the Library does add a zero prefix to make it GTIN-14.
        if (!finalResult && !identifierKey.startsWith('0')) {
            for (let identifierKeyLength = identifierKeyOriginalLength; identifierKeyLength > 2; identifierKeyLength -= 1) {
                const partialGS1KeyValue = `0${identifierKey.substring(0, identifierKeyLength - 1)}`;
                finalResult = await collection.findOne({_id: `/${identifierKeyType}/${partialGS1KeyValue}`});
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
