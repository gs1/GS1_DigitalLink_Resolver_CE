const sql = require('mssql');
const { makeDBConnectionAndPS } = require('../dbUtils');
const utils = require('../../bin/resolver_utils');

// function for getting all list of account details (ResolverAuth)
const getAccountList = async () => {
  try {
    const ps = await makeDBConnectionAndPS();
    await ps.prepare('EXEC [ADMIN_GET_Accounts]');
    const queryResponse = await ps.execute({});
    utils.logThis('Successfully fetch account list from DB');
    await ps.unprepare();

    return queryResponse.recordset;
  } catch (error) {
    utils.logThis('Error to connect DB for getting account list');
  }
};

// For query to insert or create new resolver auth account
const addNewAccount = async ({ issuerGLN, accountName, authenticationKey }) => {
  try {
    const ps = await makeDBConnectionAndPS();
    ps.input('issuerGLN', sql.TYPES.NChar(13));
    ps.input('accountName', sql.TYPES.NVarChar(255));
    ps.input('authenticationKey', sql.TYPES.NVarChar(64));
    await ps.prepare('EXEC [ADMIN_UPSERT_Account] @issuerGLN, @accountName, @authenticationKey');
    const queryResponse = await ps.execute({
      issuerGLN,
      accountName,
      authenticationKey,
    });
    utils.logThis('New resolver auth account is created ');
    await ps.unprepare();
    return queryResponse.recordset;
  } catch (error) {
    utils.logThis('Error to connect DB for add new account');
  }
};
// For query to delete resolver auth account
const deleteAccount = async ({ issuerGLN, accountName, authenticationKey }) => {
  try {
    const ps = await makeDBConnectionAndPS();
    ps.input('issuerGLN', sql.TYPES.NChar(13));
    ps.input('accountName', sql.TYPES.NVarChar(255));
    ps.input('authenticationKey', sql.TYPES.NVarChar(64));

    await ps.prepare('EXEC [ADMIN_DELETE_Account] @issuerGLN, @accountName, @authenticationKey');
    const queryResponse = await ps.execute({
      issuerGLN,
      accountName,
      authenticationKey,
    });
    utils.logThis('Resolver auth account is deleted ');
    await ps.unprepare();
    return queryResponse.recordset;
  } catch (error) {
    utils.logThis('Error to connect db for delete account');
  }
};

// For query  to list of heardBuildSyncServer
const getSyncServer = async () => {
  try {
    const ps = await makeDBConnectionAndPS();
    await ps.prepare('EXEC [ADMIN_GET_Heard_Build_Servers]');
    const queryResponse = await ps.execute({});
    await ps.unprepare();
    utils.logThis('Get list of Heard Build Sync Server from DB');
    return queryResponse.recordset;
  } catch (e) {
    utils.logThis('Error to connect DB for get list of buildSyncServer');
    utils.logThis(e.message);
  }
};

// DB Query for delete build sync server
const deleteSyncServer = async (syncServerId) => {
  try {
    const ps = await makeDBConnectionAndPS();
    ps.input('syncServerId', sql.TYPES.NChar(13));
    await ps.prepare('EXEC [ADMIN_DELETE_Build_Server_From_Sync_Register] @syncServerId');
    const queryResponse = await ps.execute({ syncServerId });
    await ps.unprepare();
    return queryResponse.recordset;
  } catch (e) {
    utils.logThis('Error to connect DB for deletion of ServerSyncID');
    utils.logThis(e.message);
  }
};

// DB query to run end of day stored procedure
const runEndOfDaySQL = async () => {
  try {
    const ps = await makeDBConnectionAndPS();
    await ps.prepare('EXEC [END_OF_DAY]');
    utils.logThis('runEndOfDaySQL - Running End Of Day');
    await ps.execute({});
    await ps.unprepare();
    utils.logThis('runEndOfDaySQL - End Of Day Completed');
    return true;
  } catch (e) {
    utils.logThis('runEndOfDaySQL error');
    utils.logThis(e.message);
    return false;
  }
};

// DB query to r

module.exports = {
  getAccountList,
  addNewAccount,
  deleteAccount,
  getSyncServer,
  deleteSyncServer,
  runEndOfDaySQL,
};
