/* eslint-disable new-cap */
/**
 * SQL Safe to Text Decodes an array of objects (see decodeSQLSafeResolverObject() javadoc)
 * @param rrArray
 * @returns {*}
 */
exports.decodeSQLSafeResolverArray = (rrArray) => {
  if (Array.isArray(rrArray)) {
    for (let i = 0; i < rrArray.length; i += 1) {
      rrArray[i] = decodeSQLSafeResolverObject(rrArray[i]);
    }
  }
  return rrArray;
};

/**
 * Restores 'SQL Safe' string properties  back to the original string from Base64
 * if it is prefixed with the double-character '[]' symbol.
 * In addition, any string property is 'cleaned' of disallowed characters
 * @param rrObj
 * @returns {*}
 */
const decodeSQLSafeResolverObject = (rrObj) => {
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
 * This function formats the URI document so that 'headers' such as "_id" and "unixtime" are placed at the top
 * and the variants (if more than one) are sorted alphanumerically, with the root variant "/" at the top.
 * This makes the JSON version of this document easier to read by 'mere' humans.
 * @param doc
 * @returns {{}}
 */
exports.formatUriDocument = (doc) => {
  const formattedDoc = {};
  formattedDoc._id = doc._id;
  formattedDoc.unixtime = doc.unixtime;

  if (doc['/'] !== undefined) {
    formattedDoc['/'] = doc['/'];
  }

  const sortedKeys = Object.keys(doc).sort();
  sortedKeys.forEach((entry) => {
    if (entry !== '_id' && entry !== 'unixtime' && entry !== '/') {
      formattedDoc[entry] = doc[entry];
    }
  });

  return formattedDoc;
};
