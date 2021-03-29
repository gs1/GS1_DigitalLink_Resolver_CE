const utils = require('../resolverUtils');
const registerThisSyncServer = require('./registerSyncServerController');
const { dropCollection } = require('../db/mongo-controller/resolverDBOps');
const { performSyncGCPDocumentBuild } = require('./performSyncGCPBuildController');
const { performSyncURIDocumentBuild } = require('./performSyncURIBuildController');

/**
 * The run function controls the BUILD process.
 * @returns {Promise<void>}
 */
const buildSyncRun = async () => {
  global.buildRunningFlag = true;
  // Register this server's hostname with the SQL Database.
  // In response, the object returned has three properties:
  //     .updateCount - which lists the number of sync updates required, or -1 if a full sync is needed.
  //     .lastHeardUnixTime - which contains the unixtime (secs since 01-01-1970) when this hostname was last heard (or NULL if never heard before)
  //     .nextResolverSyncChangeId - the id of the next sync queue entry that will be used by a 'changes-only' sync
  const lastHeardDateTimeObj = await registerThisSyncServer();

  // Convert date/time object to a string representing the date:
  const lastHeardDateTime = JSON.stringify(lastHeardDateTimeObj).replace(/"/g, '');

  // If this server has not been heard from before, lastHeardDataTime will be 1st January 2020.
  const fullBuildFlag = String(lastHeardDateTime).includes('2020-01-01');
  if (fullBuildFlag) {
    utils.logThis(`This build sync server '${global.syncId}' has not been heard from before, so a full build of the MongoDB will now commence`);
    // DEPRECATED dropCollection() of uri and gcp collections as it can take an existing service off the air needlessly
    // await dropCollection('gcp');
    // await dropCollection('uri');
    await dropCollection('resolver_dashboard');
  } else {
    utils.logThis(`Build: '${global.syncId}' last heard ${lastHeardDateTime} - running 'update' build`);
  }

  // build GCPs before URIs as there are far fewer entries to build with GCP.
  await performSyncGCPDocumentBuild(lastHeardDateTime, fullBuildFlag);
  await performSyncURIDocumentBuild(lastHeardDateTime, fullBuildFlag);

  global.buildRunningFlag = false;
};

module.exports = buildSyncRun;
