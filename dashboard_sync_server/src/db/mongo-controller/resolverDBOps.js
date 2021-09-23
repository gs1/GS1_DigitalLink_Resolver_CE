const crypto = require('crypto');
const mongoConnection = require('../mongoConnection');
const utils = require('../../resolverUtils');

/**
 * gets (and if necessary sets) the syncHistName from a database I stored in MongoDB.
 * If there is no such entry then the container's currrent HOSTNAME is used. After that,
 * the database will carry that name for synchronising purposes even when the container
 * changes its hostname after a rebuild.
 */
const getResolverDatabaseIdFromMongoDB = async () => {
  try {
    const mongoConn = await mongoConnection();
    const collection = mongoConn.db('gs1resolver').collection('database_id');
    let dbId = await collection.findOne({ _id: 'database_id' });
    if (dbId === null) {
      // No DB ID record was found, so make dbId a new object
      // and create a name using randomClusterDBNameGenerator()
      dbId = {};
      dbId._id = 'database_id';
      dbId.databaseId = randomClusterDBNameGenerator();
      global.syncId = dbId.databaseId;

      // Save the new name into the Mongo database
      await collection.replaceOne({ _id: dbId._id }, dbId, { upsert: true });
      await mongoConn.close();
    } else {
      // Obtain the sync Id from the pre-saved database record which remains consistent
      // even if the build sync server is killed and re-spawned with a different Host name.
      global.syncId = dbId.databaseId;
    }
  } catch (e) {
    utils.logThis(`getResolverDatabaseIdFromMongoDB error: ${e}`);
    global.syncHostName = null;
  }
};

const dropCollection = async (collectionName) => {
  try {
    const mongoConn = await mongoConnection();
    const collection = mongoConn.db('gs1resolver').collection(collectionName);
    const dropResult = await collection.drop();
    utils.logThis(`dropCollection: collection ${collectionName} dropped (emptied): ${dropResult}`);
    return dropResult;
  } catch (error) {
    utils.logThis('Dropcollection error of resolverDBOps');
    utils.logThis(error);
  }
};

const randomClusterDBNameGenerator = () => crypto.randomBytes(Math.ceil(12 / 2)).toString('hex');

module.exports = {
  getResolverDatabaseIdFromMongoDB,
  dropCollection,
};
