// eslint-disable-next-line import/no-unresolved
const sql = require('mssql');
const { makeSQLConnectionWithPS } = require('./sqlUtils');
const utils = require('../../resolverUtils');

/**
 * Executes the SQL stored procedure BUILD_Get_Changed_URI_Entries to get the next batch of URI entries from a given Sync ID.
 * Forces batch size to be no bigger than 1000 entries
 * @param lastHeardDateTime
 * @param lowestUriEntryId
 * @param maxRowsToReturn
 * @returns {Promise<*>}
 */
const getURIEntriesSQLData = async (lastHeardDateTime, lowestUriEntryId, maxRowsToReturn) => {
  try {
    if (maxRowsToReturn > 1000) {
      maxRowsToReturn = 1000;
    }
    const ps = await makeSQLConnectionWithPS();
    ps.input('lastHeardDateTime', sql.TYPES.NVarChar(30));
    ps.input('lowestUriEntryId', sql.TYPES.BigInt());
    ps.input('maxRowsToReturn', sql.TYPES.Int());

    await ps.prepare('EXEC [BUILD_Get_URI_Entries] @lastHeardDateTime, @lowestUriEntryId, @maxRowsToReturn');
    const dbResult = await ps.execute({ lastHeardDateTime, lowestUriEntryId, maxRowsToReturn });
    await ps.unprepare();
    return dbResult.recordset;
  } catch (err) {
    utils.logThis(`getURIEntriesSQLData error: ${err}`);
    return null;
  }
};

/**
 * Executes the SQL stored procedure GET_URI_Responses to get all the URI responses for a given Entry ID
 * @param uriEntryId
 * @returns {Promise<null|*>}
 */
const getURIResponsesSQLData = async (uriEntryId) => {
  try {
    const ps = await makeSQLConnectionWithPS();
    ps.input('uriEntryId', sql.TYPES.BigInt());
    await ps.prepare('EXEC [GET_URI_Responses] @uriEntryId');
    const dbResult = await ps.execute({ uriEntryId });
    await ps.unprepare();
    return dbResult.recordset;
  } catch (err) {
    utils.logThis(`getURIResponses error: ${err}`);
    return null;
  }
};
module.exports = {
  getURIEntriesSQLData,
  getURIResponsesSQLData,
};
