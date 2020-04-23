/**
 * sqldb.js provides the complete interface to Resolver's SQL Server database. All SQL requests are requested via this file.
 * As a result, any desired database brand change from Microsoft SQL Server requires alterations only to this file.
 */

const sql = require('mssql');
const utils = require("./resolver_utils");
let sqlConn;

/**
 * Gets ths server config connection details from environment variables provided in the Dockerfile
 * @type {{server: string, password: string, database: string, options: {encrypt: boolean, enableArithAbort: boolean}, user: string}}
 */


const sqlServerConfig = {
    user: process.env.SQLDBCONN_USER,
    password: process.env.SQLDBCONN_PASSWORD,
    server: process.env.SQLDBCONN_SERVER,
    database: process.env.SQLDBCONN_DB,
    options:
        {
            encrypt: true,
            enableArithAbort: true
        }
};

/*
const sqlServerConfig = {
    user: "Res-SQLAdm1n",
    password: "Jf95-5!bPlN98q1",
    server: "gs1-eu1-pd-resolver-sqlsrv01.database.windows.net",
    database: "gs1-eu1-pd-resolver-db01",
    options:
        {
            encrypt: true,
            enableArithAbort: true
        }
};

*/

let connectedToSQLServerFlag = false;

/**
 * If the SQL Server disconnects, this triggers an 'end' event which is captured here
 * to set a flag appropriately.
 */
sql.on('end', (() =>
{
    connectedToSQLServerFlag = false;
    utils.logThis("SQL DB disconnected");
}));


/**
 * Connects to the Microsoft SQL Server database storing Resolver's data entry record
 * @returns {Promise<boolean>}
 */
const connectToSQLServerDB = async () =>
{
    if(!connectedToSQLServerFlag)
    {
        try
        {
            utils.logThis("Connecting to SQL DB");
            sqlConn = new sql.ConnectionPool(sqlServerConfig);
            await sqlConn.connect();
            utils.logThis("Connected to SQLServer DB successfully");
            connectedToSQLServerFlag = true;

        }
        catch (error)
        {
            utils.logThis(`connectToSQLServerDB Error: ${error}`);
            connectedToSQLServerFlag = false;
        }
    }
    return connectedToSQLServerFlag;
};


const closeDB = async () =>
{
    if(connectedToSQLServerFlag)
    {
        await sqlConn.close();
    }
    connectedToSQLServerFlag = false;
};


/**
 * Executes the SQL stored procedure BUILD_Get_Changed_URI_Requests to get the next batch of URI entries from a given Sync ID.
 * Forces batch size to be no bigger than 1000 entries
 * @param lastHeardDateTime
 * @param lowestUriRequestId
 * @param maxRowsToReturn
 * @returns {Promise<*>}
 */
const getURIRequests = async (lastHeardDateTime, lowestUriRequestId, maxRowsToReturn) =>
{
    try
    {
        if(maxRowsToReturn > 1000)
        {
            maxRowsToReturn = 1000;
        }

        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('lastHeardDateTime', sql.TYPES.NVarChar(30));
        ps.input('lowestUriRequestId', sql.TYPES.BigInt());
        ps.input('maxRowsToReturn', sql.TYPES.Int());

        await ps.prepare('EXEC [BUILD_Get_URI_Requests] @lastHeardDateTime, @lowestUriRequestId, @maxRowsToReturn');
        const dbResult = await ps.execute({ lastHeardDateTime, lowestUriRequestId, maxRowsToReturn });
        await ps.unprepare();
        return decodeSQLSafeResolverArray(dbResult.recordset);

    }
    catch (err)
    {
        utils.logThis(`getURIRequests error: ${err}`);
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
const getGCPRedirects = async (lastHeardDateTime, lowestGCPRedirectId, maxRowsToReturn) =>
{
    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('lastHeardDateTime', sql.TYPES.NVarChar(30));
        ps.input('lowestGCPRedirectId', sql.TYPES.BigInt());
        ps.input('maxRowsToReturn', sql.TYPES.Int());

        if(maxRowsToReturn > 1000)
        {
            maxRowsToReturn = 1000;
        }

        await ps.prepare('EXEC [BUILD_Get_GCP_Redirects] @lastHeardDateTime, @lowestGCPRedirectId, @maxRowsToReturn');
        const dbResult = await ps.execute({ lastHeardDateTime, lowestGCPRedirectId,  maxRowsToReturn });
        await ps.unprepare();
        return dbResult.recordset;
    }
    catch (err)
    {
        utils.logThis(`getGCPRedirects error: ${err}`);
        return null;
    }
};


/**
 * Executes the SQL stored procedure GET_URI_Responses to get all the URI responses for a given Request ID
 * @param uriRequestId
 * @returns {Promise<null|*>}
 */
const getURIResponses = async (uriRequestId) =>
{
    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('uriRequestId', sql.TYPES.BigInt());

        await ps.prepare('EXEC [GET_URI_Responses] @uriRequestId');
        const dbResult = await ps.execute({ uriRequestId });
        await ps.unprepare();
        return decodeSQLSafeResolverArray(dbResult.recordset);
    }
    catch (err)
    {
        utils.logThis(`getURIResponses error: ${err}`);
        return null;
    }
};


