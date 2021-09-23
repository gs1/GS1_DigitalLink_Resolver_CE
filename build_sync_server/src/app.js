/**
 * upload.js is the 'startup' file for Node. It runs continuously as a simple HTTP server used principally by Docker Engine
 * to test its Health (see Dockerfile), although it also has a "/build" command if, in the future, an externally-triggered
 * BUILD is required. Otherwise, BUILD is executed regular by an interval timer set at the bottom of this file.
 */
// eslint-disable-next-line import/no-unresolved
const utils = require('./resolverUtils');
const { getResolverDatabaseIdFromMongoDB } = require('./db/mongo-controller/resolverDBOps');
const entropyWait = require('./controllers/entropyWait');
const buildSyncRun = require('./controllers/buildSyncController');

global.buildRunningFlag = false;
global.buildRunningSince = new Date();
global.serverRunningSince = new Date();
global.serverRunningSince = new Date();

const buildSyncInitiate = async () => {
  await getResolverDatabaseIdFromMongoDB();
  utils.logThis(
    `GS1 DigitalLink Build Sync Server
     SYNC ID [${global.syncId}] 
     HOSTNAME [${process.env.BUILD_HOSTNAME}] `,
  );
  if (!global.buildRunningFlag) {
    await entropyWait();
    await buildSyncRun();
  }
  if (!process.env?.DOCKER_COMPOSE_RUN) {
    // We are NOT running under Docker Compose so can exit immediately
    utils.logThis('Gracefully Exit From Build-Sync-Server Cronjob');
    process.exit(0);
  }
};

const sleepForSeconds = async (seconds) => {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

const run = async () => {
  await buildSyncInitiate();
  if (process.env?.DOCKER_COMPOSE_RUN === 'Y') {
    // We are running under Docker Compose so can must wait for the interval time
    let sleepSecs = process.env?.DOCKER_RUN_INTERVAL_SECS;
    if (!sleepSecs) {
      sleepSecs = 60;
    }
    console.log(`Running under Docker Compose so will now wait for ${sleepSecs} seconds before stopping (and being restarted).`);
    await sleepForSeconds(sleepSecs);
    process.exit(0);
  }
};

run().then(() => console.log('Completed'));
