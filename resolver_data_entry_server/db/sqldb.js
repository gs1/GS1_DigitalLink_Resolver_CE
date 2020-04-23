/**
 * sqldb.js provides the complete interface to Resolver's SQL Server database. All SQL requests are requested via this file.
 * As a result, any desired database brand change from Microsoft SQL Server requires alterations only to this file.
 */
const sql = require('mssql');
const utils = require("../bin/resolver_utils");
const HttpStatus = require('http-status-codes');
let sqlConn;

/**
 * Gets the server config connection details from environment variables provided in the Dockerfile
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


/**
 * Closes the DB connection
 * @returns {Promise<void>}
 */
const closeDB = async () =>
{
    if(connectedToSQLServerFlag)
    {
        await sqlConn.close();
    }
    connectedToSQLServerFlag = false;
};


/**
 * Reads a Resolver request from the database
 * @param uriRequestId
 * @param memberPrimaryGLN
 * @returns {Promise<null|*>}
 */
const readURIRequest = async (uriRequestId, memberPrimaryGLN) =>
{
    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('uriRequestId', sql.TYPES.BigInt());
        ps.input('memberPrimaryGLN', sql.TYPES.NChar(13));

        await ps.prepare('EXEC [READ_URI_Request] @uriRequestId, @memberPrimaryGLN');
        const dbResult = await ps.execute({ uriRequestId: uriRequestId, memberPrimaryGLN: memberPrimaryGLN });
        await ps.unprepare();
        return decodeSQLSafeResolverArray(dbResult.recordset);
    }
    catch (err)
    {
        utils.logThis(`readURIRequest error: ${err}`);
        return null;
    }
};


/**
 * Reads a Resolver Response from the database
 * @param uriResponseId
 * @returns {Promise<null|*>}
 */
const readURIResponse = async (uriResponseId) =>
{
    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('uriResponseId', sql.TYPES.BigInt());

        await ps.prepare('EXEC [READ_URI_Response] @uriResponseId');
        const dbResult = await ps.execute({ uriResponseId: uriResponseId });
        await ps.unprepare();
        return decodeSQLSafeResolverArray(dbResult.recordset);
    }
    catch (err)
    {
        utils.logThis(`readURIResponse error: ${err}`);
        return null;
    }
};


/**
 * Locates all the URI Responses for a five Resolver Request Id
 * @param uriRequestId
 * @returns {Promise<null|*>}
 */
const searchURIResponses = async (uriRequestId) =>
{
    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('uriRequestId', sql.TYPES.BigInt());

        await ps.prepare('EXEC [GET_URI_Responses] @uriRequestId');
        const dbResult = await ps.execute({ uriRequestId: uriRequestId });
        await ps.unprepare();
        return decodeSQLSafeResolverArray(dbResult.recordset);
    }
    catch (err)
    {
        utils.logThis(`searchURIResponses error: ${err}`);
        return null;
    }
};


/**
 * Searches for Resolver Requests with the given memberPrimaryGLN, gs1KeyCode, gs1KeyValue
 * @param memberPrimaryGLN
 * @param gs1KeyCode
 * @param gs1KeyValue
 * @returns {Promise<null|*>}
 */
const searchURIRequestsByGS1Key = async (memberPrimaryGLN, gs1KeyCode, gs1KeyValue) =>
{
    try
    {
        const officialDef = utils.getGS1DigitalLinkToolkitDefinition(gs1KeyCode, gs1KeyValue);

        if (officialDef.SUCCESS)
        {
            await connectToSQLServerDB();
            const ps = new sql.PreparedStatement(sqlConn);
            ps.input('gs1KeyCode', sql.TYPES.NVarChar(20));
            ps.input('gs1KeyValue', sql.TYPES.NVarChar(45));
            ps.input('memberPrimaryGLN', sql.TYPES.NChar(13));

            await ps.prepare('EXEC [GET_URI_Requests_using_gln_and_gs1_key_code_and_value] @gs1KeyCode, @gs1KeyValue, @memberPrimaryGLN');
            const dbResult = await ps.execute({
                memberPrimaryGLN,
                gs1KeyCode: officialDef.gs1KeyCode,
                gs1KeyValue: officialDef.gs1KeyValue
            });
            await ps.unprepare();
            return decodeSQLSafeResolverArray(dbResult.recordset);
        }
    }
    catch (err)
    {
        utils.logThis(`searchURIRequestsByGS1Key error: ${err}`);
        return null;
    }
};


