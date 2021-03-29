const mongoConnection = require('../mongoConnection');
const utils = require('../../resolverUtils');
/**
 * Creates the unixtime index which is used for indexing the data
 * @returns {Promise<boolean>}
 */
const createUnixTimeIndex = async () => {
  try {
    const mongoConn = await mongoConnection();
    const collection = mongoConn.db('gs1resolver').collection('uri');
    const result = await collection.createIndex({ unixtime: 1 });
    await mongoConn.close();
    utils.logThis("Index 'unixtime' build completed");
    return result.ok === 1;
  } catch (err) {
    utils.logThis('Error in creatTimeIndex of resovlerGenericOps');
    utils.logThis(err);
    return false;
  }
};

module.exports = {
  createUnixTimeIndex,
};
