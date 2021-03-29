const dbConnection = require('../dbConnection');

const utills = require('../../helper/utills');

/**
 * Counts the number of entries in Resolver's mongo database
 * @param unixTime
 * @returns {Promise<null|*>}
 */
const getDashboardResolverData = async () => {
  try {
    const mongoConn = await dbConnection();
    const collection = mongoConn.db('gs1resolver').collection('resolver_dashboard');
    const dbResult = await collection.find().toArray();
    await mongoConn.close();
    return dbResult;
  } catch (error) {
    utills.logThis('Exception occur in getDashboardResolverData query controller method');
    utills.logThis(error);
    return error;
  }
};

module.exports = {
  getDashboardResolverData,
};