/**
 * Searches for Resolver Requests with the given GLN. As this could be a large dataset, the ability
 * for clients to use lowestUriRequestId and maxRowsToReturn to batch the response. This function
 * limits the maximum batth size to 1000 Resolver Request entries
 * @param memberPrimaryGLN
 * @param lowestUriRequestId
 * @param maxRowsToReturn
 * @returns {Promise<null|*>}
 */
const searchURIRequestsByGLN = async (memberPrimaryGLN, lowestUriRequestId, maxRowsToReturn) =>
{
    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('memberPrimaryGLN', sql.TYPES.NChar(13));
        ps.input('lowestUriRequestId', sql.TYPES.BigInt());
        ps.input('maxRowsToReturn', sql.TYPES.Int());

        if(maxRowsToReturn > 1000)
        {
            maxRowsToReturn = 1000;
        }
        await ps.prepare('EXEC [GET_URI_Requests_using_member_primary_gln] @memberPrimaryGLN, @lowestUriRequestId, @maxRowsToReturn');
        const dbResult = await ps.execute({ memberPrimaryGLN: memberPrimaryGLN, lowestUriRequestId: lowestUriRequestId, maxRowsToReturn: maxRowsToReturn });
        await ps.unprepare();
        return decodeSQLSafeResolverArray(dbResult.recordset);
    }
    catch (err)
    {
        utils.logThis(`searchURIRequests error: ${err}`);
        return null;
    }
};



const countURIRequestsUsingGLN = async (memberPrimaryGLN) =>
{
    let countResult = { count: 0, lowestUriRequestId: 0};
    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('memberPrimaryGLN', sql.TYPES.NChar(13));

        await ps.prepare('EXEC [COUNT_URI_Requests_using_member_primary_gln] @memberPrimaryGLN');
        const dbResult = await ps.execute({ memberPrimaryGLN });
        await ps.unprepare();

        //There should only be one entry
        for(let record of dbResult.recordset)
        {
            countResult.count = record.entry_count;
            countResult.lowestUriRequestId = record.min_uri_request_id;
        }
        return countResult;
    }
    catch (err)
    {
        utils.logThis(`countURIRequestsUsingGLN error: ${err}`);
        return countResult;
    }
};


/**
 * Creates or Updates a Resolver Request entry, returning a result object with the new (or updated) uriRequestId.
 * The decision to insert or update is made by the stored procedure [CREATE_URI_Request].
 * @param memberPrimaryGLN
 * @param resolverRequest
 * @returns {Promise<number|*>}
 */
const upsertURIRequest = async (memberPrimaryGLN, resolverRequest) =>
{
    const result = {
        uriRequestId: 0,
        SUCCESS: false,
        HTTPSTATUS: HttpStatus.INTERNAL_SERVER_ERROR
    };

    //get official definitions for GS1 Key Code and Value
    const officialDef = utils.getGS1DigitalLinkToolkitDefinition(resolverRequest.gs1KeyCode, resolverRequest.gs1KeyValue);

    if(officialDef.SUCCESS)
    {
        //console.log(resolverRequest, officialDef);
        resolverRequest.gs1KeyCode = officialDef.gs1KeyCode;
        resolverRequest.gs1KeyValue = officialDef.gs1KeyValue;

        //Convert active flag into 1 or 0, and add memberPrimaryGLN just for the SQL call, convert item description to bse SQLSafe
        resolverRequest.active = resolverRequest.active ? 1 : 0;
        resolverRequest.memberPrimaryGLN = memberPrimaryGLN;
        resolverRequest.itemDescription = convertTextToSQLSafe(resolverRequest.itemDescription);

        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('memberPrimaryGLN', sql.TYPES.NChar(13));
        ps.input('gs1KeyCode', sql.TYPES.NVarChar(20));
        ps.input('gs1KeyValue', sql.TYPES.NVarChar(45));
        ps.input('itemDescription', sql.TYPES.NVarChar(200));
        ps.input('variantUri', sql.TYPES.NVarChar(255));
        ps.input('active', sql.TYPES.Bit());

        try
        {
            await ps.prepare('EXEC [CREATE_URI_Request] @memberPrimaryGLN, @gs1KeyCode, @gs1KeyValue, @itemDescription, @variantUri, @active');
            const dbResult = await ps.execute(resolverRequest);

            if (dbResult.recordset)
            {
                result.uriRequestId = dbResult.recordset[0]['uri_request_id'];
                result.SUCCESS = dbResult.recordset[0]['SUCCESS'];
                if (result.SUCCESS)
                {
                    result.HTTPSTATUS = HttpStatus.OK;
                }
                else
                {
                    result.HTTPSTATUS = HttpStatus.BAD_REQUEST;
                }
            }
            await ps.unprepare();
            return result;
        }
        catch (err)
        {
            utils.logThis(`upsertURIRequest error: ${err}`);
            return result;
        }
    }

};


