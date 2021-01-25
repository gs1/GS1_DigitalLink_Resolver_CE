/* eslint-disable new-cap */
/**
 * sqldb.js provides the complete interface to Resolver's SQL Server database. All SQL entries are requested via this file.
 * As a result, any desired database brand change from Microsoft SQL Server requires alterations only to this file.
 */
// eslint-disable-next-line import/no-unresolved
const sql = require('mssql');
const utils = require('./resolverUtils');

let sqlConn;

/**
 * Gets ths server config connection details from environment variables provided in the Dockerfile
 * @type {{server: string, password: string, database: string, options: {encrypt: boolean, enableArithAbort: boolean}, user: string}}
 */

const global_sqlServerConfig = {
  user: process.env.SQLDBCONN_USER,
  password: process.env.SQLDBCONN_PASSWORD,
  server: process.env.SQLDBCONN_SERVER,
  database: process.env.SQLDBCONN_DB,
  options: {
    encrypt: true,
    enableArithAbort: true,
  },
};

let global_connectedToSQLServerFlag = false;

/**
 * If the SQL Server disconnects, this triggers an 'end' event which is captured here
 * to set a flag appropriately.
 */
sql.on('end', () => {
  global_connectedToSQLServerFlag = false;
  utils.logThis('SQL DB disconnected');
});

/**
 * Connects to the Microsoft SQL Server database storing Resolver's data entry record
 * @returns {Promise<void>}
 */
const connectToSQLServerDB = async () => {
  if (!global_connectedToSQLServerFlag) {
    try {
      sqlConn = new sql.ConnectionPool(global_sqlServerConfig);
      await sqlConn.connect();
      global_connectedToSQLServerFlag = true;
    } catch (error) {
      utils.logThis(`connectToSQLServerDB Error: ${error}`);
      global_connectedToSQLServerFlag = false;
    }
  }
};

const closeDB = async () => {
  if (global_connectedToSQLServerFlag) {
    await sqlConn.close();
  }
  global_connectedToSQLServerFlag = false;
};

/**
 * Executes the SQL stored procedure BUILD_Get_Changed_URI_Entries to get the next batch of URI entries from a given Sync ID.
 * Forces batch size to be no bigger than 1000 entries
 * @param lastHeardDateTime
 * @param lowestUriEntryId
 * @param maxRowsToReturn
 * @returns {Promise<*>}
 */
const getURIEntries = async (lastHeardDateTime, lowestUriEntryId, maxRowsToReturn) => {
  try {
    if (maxRowsToReturn > 1000) {
      maxRowsToReturn = 1000;
    }

    await connectToSQLServerDB();
    if (global_connectedToSQLServerFlag) {
      const ps = new sql.PreparedStatement(sqlConn);
      ps.input('lastHeardDateTime', sql.TYPES.NVarChar(30));
      ps.input('lowestUriEntryId', sql.TYPES.BigInt());
      ps.input('maxRowsToReturn', sql.TYPES.Int());

      await ps.prepare('EXEC [BUILD_Get_URI_Entries] @lastHeardDateTime, @lowestUriEntryId, @maxRowsToReturn');
      const dbResult = await ps.execute({ lastHeardDateTime, lowestUriEntryId, maxRowsToReturn });
      await ps.unprepare();
      return decodeSQLSafeResolverArray(dbResult.recordset);
    }
    return null;
  } catch (err) {
    utils.logThis(`getURIEntries error: ${err}`);
    return null;
  }
};

/**
 * Executes the SQL stored procedure BUILD_Get_GCP_Redirects to get the next batch of URI entries from a given GCP Redirect Id.
 * The batch size returned is limited to a maximum of 1000 entries.
 * @param lastHeardDateTime
 * @param lowestGCPRedirectId
 * @param maxRowsToReturn
 * @returns {Promise<null|*>}
 */
const getGCPRedirects = async (lastHeardDateTime, lowestGCPRedirectId, maxRowsToReturn) => {
  try {
    await connectToSQLServerDB();
    if (global_connectedToSQLServerFlag) {
      const ps = new sql.PreparedStatement(sqlConn);
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
    }
    return null;
  } catch (err) {
    utils.logThis(`getGCPRedirects error: ${err}`);
    return null;
  }
};