/**
 * Registers this BUILD server with SQL DB using its hostname as its unique identifier.
 * The hostname is a randomly-generated 12-char string created by the Docker-Engine or Kubernetes runtime.
 * Only the first 12 characters are used in any case so the host must be unique within that limit if
 * manually created.
 * @param hostName
 * @returns {Promise<*>}
 */
const registerSyncServer = async (hostName) =>
{
    if(hostName.length > 12)
    {
        hostName = hostName.substring(0, 12);
    }

    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('hostName', sql.TYPES.NChar(12));

        await ps.prepare('EXEC [BUILD_Register_Sync_Server] @hostName');
        const dbResult = await ps.execute({ hostName });
        await ps.unprepare();
        return dbResult.recordset;
    }
    catch (err)
    {
        utils.logThis(`registerSyncServer error: ${err}`);
        return null;
    }
};


/**
 * SQL Safe to Text Decodes an array of objects (see decodeSQLSafeResolverObject() javadoc)
 * @param rrArray
 * @returns {*}
 */
const decodeSQLSafeResolverArray = (rrArray) =>
{
    if (rrArray.length !== undefined)
    {
        for (let rrElement of rrArray)
        {
            rrElement = decodeSQLSafeResolverObject(rrElement);
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
const decodeSQLSafeResolverObject = (rrObj) =>
{
    let keys = Object.keys(rrObj);
    for(let thisKey of keys)
    {
        if(typeof rrObj[thisKey] === "string")
        {
            if(rrObj[thisKey].startsWith("[]"))
            {
                let buff = new Buffer.from(rrObj[thisKey].substring(2), 'base64');
                rrObj[thisKey] = buff.toString('utf8');
            }

            //Clean the string value
            rrObj[thisKey] = rrObj[thisKey].replace("\n", "").replace("\r", "").replace("'", "").trim();
        }
    }
    return rrObj;
};


const getURIRequestsForGS1KeyCodeAndValue = async (gs1KeyCode, gs1KeyValue) =>
{
    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('gs1KeyCode', sql.TYPES.NVarChar(20));
        ps.input('gs1KeyValue', sql.TYPES.NVarChar(45));

        await ps.prepare('EXEC [BUILD_GET_URI_Requests_using_gs1_key_code_and_value] @gs1KeyCode, @gs1KeyValue');
        const dbResult = await ps.execute({ gs1KeyCode, gs1KeyValue });
        await ps.unprepare();
        return decodeSQLSafeResolverArray(dbResult.recordset);
    }
    catch (err)
    {
        utils.logThis(`getURIRequestsForGS1KeyCodeAndValue error for /${gs1KeyCode}/${gs1KeyValue} : ${err}`);
        return null;
    }
};



module.exports = {
    registerSyncServer,
    getURIResponses,
    getURIRequests,
    getGCPRedirects,
    getURIRequestsForGS1KeyCodeAndValue,
    closeDB
};