/**
 * Creates or Updates a Resolver Request entry, returning a result object with the new (or updated) uriResponseId.
 * The decision to insert or update is made by the stored procedure [CREATE_URI_Response].
 * @param resolverResponse
 * @returns {Promise<{SUCCESS: boolean, uriResponseId: number, HTTPSTATUS: number}>}
 */
const upsertURIResponse = async (resolverResponse) =>
{
    const result = {
        uriResponseId: 0,
        SUCCESS: false,
        HTTPSTATUS: HttpStatus.INTERNAL_SERVER_ERROR
    };

    //Make sure that IANA Language is only two characters
    resolverResponse.ianaLanguage = resolverResponse.ianaLanguage.substring(0,2);

    //Convert flags from boolean into 1 or 0 just for the SQL call
    resolverResponse.active = resolverResponse.active ? 1 : 0;
    resolverResponse.fwqs = resolverResponse.fwqs ? 1 : 0;
    resolverResponse.defaultLinkType = resolverResponse.defaultLinkType ? 1 : 0;
    resolverResponse.defaultIanaLanguage = resolverResponse.defaultIanaLanguage ? 1 : 0;
    resolverResponse.defaultContext = resolverResponse.defaultContext ? 1 : 0;
    resolverResponse.defaultMimeType = resolverResponse.defaultMimeType ? 1 : 0;
    resolverResponse.linkTitle = convertTextToSQLSafe(resolverResponse.linkTitle);

    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('uriRequestId', sql.TYPES.BigInt());
        ps.input('linkType', sql.TYPES.NVarChar(100));
        ps.input('ianaLanguage', sql.TYPES.NChar(2));
        ps.input('context', sql.TYPES.NVarChar(100));
        ps.input('mimeType', sql.TYPES.NVarChar(45));
        ps.input('linkTitle', sql.TYPES.NVarChar(100));
        ps.input('targetUrl', sql.TYPES.NVarChar(1024));
        ps.input('fwqs', sql.TYPES.Bit());
        ps.input('active', sql.TYPES.Bit());
        ps.input('defaultLinkType', sql.TYPES.Bit());
        ps.input('defaultIanaLanguage', sql.TYPES.Bit());
        ps.input('defaultContext', sql.TYPES.Bit());
        ps.input('defaultMimeType', sql.TYPES.Bit());

        await ps.prepare('EXEC [CREATE_URI_Response] @uriRequestId, @linkType, @ianaLanguage, @context, @mimeType, @linkTitle, ' +
            '@targetUrl, @fwqs, @active, @defaultLinkType, @defaultIanaLanguage, @defaultContext, @defaultMimeType');

        const dbResult = await ps.execute(resolverResponse);

        if(dbResult.recordset)
        {
            result.uriResponseId = dbResult.recordset[0]['uri_response_id'];
            result.SUCCESS = dbResult.recordset[0]['SUCCESS'];
            if(result.SUCCESS)
            {
                result.HTTPSTATUS = HttpStatus.OK;
            }
            else
            {
                result.HTTPSTATUS = HttpStatus.BAD_REQUEST;
            }
        }

        await ps.unprepare();
        return result;
    }
    catch (err)
    {
        utils.logThis(`upsertURIResponse error: ${err}`);
        return result;
    }
};


/**
 * Delete the uriRequestId if it matches the provided memberPrimaryGLN
 * @param memberPrimaryGLN
 * @param uriRequestId
 * @returns {Promise<{SUCCESS: boolean, HTTPSTATUS: number}>}
 */
