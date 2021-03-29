// eslint-disable-next-line import/no-unresolved
const sql = require('mssql');
const { makeSQLConnectionWithPS } = require('./sqlUtils');
const utils = require('../../resolverUtils');
/**
 * Registers this BUILD server with SQL DB using its hostname as its unique identifier.
 * The hostname is a randomly-generated 12-char string created by the Docker-Engine or Kubernetes runtime.
 * Only the first 12 characters are used in any case so the host must be unique within that limit if
 * manually created.
 * @param syncId
 * @param hostName
 * @returns {Promise<*>}
 */
const registerSyncServer = async (syncId, hostName) => {
  if (syncId.length > 12) {
    syncId = syncId.substring(0, 12);
  }
  try {
    const ps = await makeSQLConnectionWithPS();
    ps.input('syncId', sql.TYPES.NChar(12));
    ps.input('hostName', sql.TYPES.NVarChar(100));
    await ps.prepare('EXEC [BUILD_Register_Sync_Server] @syncId, @hostName');
    const dbResult = await ps.execute({ syncId, hostName });
    await ps.unprepare();
    return dbResult.recordset;
  } catch (err) {
    utils.logThis('Error in registerSyncServer method of mssql-controller');
    utils.logThis(err);
    return null;
  }
};
module.exports = {
  registerSyncServer,
};
