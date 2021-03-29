/**
 * upload.js is the 'startup' file for Node. It runs continuously as a simple HTTP server used principally by Docker Engine
 * to test its Health (see Dockerfile), although it also has a "/build" command if, in the future, an externally-triggered
 * BUILD is required. Otherwise, BUILD is executed regular by an interval timer set at the bottom of this file.
 */
// eslint-disable-next-line import/no-unresolved
const express = require('express');
const utils = require('./resolverUtils');
const { getResolverDatabaseIdFromMongoDB } = require('./db/mongo-controller/resolverDBOps');
const entropyWait = require('./controllers/entropyWait');
const buildSyncRun = require('./controllers/buildSyncController');
const buildSynDashboardRun = require('./controllers/buildDashboardController');

const app = express();
const PORT = process.env.PORT || 80;
const buildSecs = process.env.BUILD_INTERVAL_SECONDS || 10;
const buildDashboardSecs = +process.env.BUILD_DASHBOARD_INTERVAL_SECONDS || 60;
const processIntervalMilliSeconds = buildSecs * 1000;
const processDashboardIntervalMilliSeconds = buildDashboardSecs * 1000;
const buildMaxEntropySecs = process.env.BUILD_MAX_ENTROPY_SECONDS || 10;

global.buildRunningFlag = false;
global.buildRunningSince = new Date();
global.serverRunningSince = new Date();
global.serverRunningSince = new Date();

app.listen(PORT, async (err) => {
  if (err) {
    return utils.logThis(
      `GS1 DigitalLink Build Sync Server SYNC ID [${global.syncId}] 
    HOSTNAME [${process.env.HOSTNAME}] listen error:`,
      err,
    );
  }
  await getResolverDatabaseIdFromMongoDB();

  utils.logThis(
    `GS1 DigitalLink Build Sync Server
     SYNC ID [${global.syncId}] 
     HOSTNAME [${process.env.HOSTNAME}] 
     Listening on port ${PORT}
     Build event interval every ${buildSecs} + max entropy ${buildMaxEntropySecs} seconds`,
  );
});

/**
 * This important function runs the BUILD process at regular intervals defined in the processIntervalMilliSeconds and
 * buildMaxEntropySecs variables.
 */
setInterval(async () => {
  if (!global.buildRunningFlag) {
    await entropyWait();
    await buildSyncRun();
  }
}, processIntervalMilliSeconds);

/**
 * This important function runs the BUILD process at regular 24 hrs intervals defined in the processDashboardIntervalMilliSeconds
 */
setInterval(async () => {
  utils.logThis(`processDashboardIntervalMilliSeconds is executed for dashboard collection sync after every ${processDashboardIntervalMilliSeconds} seconds`);
  await buildSynDashboardRun();
}, processDashboardIntervalMilliSeconds);

/**
 * These functions exist to shut down the service gracefully when a SIGTERM from Docker Engine or K8s is received.
 */
const serverShutDown = async () => {
  console.info('Shutdown completed');
  process.exit(0);
};

process.on('SIGTERM', async () => serverShutDown());

process.on('unhandledRejection', (err) => {
  utils.logThis('Unhandled rejection at build sync server');
  utils.logThis(err);
});