const deleteURIRequest = async (memberPrimaryGLN, uriRequestId) =>
{
    const result = {
        SUCCESS: false,
        HTTPSTATUS: HttpStatus.INTERNAL_SERVER_ERROR
    };

    try
    {
        await connectToSQLServerDB();

        const ps = new sql.PreparedStatement(sqlConn);

        ps.input('uriRequestId', sql.TYPES.BigInt());
        ps.input('memberPrimaryGLN', sql.TYPES.NChar(13));
        await ps.prepare('EXEC [DELETE_URI_Request] @uriRequestId, @memberPrimaryGLN');
        const dbResult = await ps.execute({ uriRequestId: uriRequestId, memberPrimaryGLN: memberPrimaryGLN });

        if(dbResult.recordset)
        {
            result.uriRequestId = dbResult.recordset[0]['uri_request_id'];
            result.SUCCESS = dbResult.recordset[0]['SUCCESS'];
            if(result.SUCCESS)
            {
                result.HTTPSTATUS = HttpStatus.OK;
            }
            else
            {
                result.HTTPSTATUS = HttpStatus.BAD_REQUEST;
            }
        }
        await ps.unprepare();
        return result;
    }
    catch (err)
    {
        utils.logThis(`deleteURIRequest error: ${err}`);
        return result;
    }
};


/**
 * Deletes the Resolver Response entry with the given uriResponseId
 * @param uriResponseId
 * @returns {Promise<{SUCCESS: boolean, HTTPSTATUS: number}>}
 */
const deleteURIResponse = async (uriResponseId) =>
{
    const result = {
        SUCCESS: false,
        HTTPSTATUS: HttpStatus.INTERNAL_SERVER_ERROR
    };

    try
    {
        await connectToSQLServerDB();

        const ps = new sql.PreparedStatement(sqlConn);

        ps.input('uriResponseId', sql.TYPES.BigInt());
        await ps.prepare('EXEC [DELETE_URI_Response] @uriResponseId');
        const dbResult = await ps.execute({ uriResponseId: uriResponseId });

        if(dbResult.recordset)
        {
            result.uriRequestId = dbResult.recordset[0]['uri_response_id'];
            result.SUCCESS = dbResult.recordset[0]['SUCCESS'];
            if(result.SUCCESS)
            {
                result.HTTPSTATUS = HttpStatus.OK;
            }
            else
            {
                result.HTTPSTATUS = HttpStatus.BAD_REQUEST;
            }
        }
        await ps.unprepare();
        return result;
    }
    catch (err)
    {
        utils.logThis(`deleteURIResponse error: ${err}`);
        return result;
    }
};


/**
 * This function takes teh provided authorization key and returns whether or not
 * the authorisation is successful or not. If successful, memberPrimaryGLN is also
 * returned for internal use. This GLN limits the authorised client to change entries
 * linked to that memberPrimaryGLN.
 * @param authKey
 * @returns {Promise<{SUCCESS: boolean, memberPrimaryGLN: string}>}
 */
const checkAuth = async (authKey) =>
{
    let authResponse = { SUCCESS: false, memberPrimaryGLN: "" };

    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);

        ps.input('authKey', sql.TYPES.NChar(64));
        await ps.prepare('EXEC [READ_Resolver_Auth] @authKey');

        const result = await ps.execute({ authKey: authKey });

        if(result.recordset)
        {
            authResponse.SUCCESS = result.recordset[0]['success'] === 1;
            authResponse.memberPrimaryGLN = result.recordset[0]['member_primary_gln'];
        }
        await ps.unprepare();
        return authResponse;

    }
    catch (err)
    {
        utils.logThis(`checkAuth error: ${err}`);
        return authResponse;
    }
};


/**
 * Converts text to a Base64 format prefixed with the symbol '[]'.
 * This symbol is uses by function decodeTextFromSQLSafe() to detect that
 * stored data for a given property is encoded. Occasionally, this function
 * should be preventing the encoding (text may already be encoded) so if
 * the text starts '[]' already then it is simply returned.
 * @param incomingText
 * @returns {string}
 */
const convertTextToSQLSafe = (incomingText) =>
{
    if(!incomingText.startsWith('[]'))
    {
        let buff = new Buffer.from(incomingText, 'utf8');
        let base64data = buff.toString('base64');
        return `[]${base64data}`;
    }
    return incomingText;
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


module.exports = {
    checkAuth,
    countURIRequestsUsingGLN,
    readURIRequest,
    readURIResponse,
    searchURIRequestsByGS1Key,
    searchURIRequestsByGLN,
    searchURIResponses,
    upsertURIRequest,
    upsertURIResponse,
    deleteURIRequest,
    deleteURIResponse,
    closeDB
};
