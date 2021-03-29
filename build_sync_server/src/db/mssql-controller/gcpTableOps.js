// eslint-disable-next-line import/no-unresolved
const sql = require('mssql');
const { makeSQLConnectionWithPS } = require('./sqlUtils');
const utils = require('../../resolverUtils');

/**
 * Executes the SQL stored procedure BUILD_Get_GCP_Redirects to get the next batch of URI entries from a given GCP Redirect Id.
 * The batch size returned is limited to a maximum of 1000 entries.
 * @param lastHeardDateTime
 * @param lowestGCPRedirectId
 * @param maxRowsToReturn
 * @returns {Promise<null|*>}
 */
const getGCPRedirectsSQLData = async (lastHeardDateTime, lowestGCPRedirectId, maxRowsToReturn) => {
  try {
    const ps = await makeSQLConnectionWithPS();
    ps.input('lastHeardDateTime', sql.TYPES.NVarChar(30));
    ps.input('lowestGCPRedirectId', sql.TYPES.BigInt());
    ps.input('maxRowsToReturn', sql.TYPES.Int());

    if (maxRowsToReturn > 1000) {
      maxRowsToReturn = 1000;
    }

    await ps.prepare('EXEC [BUILD_Get_GCP_Redirects] @lastHeardDateTime, @lowestGCPRedirectId, @maxRowsToReturn');
    const dbResult = await ps.execute({ lastHeardDateTime, lowestGCPRedirectId, maxRowsToReturn });
    await ps.unprepare();
    return dbResult.recordset;
  } catch (err) {
    utils.logThis('Error getGCPRedirectsSQLData method of gcpTableOPs');
    utils.logThis(err);
    return null;
  }
};

module.exports = {
  getGCPRedirectsSQLData,
};
