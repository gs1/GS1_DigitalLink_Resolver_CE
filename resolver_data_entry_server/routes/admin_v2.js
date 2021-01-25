const express = require('express');
const { adminAuthOK, adminKBSAuth } = require('../middleware/auth');
const {
  getAccounts,
  postAccount,
  deleteAccount,
  getHeardBuildSyncServer,
  deleteHeardBuildSyncServer,
  runEndOFDay,
  licenceRegistry,
  processKBSHealthCheck,
} = require('../controllers/resolverauths');

const router = express.Router();

// Router for accounts REST API Endpoints
router.route('/accounts').get(adminAuthOK, getAccounts).post(adminAuthOK, postAccount).delete(adminAuthOK, deleteAccount);

// Router configuration for Heard Build Sync Server
router.route('/heardbuildsyncservers').get(adminAuthOK, getHeardBuildSyncServer);
router.route('/heardbuildsyncserver/:syncServerId').delete(adminAuthOK, deleteHeardBuildSyncServer);

// Router configuration for Run of the day
router.route('/runendofday').get(adminAuthOK, runEndOFDay);

// Router configuratio for lincence Registry validate
router.route('/lr/:gln/:type/:key').get(adminAuthOK, licenceRegistry);

/**
 * This API call is used by a Kubernetes Live Probe. The header is set in resolver-data-entry-server.yaml
 * and is created simply to stop anything else trying to run this healthcheck
 */
router.route('/healthcheck_livenessprobe').get(adminKBSAuth, processKBSHealthCheck);

module.exports = router;
