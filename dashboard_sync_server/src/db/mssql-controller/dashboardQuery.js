// eslint-disable-next-line import/no-unresolved
const sql = require('mssql');
const { makeSQLConnectionWithPS } = require('./sqlUtils');
const utils = require('../../resolverUtils');

/**
 * Executes the SQL stored procedure GET_URI_Responses to get all the URI responses for a given Entry ID
 * @param uriEntryId
 * @returns {Promise<null|*>}
 */
const getAuthAccountsSqlData = async () => {
  try {
    const ps = await makeSQLConnectionWithPS();
    await ps.prepare('EXEC [ADMIN_GET_Accounts]');
    const dbResult = await ps.execute();
    await ps.unprepare();
    return dbResult.recordset;
  } catch (err) {
    utils.logThis(`getAuthAccountsSqlData error: ${err}`);
    return null;
  }
};

const getGTINCountSqlData = async (issuerGLN) => {
  try {
    const ps = await makeSQLConnectionWithPS();
    ps.input('issuerGLN', sql.TYPES.NChar(13));
    await ps.prepare('EXEC [COUNT_URI_Entries_using_member_primary_gln] @issuerGLN');
    const queryResponse = await ps.execute({ issuerGLN });
    await ps.unprepare();
    utils.logThis('Get getGTINCountSqlData Using GLN from DB');
    return queryResponse.recordset;
  } catch (e) {
    utils.logThis(e.message);
  }
};

const getURIEntriesByGLN = async (issuerGLN) => {
  try {
    const ps = await makeSQLConnectionWithPS();
    ps.input('issuerGLN', sql.TYPES.NChar(13));
    await ps.prepare('EXEC [GET_URI_Entries_using_member_primary_gln] @issuerGLN');
    const queryResponse = await ps.execute({ issuerGLN });
    await ps.unprepare();
    utils.logThis('Get URIEntries by GLN (i.e issuerGLN) from DB');
    return queryResponse.recordset;
  } catch (e) {
    utils.logThis(e.message);
  }
};

const getGCPRedirectsByGLN = async (issuerGLN) => {
  try {
    const ps = await makeSQLConnectionWithPS();
    ps.input('issuerGLN', sql.TYPES.NChar(13));
    await ps.prepare('EXEC [GET_GCP_Redirects] @issuerGLN');
    const queryResponse = await ps.execute({ issuerGLN });
    await ps.unprepare();
    return queryResponse.recordset;
  } catch (e) {
    utils.logThis(e.message);
  }
};
const getURIEntriesCountByPage = async ({ issuerGLN, pageNumber, pageSize }) => {
  try {
    const ps = await makeSQLConnectionWithPS();
    ps.input('issuerGLN', sql.TYPES.NChar(13));
    ps.input('pageNumber', sql.TYPES.Int());
    ps.input('pageSize', sql.TYPES.Int());
    await ps.prepare('EXEC [GET_URI_Entries_using_member_primary_gln] @issuerGLN, @pageNumber, @pageSize');
    const queryResponse = await ps.execute({
      issuerGLN,
      pageNumber,
      pageSize,
    });
    await ps.unprepare();
    return queryResponse.recordset;
  } catch (error) {
    utils.logThis(error.message);
  }
};

const searchURIResponsesByURIEntryId = async (uriEntryId) => {
  try {
    const ps = await makeSQLConnectionWithPS();
    ps.input('uriEntryId', sql.TYPES.BigInt());
    await ps.prepare('EXEC [GET_URI_Responses] @uriEntryId');
    const queryResponse = await ps.execute({ uriEntryId });
    await ps.unprepare();
    return queryResponse.recordset;
  } catch (e) {
    utils.logThis('Error to getting URI Responses');
  }
};
module.exports = {
  getAuthAccountsSqlData,
  getGTINCountSqlData,
  searchURIResponsesByURIEntryId,
  getURIEntriesCountByPage,
  getURIEntriesByGLN,
  getGCPRedirectsByGLN,
};
