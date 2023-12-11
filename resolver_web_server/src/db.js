const { MongoClient } = require('mongodb');

const mongoConnection = process.env.MONGODBCONN || process.env.DBCONN;
const mongoClient = new MongoClient(mongoConnection, { useNewUrlParser: true, useUnifiedTopology: true });

let db;

// Connect to the MongoDB client
mongoClient.connect(err => {
  if (err) throw err;
  db = mongoClient.db('gs1resolver');
});


// Gracefully close the MongoDB connection on exit
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function cleanup() {
  console.log('Closing MongoDB connection...');
  await mongoClient.close();
  console.log('MongoDB connection closed.');
  process.exit(0);
}


/**
 * findDigitalLinkEntry connects to the document database and looks for the document
 * for the values in identifierKeyType and identifierKey
 * @param identifierKeyType
 * @param identifierKey
 * @returns {Promise<{}>}
 */
const findDigitalLinkEntry = async (identifierKeyType, identifierKey) => {
  try {
    const collection = db.collection('uri');
    return await collection.findOne({ _id: `/${identifierKeyType}/${identifierKey}` });
  } catch (e) {
    console.log(`findDigitalLinkEntry error: ${e}`);
    return null;
  }
};

/**
 * Counts the number of entries in Resolver's mongo database
 * @param unixTime
 * @returns {Promise<null|*>}
 */
const countEntriesFromUnixTime = async (unixTime) => {
  try {
    unixTime = parseInt(unixTime, 10);
    const collection = db.collection('uri');
    return await collection.countDocuments({ unixtime: { $gte: unixTime } });
  } catch (err) {
    console.log(`countEntriesFromUnixTime error: ${err}`);
    return -1;
  }
};

/**
 * Returns a list of documents that are greater than or equal to the supplied unixTime value
 * using a page number and size.
 * @param unixTime
 * @param pageNumber
 * @param pageSize
 * @returns {Promise<number|*>}
 */
const getPagedEntriesFromUnixTime = async (unixTime, pageNumber, pageSize) => {
  try {
    unixTime = parseInt(unixTime, 10);
    pageNumber = parseInt(pageNumber, 10);
    pageSize = parseInt(pageSize, 10);

    // Maximum page size is 1000
    pageSize = pageSize > 1000 ? 1000 : pageSize;
    const skips = pageNumber > 0 ? (pageNumber - 1) * pageSize : 0;
    const collection = db.collection('uri');
    return await collection
      .find({ unixtime: { $gte: unixTime } })
      .skip(skips)
      .limit(pageSize)
      .toArray();

  } catch (err) {
    console.log(`getPagesEntriesFromUnixTime error: ${err}`);
    return -1; // -1 denotes error
  }
};

/**
 * findPrefixEntry looks for prefix versions of the identifierKey. It is normally called should
 * no match be found by function findDigitalLinkEntryInDB().
 * @param identifierKeyType
 * @param identifierKey
 * @returns {Promise<{}>}
 */
const findPrefixEntry = async (identifierKeyType, identifierKey) => {
  let finalResult = null;
  try {
    const collection = db.collection('gcp');

    // To find a match we must chop off more and more of a GS1 Key Value until we get a match
    const identifierKeyOriginalLength = identifierKey.length;
    for (let identifierKeyLength = identifierKeyOriginalLength; identifierKeyLength > 3; identifierKeyLength -= 1) {
      const partialGS1KeyValue = identifierKey.substring(0, identifierKeyLength - 1);
      finalResult = await collection.findOne({ _id: `/${identifierKeyType}/${partialGS1KeyValue}` });
      if (finalResult !== null) {
        break; // we've found a result - stop the loop early!
      }
    }
    return finalResult;
  } catch (e) {
    console.log(`findPrefixEntry error: ${e}`);
    return null;
  }
};
module.exports = {
  findDigitalLinkEntry,
  findPrefixEntry,
  countEntriesFromUnixTime,
  getPagedEntriesFromUnixTime,
};