/**
 * Executes the SQL stored procedure GET_URI_Responses to get all the URI responses for a given Entry ID
 * @param uriEntryId
 * @returns {Promise<null|*>}
 */
const getURIResponses = async (uriEntryId) => {
  try {
    await connectToSQLServerDB();
    if (global_connectedToSQLServerFlag) {
      const ps = new sql.PreparedStatement(sqlConn);
      ps.input('uriEntryId', sql.TYPES.BigInt());

      await ps.prepare('EXEC [GET_URI_Responses] @uriEntryId');
      const dbResult = await ps.execute({ uriEntryId });
      await ps.unprepare();
      return decodeSQLSafeResolverArray(dbResult.recordset);
    }
    return null;
  } catch (err) {
    utils.logThis(`getURIResponses error: ${err}`);
    return null;
  }
};

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
    await connectToSQLServerDB();
    if (global_connectedToSQLServerFlag) {
      const ps = new sql.PreparedStatement(sqlConn);
      ps.input('syncId', sql.TYPES.NChar(12));
      ps.input('hostName', sql.TYPES.NVarChar(100));

      await ps.prepare('EXEC [BUILD_Register_Sync_Server] @syncId, @hostName');
      const dbResult = await ps.execute({ syncId, hostName });
      await ps.unprepare();
      return dbResult.recordset;
    }
    return null;
  } catch (err) {
    utils.logThis(`registerSyncServer error: ${err}`);
    return null;
  }
};

/**
 * SQL Safe to Text Decodes an array of objects (see decodeSQLSafeResolverObject() javadoc)
 * @param rrArray
 * @returns {*}
 */
const decodeSQLSafeResolverArray = (rrArray) => {
  if (Array.isArray(rrArray)) {
    for (let i = 0; i < rrArray.length; i += 1) {
      rrArray[i] = decodeSQLSafeResolverObject(rrArray[i]);
    }
  }
  return rrArray;
};

/**
 * Restores 'SQL Safe' string properties  back to the original string from Base64
 * if it is prefixed with the double-character '[]' symbol.
 * In addition, any string property is 'cleaned' of disallowed characters
 * @param rrObj
 * @returns {*}
 */
const decodeSQLSafeResolverObject = (rrObj) => {
  const keys = Object.keys(rrObj);
  for (const thisKey of keys) {
    if (typeof rrObj[thisKey] === 'string') {
      if (rrObj[thisKey].startsWith('[]')) {
        const buff = new Buffer.from(rrObj[thisKey].substring(2), 'base64');
        rrObj[thisKey] = buff.toString('utf8');
      }

      // Clean the string value
      rrObj[thisKey] = rrObj[thisKey].replace('\n', '').replace('\r', '').replace("'", '').trim();
    }
  }
  return rrObj;
};

const getURIEntriesUsingIdentificationKeyValue = async (identificationKeyType, identificationKey) => {
  try {
    await connectToSQLServerDB();
    if (global_connectedToSQLServerFlag) {
      const ps = new sql.PreparedStatement(sqlConn);
      ps.input('identificationKeyType', sql.TYPES.NVarChar(20));
      ps.input('identificationKey', sql.TYPES.NVarChar(45));

      await ps.prepare('EXEC [BUILD_GET_URI_Entries_using_identification_key] @identificationKeyType, @identificationKey');
      const dbResult = await ps.execute({ identificationKeyType, identificationKey });
      await ps.unprepare();
      return decodeSQLSafeResolverArray(dbResult.recordset);
    }
    return null;
  } catch (err) {
    utils.logThis(`getURIEntriesUsingIdentificationKeyValue error for /${identificationKeyType}/${identificationKey} : ${err}`);
    return null;
  }
};

module.exports = {
  registerSyncServer,
  getURIResponses,
  getURIEntries,
  getGCPRedirects,
  getURIEntriesUsingIdentificationKeyValue,
  closeDB,
};
