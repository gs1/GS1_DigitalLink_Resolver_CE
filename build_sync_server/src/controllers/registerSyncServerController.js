const { getResolverDatabaseIdFromMongoDB } = require('../db/mongo-controller/resolverDBOps');
const { registerSyncServer } = require('../db/mssql-controller/registerSyncServerDB');
const utils = require('../resolverUtils');
/**
 * Each synchronisation process needs calling build sync servers to register with the SQL data entry database
 * using a unique id. This 12 character ID is originally sourced from the build-sync-server's given HOSTNAME
 * from an environment variable offered to it by the hosting Docker-compatible engine.
 * This value is stored in the local MongoDB database, and subsequently retrieved when build-sync-server
 * starts up. After then, build-sync-server uses the value in the database rather than its own HOSTNAME
 * so that the data sync is consistent with the MongoDB database's data store.
 * It also make it easy to force a rebuild by deleting the registered entry in the SQL database.
 * In response, the object returned has three properties:
 *    .updateCount - which lists the number of sync updates required, or -1 if a full sync is needed.
 *    .lastHeardUnixTime - which contains the unixtime (secs since 01-01-1970) when this hostname was last heard (or NULL if never heard before)
 *    .nextResolverSyncChangeId - the id of the next sync queue entry that will be used by a 'changes-only' sync
 * @returns {Promise<{lastHeardDateTime}>}
 */
const registerThisSyncServer = async () => {
  let lastHeardDateTime = '';

  try {
    await getResolverDatabaseIdFromMongoDB();

    // Register this server with the data-entry database
    const result = await registerSyncServer(global.syncId, process.env.HOSTNAME);

    if (result === null) {
      utils.logThis('registerThisSyncServer warning: Could not get last heard datetime from SQL database!');
    } else {
      // Process metrics that have come back from a successful registration so that the calling function
      // can find out what synchronisation work (if any) it needs to do.
      lastHeardDateTime = result[0].last_heard_datetime;
    }
  } catch (error) {
    utils.logThis('Error in registerThisSyncServer of registerSyncServerController');
    utils.logThis(error);
  }
  return lastHeardDateTime;
};

module.exports = registerThisSyncServer;
