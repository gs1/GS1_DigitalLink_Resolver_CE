const dbConnection = require('../dbConnection');

const utills = require('../../helper/utills');

/**
 * Counts the number of entries in Resolver's mongo database
 * @param unixTime
 * @returns {Promise<null|*>}
 */
const uriEntriesCountFromUnixTime = async (unixTime = 0) => {
  try {
    const mongoConn = await dbConnection();
    const collection = mongoConn.db('gs1resolver').collection('uri');
    const dbResult = await collection.countDocuments({ unixtime: { $gte: +unixTime } });
    utills.logThis(`Get count result from mongo db for unix time ${unixTime}`);
    await mongoConn.close();
    return dbResult;
  } catch (error) {
    utills.logThis('Exception occur in uriCountByUnixTime query controller method');
    utills.logThis(error);
    return error;
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
const uriPagedEntriesFromUnixTime = async ({ unixtime, pagenumber, limit }) => {
  try {
    const startIndex = (pagenumber - 1) * limit;
    const mongoConn = await dbConnection();
    const collection = mongoConn.db('gs1resolver').collection('uri');
    const dataArray = await collection
      .find({ unixtime: { $gte: unixtime } })
      .skip(startIndex)
      .limit(limit)
      .toArray();
    await mongoConn.close();
    return dataArray;
  } catch (err) {
    utills.logThis('Exception occur in uriPagedEntriesFromUnixTime method');
    utills.logThis(err);
    return err;
  }
};
module.exports = {
  uriEntriesCountFromUnixTime,
  uriPagedEntriesFromUnixTime,
};
