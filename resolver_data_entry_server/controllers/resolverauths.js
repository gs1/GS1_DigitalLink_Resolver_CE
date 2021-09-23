const utils = require('../bin/resolver_utils');
const validate = require('../bin/validate');
const asynchHandler = require('../middleware/asyncHandler');
const { getAccountList, addNewAccount, deleteAccount, getSyncServer, deleteSyncServer, runEndOfDaySQL } = require('../db/query-controller/resolver-auth');

const { ErrorResponse, BadRequestParameter } = require('../utils/custom-error');

/*
 * * getAccounts
 * * @desc   Get all Resolver Admin Accounts list
 * * @route  GET /admin/accounts
 * * @access Private
 * * @params required auth bearer token
 */
exports.getAccounts = asynchHandler(async (req, res, next) => {
  try {
    const resultArr = await getAccountList();
    if (!resultArr) {
      return next(new ErrorResponse('Account list not found', 404));
    }

    // Convert props in respect their API Format
    const convertedPropObj = await utils.convertPropsToAPIFormat(resultArr);
    res.status(200).json({
      success: true,
      count: convertedPropObj.length,
      data: convertedPropObj,
    });
  } catch (e) {
    utils.logThis('exports.getAccounts error:', e.toString());
    return next(new ErrorResponse('Server error getting list of resolver accounts', 500));
  }
});

/*
 * * postAccount
 * * @desc   Create new resolver admin account
 * * @route  POST /admin/accounts
 * * @access Private
 * * @params required auth bearer token, issuerGLN, accountName, authenticationKey
 */
exports.postAccount = asynchHandler(async (req, res, next) => {
  try {
    const reqParams = req.body;
    if (!Array.isArray(reqParams)) {
      return next(new BadRequestParameter('Bad request with parameters'));
    }

    for await (const accountDetail of reqParams) {
      const { issuerGLN, accountName, authenticationKey } = accountDetail;
      if (!(issuerGLN || accountName || authenticationKey)) {
        return next(new BadRequestParameter('Bad request with parameters'));
      }
      const accountAddStatus = await addNewAccount({
        issuerGLN,
        accountName,
        authenticationKey,
      });
      if (!accountAddStatus[0].SUCCESS) {
        return next(new ErrorResponse('Error when attempting to create new account', 500));
      }
    }
    res.status(200).json({
      success: true,
      data: reqParams,
    });
  } catch (e) {
    utils.logThis('exports.postAccount error:', e.toString());
    return next(new ErrorResponse('Server error creating resolver account', 500));
  }
});

/*
 * * deleteAccount
 * * @desc   Delete resolver admin account
 * * @route  DELETE /admin/accounts
 * * @access Private
 * * @params required auth bearer token, issuerGLN, accountName, authenticationKey
 */
exports.deleteAccount = asynchHandler(async (req, res, next) => {
  try {
    const reqParams = req.body;
    if (!Array.isArray(reqParams)) {
      return next(new BadRequestParameter('Bad request with parameters'));
    }

    for await (const accountDetail of reqParams) {
      const { issuerGLN, accountName, authenticationKey } = accountDetail;
      if (!(issuerGLN || accountName || authenticationKey)) {
        return next(new BadRequestParameter('Bad request with parameters'));
      }
      const accountDeleteStatus = await deleteAccount({
        issuerGLN,
        accountName,
        authenticationKey,
      });
      if (!accountDeleteStatus[0].SUCCESS) {
        return next(new ErrorResponse('Error to delete resolver account', 500));
      }
    }
    res.status(200).json({
      success: true,
      data: reqParams,
    });
  } catch (e) {
    utils.logThis('exports.deleteAccount error:', e.toString());
    return next(new ErrorResponse('Server error deleting resolver account', 500));
  }
});

/**
 * * getHeardBuildSyncServer
 * * @desc   Lists the Build servers that are synchronising with the SQL database
 * * @route  GET /admin/heardbuildsyncservers
 * * @access Private
 * * @params required auth bearer token
 */
exports.getHeardBuildSyncServer = asynchHandler(async (req, res, next) => {
  try {
    const resultArr = await getSyncServer();
    if (!resultArr) {
      return next(new ErrorResponse('Sync Server list not found', 404));
    }

    // Convert props in respect their API Format
    const convertedPropObj = await utils.convertPropsToAPIFormat(resultArr);
    res.status(200).json({
      success: true,
      count: convertedPropObj.length,
      data: convertedPropObj,
    });
  } catch (e) {
    utils.logThis('exports.getHeardBuildSyncServer error:', e.toString());
    return next(new ErrorResponse('Server error fetching Sync Server list', 500));
  }
});

/**
 * * deleteHeardBuildSyncServer
 * * @desc   Deletes a Build Sync Server from the Sync Registry. If it is still running, that server will be forced to perform a full rebuild            of its local database.
 * * @route  DELETE /admin/deleteHeardBuildSyncServer
 * * @access Private
 * * @params required auth bearer token, syncServerId
 */
exports.deleteHeardBuildSyncServer = asynchHandler(async (req, res, next) => {
  try {
    const { syncServerId } = req.params;
    const serverDeleteStatus = await deleteSyncServer(syncServerId);
    if (!serverDeleteStatus) {
      return next(new ErrorResponse('Server error to delete buildSyncServerId', 500));
    }
    res.status(200).json({
      success: serverDeleteStatus[0].SUCCESS,
    });
  } catch (e) {
    utils.logThis('exports.deleteHeardBuildSyncServer error:', e.toString());
    return next(new ErrorResponse('Server error to delete buildSyncServerId', 500));
  }
});

// API controller to run end of the day
exports.runEndOFDay = asynchHandler(async (req, res, next) => {
  try {
    const success = await runEndOfDaySQL();
    if (!success) {
      return next(new ErrorResponse('Error to run End of Day', 500));
    }
    res.status(200).json({
      success: true,
      message: 'End of day processing started',
    });
  } catch (e) {
    utils.logThis('exports.runEndOFDay error:', e.toString());
    return next(new ErrorResponse('End of day processing failed to start', 500));
  }
});

// LR validation
exports.licenceRegistry = asynchHandler(async (req, res, next) => {
  try {
    const { gln, type, key } = req.params;
    const result = await validate.validateKeyEntry(gln, type, key);
    if (!result) {
      return next(new ErrorResponse('LR Validation fails ', 500));
    }
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (e) {
    utils.logThis('exports.licenceRegistry error:', e.toString());
    return next(new ErrorResponse('LR Validation fails ', 500));
  }
});

/**
 * This API call is used by a Kubernetes Live Probe. The header is set in resolver-data-entry-server.yaml
 * and is created simply to stop anything else trying to run this healthcheck
 */
exports.processKBSHealthCheck = asynchHandler(async (req, res, next) => {
  try {
    const resultArr = await getSyncServer();
    if (!resultArr) {
      return next(new ErrorResponse('Error to live health check', 500));
    }

    res.status(200).json({
      success: true,
    });
  } catch (e) {
    utils.logThis('exports.processKBSHealthCheck error:', e.toString());
    return next(new ErrorResponse('Error to live health check', 500));
  }
});
