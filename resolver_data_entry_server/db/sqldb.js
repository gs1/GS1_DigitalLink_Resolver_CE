/**
 * sqldb.js provides the complete interface to Resolver's SQL Server database. All SQL entries are requested via this file.
 * As a result, any desired database brand change from Microsoft SQL Server requires alterations only to this file.
 */
const sql = require('mssql');
const utils = require("../bin/resolver_utils");
const HttpStatus = require('http-status-codes');
let sqlConn = null;

/**
 * Gets the server config connection details from environment variables provided in the Dockerfile
 * @type {{server: string, password: string, database: string, options: {encrypt: boolean, enableArithAbort: boolean}, user: string}}
 */

const global_sqlServerConfig = {
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

let global_connectedToSQLServerFlag = false;

/**
 * If the SQL Server disconnects, this triggers an 'end' event which is captured here
 * to set a flag appropriately.
 */
sql.on('end', (() =>
{
    global_connectedToSQLServerFlag = false;
    utils.logThis("SQL DB disconnected");
}));


/**
 * Connects to the Microsoft SQL Server database storing Resolver's data entry record
 * @returns {Promise<boolean>}
 */
const connectToSQLServerDB = async () =>
{
    if(!global_connectedToSQLServerFlag)
    {
        try
        {
            utils.logThis("Connecting to SQL DB");
            sqlConn = new sql.ConnectionPool(global_sqlServerConfig);
            await sqlConn.connect();
            utils.logThis("Connected to SQLServer DB successfully");
            global_connectedToSQLServerFlag = true;

        }
        catch (error)
        {
            utils.logThis(`connectToSQLServerDB Error: ${error}`);
            global_connectedToSQLServerFlag = false;
        }
    }
    return global_connectedToSQLServerFlag;
};


/**
 * Closes the DB connection
 * @returns {Promise<void>}
 */
const closeDB = async () =>
{
    if(global_connectedToSQLServerFlag)
    {
        try
        {
            await sqlConn.close();
        }
        catch (err)
        {
            //This is a serious situation if we can't even close the database.
            //We're going to terminate this node application, which will be detected
            //by Kubernetes livenessProbe in a few seconds when it can't get
            //a response from the API and kills the pod, replacing it.
            utils.logThis(`closeDB error: ${err}`);
            utils.logThis(`TERMINATING APPLICATION`);
            process.exit(1);
        }
    }
    global_connectedToSQLServerFlag = false;
};


/**
 * This reset function is used should any DB function result in a caught exception.
 * Note - it is only used in timeout situations
 * @returns {Promise<void>}
 */
const resetDBConnection = async (errorMessage) =>
{
    if (errorMessage.includes('operation timed out'))
    {
        await closeDB();
        await connectToSQLServerDB();
    }
}



/**
 * Locates all the URI Responses for a five Resolver Entry Id
 * @param uriEntryId
 * @returns {Promise<null|*>}
 */
const searchURIResponses = async (uriEntryId) =>
{
    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('uriEntryId', sql.TYPES.BigInt());

        await ps.prepare('EXEC [GET_URI_Responses] @uriEntryId');
        const dbResult = await ps.execute({ uriEntryId });
        await ps.unprepare();

        let decodedResults = decodeSQLSafeResolverArray(dbResult.recordset);
        return convertDBRowsToAPIFormat(decodedResults);
    }
    catch (err)
    {
        utils.logThis(`searchURIResponses error: ${err}`);
        await resetDBConnection(err.message);
        return null;
    }
};


/**
 * Searches for Resolver Entries with the given issuerGLN, identificationKeyType, identificationKey
 * @param issuerGLN
 * @param identificationKeyType
 * @param identificationKey
 * @returns {Promise<null|*>}
 */
const searchURIEntriesByIdentificationKey = async (issuerGLN, identificationKeyType, identificationKey) =>
{
    try
    {
        const officialDef = utils.getGS1DigitalLinkToolkitDefinition(identificationKeyType, identificationKey);

        if (officialDef.SUCCESS)
        {
            await connectToSQLServerDB();
            const ps = new sql.PreparedStatement(sqlConn);
            ps.input('identificationKeyType', sql.TYPES.NVarChar(20));
            ps.input('identificationKey', sql.TYPES.NVarChar(45));
            ps.input('issuerGLN', sql.TYPES.NChar(13));

            await ps.prepare('EXEC [GET_URI_Entries_using_gln_and_identification_key] @identificationKeyType, @identificationKey, @issuerGLN');
            const dbResult = await ps.execute({
                issuerGLN,
                identificationKeyType: officialDef.identificationKeyType,
                identificationKey: officialDef.identificationKey
            });
            await ps.unprepare();
            let decodedResults = decodeSQLSafeResolverArray(dbResult.recordset);
            return convertDBRowsToAPIFormat(decodedResults);
        }
    }
    catch (err)
    {
        utils.logThis(`searchURIEntriesByIdentificationKey error: ${err}`);
        await resetDBConnection(err.message);
        return null;
    }
};


/**
 * Searches for Resolver Entries with the given GLN. As this could be a large dataset,
 * pageNumber and size is included allowing clients to read the data in batches
 * until no more rows are returned. Page sizes of no larger than 1000 rows are allowed.
 -- =============================================
 * @param issuerGLN
 * @param pageNumber
 * @param pageSize
 * @returns {Promise<null|*>}
 */
const searchURIEntriesByGLN = async (issuerGLN, pageNumber, pageSize) =>
{
    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('issuerGLN', sql.TYPES.NChar(13));
        ps.input('pageNumber', sql.TYPES.Int());
        ps.input('pageSize', sql.TYPES.Int());

        if(pageSize > 1000)
        {
            pageSize = 1000;
        }

        await ps.prepare('EXEC [GET_URI_Entries_using_member_primary_gln] @issuerGLN, @pageNumber, @pageSize');
        const dbResult = await ps.execute({ issuerGLN, pageNumber, pageSize });
        await ps.unprepare();

        let decodedResults = decodeSQLSafeResolverArray(dbResult.recordset);
        return convertDBRowsToAPIFormat(decodedResults);
    }
    catch (err)
    {
        utils.logThis(`searchURIEntries error: ${err}`);
        await resetDBConnection(err.message);
        return null;
    }
};


/**
 * Counts the number of resolver entries belonging to the specified GLN
 * @param issuerGLN
 * @returns {Promise<number>}
 */
const countURIEntriesUsingGLN = async (issuerGLN) =>
{
    let countResult = 0;
    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('issuerGLN', sql.TYPES.NChar(13));
        await ps.prepare('EXEC [COUNT_URI_Entries_using_member_primary_gln] @issuerGLN');
        const dbResult = await ps.execute({ issuerGLN });
        await ps.unprepare();
        if (Array.isArray(dbResult.recordset))
        {
            countResult = dbResult.recordset[0]['entry_count'];
        }
        return countResult;
    }
    catch (err)
    {
        utils.logThis(`countURIEntriesUsingGLN error: ${err}`);
        await resetDBConnection(err.message);
        return countResult;
    }
};


/**
 * Creates or Updates a Resolver Entry entry, returning a result object with the new (or updated) uriEntryId.
 * The decision to insert or update is made by the stored procedure [UPSERT_URI_Entry_Prevalid].
 * @param issuerGLN
 * @param resolverEntry
 * @param batchId
 * @param lrCheckFlag
 * @returns {Promise<number|*>}
 */
const upsertURIEntry = async (issuerGLN, resolverEntry, batchId, lrCheckFlag) =>
{
    const result = {
        uriEntryId: 0,
        SUCCESS: false,
    };

    //get official definitions for GS1 Key Code and Value as this is what we must store in the SQL database
    const officialDef = utils.getGS1DigitalLinkToolkitDefinition(resolverEntry.identificationKeyType, resolverEntry.identificationKey);

    if(officialDef.SUCCESS)
    {
        //this will change any identificationKeyType as a shortcode (e.g. 'gtin') to its numeric equivalent (e.g.'01')
        resolverEntry.identificationKeyType = officialDef.identificationKeyType;
        resolverEntry.identificationKey = officialDef.identificationKey;

        //Convert active flag into 1 or 0, and add issuerGLN just for the SQL call, convert item description to use SQLSafe
        resolverEntry.active = resolverEntry.active ? 1 : 0;
        resolverEntry.issuerGLN = issuerGLN;
        resolverEntry.itemDescription = convertTextToSQLSafe(resolverEntry.itemDescription);

        //Add the batchId property ready for entry into the database
        resolverEntry.batchId = batchId;

        //Add the initial validation code - 255 (unchecked) if we are performing validation checks.
        //or 0 if validation checks are not to be used (0 = 'passed successfully')
        //TODO: If you are wanting to use an external validation service to check uploaded entries then set this value to 255, else leave at 0
        resolverEntry.validationCode = 0;

        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('issuerGLN', sql.TYPES.NChar(13));
        ps.input('identificationKeyType', sql.TYPES.NVarChar(20));
        ps.input('identificationKey', sql.TYPES.NVarChar(45));
        ps.input('itemDescription', sql.TYPES.NVarChar(200));
        ps.input('qualifierPath', sql.TYPES.NVarChar(255));
        ps.input('active', sql.TYPES.Bit());
        ps.input('batchId', sql.TYPES.Int());
        ps.input('validationCode', sql.TYPES.TinyInt());

        try
        {
            await ps.prepare('EXEC [UPSERT_URI_Entry_Prevalid] @issuerGLN, @identificationKeyType, @identificationKey, @itemDescription, @qualifierPath, @active, @batchId, @validationCode');
            const dbResult = await ps.execute(resolverEntry);

            if (dbResult.recordset)
            {
                result.uriEntryId = dbResult.recordset[0]['uri_entry_id'];
                result.SUCCESS = dbResult.recordset[0]['SUCCESS'];
            }
            await ps.unprepare();
        }
        catch (err)
        {
            utils.logThis(`upsertURIEntry error: ${err}`);
        }
    }
    else
    {
        //Failed the Digital Link toolkit test
        utils.logThis(`${resolverEntry.identificationKeyType}/${resolverEntry.identificationKey} - failed the Digital Link toolkit test`);
    }
    return result;

};


/**
 * Creates or Updates a Resolver Entry entry, returning a result object with the new (or updated) uriResponseId.
 * The decision to insert or update is made by the stored procedure [UPSERT_URI_Response_Prevalid].
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

    try
    {
        //Make sure that IANA Language is only two characters
        resolverResponse.ianaLanguage = resolverResponse.ianaLanguage.substring(0,2);

        //Set flags to appropriate internal values
        resolverResponse.active = resolverResponse.active ? 1 : 0;
        resolverResponse.fwqs = resolverResponse.fwqs ? 1 : 0;
        resolverResponse.defaultLinkType = resolverResponse.defaultLinkType ? 1 : 0;
        resolverResponse.defaultIanaLanguage = resolverResponse.defaultIanaLanguage ? 1 : 0;
        resolverResponse.defaultContext = resolverResponse.defaultContext ? 1 : 0;
        resolverResponse.defaultMimeType = resolverResponse.defaultMimeType ? 1 : 0;
        resolverResponse.linkTitle = convertTextToSQLSafe(resolverResponse.linkTitle);

        //Make sure LinkTitle never exceeds 100 characters (yes it is base64 encoded which
        //expands the characters by approx 35%. If the base64 version is truncated,
        //it can still decoded - it just produces truncated decoded text.
        if (resolverResponse.linkTitle.length > 100)
        {
            resolverResponse.linkTitle = resolverResponse.linkTitle.substring(0,100);
        }

        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('uriEntryId', sql.TYPES.BigInt());
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

        await ps.prepare('EXEC [UPSERT_URI_Response_Prevalid] @uriEntryId, @linkType, @ianaLanguage, @context, @mimeType, @linkTitle, ' +
            '@targetUrl, @fwqs, @active, @defaultLinkType, @defaultIanaLanguage, @defaultContext, @defaultMimeType');

        const dbResult = await ps.execute(resolverResponse);

        if(dbResult.recordset)
        {
            result.uriResponseId = dbResult.recordset[0]['uri_response_id']; //returned by DB but we don't use it in Resolver - may have future use?
            result.SUCCESS = dbResult.recordset[0]['SUCCESS'];
        }

        await ps.unprepare();
        return result;
    }
    catch (err)
    {
        utils.logThis(`upsertURIResponse error: ${err}`);
        await resetDBConnection(err.message);
        return result;
    }
};


/**
 * Delete the uriEntryId if it matches the provided issuerGLN
 * @returns {Promise<boolean>}
 * @param issuerGLN
 * @param identificationKeyType
 * @param identificationKey
 */
const deleteURIEntry = async (issuerGLN, identificationKeyType, identificationKey) =>
{
    let success = false;
    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        const officialDef = utils.getGS1DigitalLinkToolkitDefinition(identificationKeyType, identificationKey);

        if (officialDef.SUCCESS)
        {
            ps.input('identificationKeyType', sql.TYPES.NVarChar(20));
            ps.input('identificationKey', sql.TYPES.NVarChar(45));
            ps.input('issuerGLN', sql.TYPES.NChar(13));
            await ps.prepare('EXEC [DELETE_URI_Entry] @issuerGLN, @identificationKeyType, @identificationKey');
            const dbResult = await ps.execute({issuerGLN, identificationKeyType, identificationKey});

            if (dbResult.recordset)
            {
                if (dbResult.recordset[0]['SUCCESS'])
                {
                    success = true;
                }
            }
            await ps.unprepare();
        }
        else
        {
            utils.logThis(`deleteURIEntry error: delete request for id key type ${identificationKeyType} and key ${identificationKey} failed DigitalLink ToolKit inspection`);
        }
    }
    catch (err)
    {
        utils.logThis(`deleteURIEntry error: ${err}`);
        await resetDBConnection(err.message);
    }

    return success;
};


/**
 * This function takes the provided authorization key and returns whether or not
 * the authorisation is successful or not. If successful, issuerGLN is also
 * returned for internal use. This GLN limits the authorised client to change entries
 * linked to that issuerGLN.
 * @param authKey
 * @returns {Promise<{SUCCESS: boolean, issuerGLN: string}>}
 */
const checkAuth = async (authKey) =>
{
    let authResponse = { SUCCESS: false, issuerGLN: "" };

    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);

        ps.input('authKey', sql.TYPES.NVarChar(64));
        await ps.prepare('EXEC [READ_Resolver_Auth] @authKey');

        const result = await ps.execute({ authKey: authKey });

        if(result.recordset)
        {
            authResponse.SUCCESS = result.recordset[0]['success'] === 1;
            authResponse.issuerGLN = result.recordset[0]['member_primary_gln'];
        }
        await ps.unprepare();
        return authResponse;

    }
    catch (err)
    {
        utils.logThis(`checkAuth error: ${err}`);
        await resetDBConnection(err.message);
        return authResponse;
    }
};


/**
 * Commands the database to publish all entries in the given batch
 * that passed validation
 * @param batchId
 * @returns {Promise<number>}
 */
const publishValidatedEntries = async (batchId) =>
{
    let entriesPublishedCount = 0;
    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('batchId', sql.TYPES.Int());
        await ps.prepare('EXEC [VALIDATE_Publish_Validated_Entries] @batchId');
        const dbResult = await ps.execute({ batchId });

        if (dbResult.recordset && Array.isArray(dbResult.recordset))
        {
            entriesPublishedCount = dbResult.recordset[0]['entriesPublishedCount'];
        }
        await ps.unprepare();
    }
    catch (err)
    {
        utils.logThis(`publishValidatedEntries error: ${err}`);
        await resetDBConnection(err.message);
    }

    return entriesPublishedCount;
};


/**
 * Saves the result of a validation call to the database for the given entry.
 * Note that this can affect more than one entry if there are different
 * @param issuerGLN
 * @param identificationKeyType
 * @param identificationKey
 * @param validationCode
 * @returns {Promise<boolean>}
 */
const saveValidationResult = async (issuerGLN, identificationKeyType, identificationKey, validationCode) =>
{
    let success = false;
    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('issuerGLN', sql.TYPES.NVarChar(20));
        ps.input('identificationKeyType', sql.TYPES.NVarChar(20));
        ps.input('identificationKey', sql.TYPES.NVarChar(45));
        ps.input('validationCode', sql.TYPES.TinyInt());

        await ps.prepare('EXEC [VALIDATE_Save_Validation_Result] @issuerGLN, @identificationKeyType, @identificationKey, @validationCode');
        const dbResult = await ps.execute({issuerGLN, identificationKeyType, identificationKey, validationCode});

        if (dbResult.recordset)
        {
            if (dbResult.recordset[0]['SUCCESS'])
            {
                success = true;
            }
        }
        await ps.unprepare();
    }
    catch (err)
    {
        utils.logThis(`saveValidationResult error: ${err}`);
        await resetDBConnection(err.message);
    }

    return success;
};


/**
 * Get the results of the validation from the database, setting up a STATUS value which can mean:
 * 1 = Completed
 * 5 = Failure
 * 7 = Pending
 * @param issuerGLN
 * @param batchId
 * @returns {Promise<{STATUS: number, validations: []}>}
 */
const getValidationResultForBatchFromDB = async (issuerGLN, batchId) =>
{
    let resultSet = {STATUS: 5, validations: []}
    try
    {
        await connectToSQLServerDB();

        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('issuerGLN', sql.TYPES.NChar(13));
        ps.input('batchId', sql.TYPES.Int());
        await ps.prepare('EXEC [VALIDATE_Get_Validation_Results] @issuerGLN, @batchId');
        const dbResult = await ps.execute({ issuerGLN, batchId });

        if (dbResult.recordset && Array.isArray(dbResult.recordset))
        {
            //if a batch is pending, the call to [VALIDATE_Get_Validation_Results] will result in a single row
            //with column 'PENDING' set to 'Y'.
            if (dbResult.recordset.length === 1 && dbResult.recordset[0]["PENDING"] === 'Y')
            {
                resultSet.STATUS = 7; //A value used by the VbG platform to denote 'pending'
            }
            else
            {
                resultSet.STATUS = 1; //A value used by the VbG platform to denote 'completed'
                resultSet.validations = dbResult.recordset;
            }
        }
        await ps.unprepare();
    }
    catch (err)
    {
        utils.logThis(`getValidationResultForBatchFromDB error: ${err}`);
        await resetDBConnection(err.message);
    }

    return resultSet;
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
    if (Array.isArray(rrArray))
    {
        for (let i=0; i < rrArray.length; i++)
        {
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


/**
 * Retrieves one or all GCPs for a given issuerGLN
 * @param issuerGLN
 * @param identificationKeyType
 * @param gcp
 * @returns {Promise<*>}
 */
const searchGCPRedirects = async (issuerGLN, identificationKeyType, gcp) =>
{
    let dbResult = {};
    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('issuerGLN', sql.TYPES.NChar(13));

        if (identificationKeyType && gcp)
        {
            ps.input('identificationKeyType', sql.TYPES.NVarChar(20));
            ps.input('gcp', sql.TYPES.NVarChar(45));
            await ps.prepare('EXEC [READ_GCP_Redirect] @issuerGLN, @identificationKeyType, @gcp');
            dbResult = await ps.execute({issuerGLN, identificationKeyType, gcp});
        }
        else
        {
            await ps.prepare('EXEC [GET_GCP_Redirects] @issuerGLN');
            dbResult = await ps.execute({issuerGLN, identificationKeyType, gcp});
        }
        await ps.unprepare();
        return convertDBRowsToAPIFormat(dbResult.recordset);
    }
    catch (err)
    {
        utils.logThis(`searchGCPRedirects error: ${err}`);
        await resetDBConnection(err.message);
        return [];
    }
}


/**
 * Inserts or updates a GCP entry
 * @param issuerGLN
 * @param identificationKeyType
 * @param gcp
 * @param targetUrl
 * @param active
 * @returns {Promise<boolean>}
 */
const upsertGCPRedirect = async (issuerGLN, identificationKeyType, gcp, targetUrl, active) =>
{
    let result = false;
    await connectToSQLServerDB();

    const ps = new sql.PreparedStatement(sqlConn);
    ps.input('issuerGLN', sql.TYPES.NChar(13));
    ps.input('identificationKeyType', sql.TYPES.NVarChar(20));
    ps.input('gcp', sql.TYPES.NVarChar(45));
    ps.input('targetUrl', sql.TYPES.NVarChar(255));
    ps.input('active', sql.TYPES.Bit());

    //We store key types such as 'gtin' in its ai numeric format ('01' for gtin)
    identificationKeyType = utils.convertAILabelToNumeric(identificationKeyType);
    try
    {
        await ps.prepare('EXEC [UPSERT_GCP_Redirect] @issuerGLN, @identificationKeyType, @gcp, @targetUrl, @active');
        const dbResult = await ps.execute( {issuerGLN, identificationKeyType, gcp, targetUrl, active });

        if (dbResult.recordset)
        {
            result = dbResult.recordset[0]['SUCCESS'];
        }
        await ps.unprepare();
    }
    catch (err)
    {
        utils.logThis(`upsertGCPRedirect error: ${err}`);
    }

    return result;
}


const deleteGCPRedirect = async(issuerGLN, identificationKeyType, gcp) =>
{
    let result = false;

    await connectToSQLServerDB();

    const ps = new sql.PreparedStatement(sqlConn);
    ps.input('issuerGLN', sql.TYPES.NChar(13));
    ps.input('identificationKeyType', sql.TYPES.NVarChar(20));
    ps.input('gcp', sql.TYPES.NVarChar(45));


    try
    {
        await ps.prepare('EXEC [DELETE_GCP_Redirect] @issuerGLN, @identificationKeyType, @gcp');
        const dbResult = await ps.execute( {issuerGLN, identificationKeyType, gcp});

        if (dbResult.recordset)
        {
            result = dbResult.recordset[0]['SUCCESS'];
        }
        await ps.unprepare();
    }
    catch (err)
    {
        utils.logThis(`deleteGCPRedirect error: ${err}`);
        await resetDBConnection(err.message);
    }

    return result;
}


/**
 * Runs End of Day processing on the SQL server - set to once every 24 hours
 * by using setInterval()
 * @returns {Promise<void>}
 */
const runEndOfDaySQL = async() =>
{
    utils.logThis(`End Of Day SQL processing started`);
    await connectToSQLServerDB();

    const ps = new sql.PreparedStatement(sqlConn);

    try
    {
        await ps.prepare('EXEC [END_OF_DAY]');
        await ps.execute({});
        await ps.unprepare();
    }
    catch (err)
    {
        utils.logThis(`runEndOfDaySQL error: ${err}`);
        await resetDBConnection(err.message);
    }

    utils.logThis(`End Of Day SQL processing completed`);
}


/**
 * Lists the Build servers that are synchronising with the SQL database
 * @returns {Promise<null|*>}
 */
const getHeardBuildServers = async () =>
{
    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);

        await ps.prepare('EXEC [ADMIN_GET_Heard_Build_Servers]');
        const dbResult = await ps.execute({ });
        await ps.unprepare();

        return convertDBRowsToAPIFormat(dbResult.recordset);
    }
    catch (err)
    {
        utils.logThis(`getHeardBuildServers error: ${err}`);
        await resetDBConnection(err.message);
        return null;
    }
};


/**
 * Deletes a Build Sync Server from the Sync Registry. If it is still
 * running, that server will be forced to perform a full rebuild of
 * its local database.
 * @param syncServerId
 * @returns {Promise<boolean>}
 */
const deleteBuildServerFromSyncRegistry = async (syncServerId) =>
{
    let result = false;
    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);
        ps.input('syncServerId', sql.TYPES.NChar(13));
        await ps.prepare('EXEC [ADMIN_DELETE_Build_Server_From_Sync_Register] @syncServerId');
        const dbResult = await ps.execute({ syncServerId });
        if (dbResult.recordset)
        {
            result = dbResult.recordset[0]['SUCCESS'];
        }
        await ps.unprepare();
    }
    catch (err)
    {
        utils.logThis(`deleteBuildServerFromSyncRegistry error: ${err}`);
        await resetDBConnection(err.message);
        return false;
    }
    return result;
};



/**
 * Lists the Accounts authorised to use this service
 * @returns {Promise<null|*>}
 */
const getAccounts = async () =>
{
    try
    {
        await connectToSQLServerDB();
        const ps = new sql.PreparedStatement(sqlConn);

        await ps.prepare('EXEC [ADMIN_GET_Accounts]');
        const dbResult = await ps.execute({ });
        await ps.unprepare();

        return convertDBRowsToAPIFormat(dbResult.recordset);
    }
    catch (err)
    {
        utils.logThis(`getAccounts error: ${err}`);
        await resetDBConnection(err.message);
        return null;
    }
};


/**
 * Inserts, Updates or Deletes an account based on its account details
 * @returns {Promise<boolean>}
 * @param account
 * @param deleteFlag
 */
const upsertOrDeleteAccount = async (account, deleteFlag) =>
{
    let result = false;
    await connectToSQLServerDB();

    const ps = new sql.PreparedStatement(sqlConn);
    ps.input('issuerGLN', sql.TYPES.NChar(13));
    ps.input('accountName', sql.TYPES.NVarChar(255));
    ps.input('authenticationKey', sql.TYPES.NVarChar(64));

    try
    {
        if (deleteFlag)
        {
            await ps.prepare('EXEC [ADMIN_DELETE_Account] @issuerGLN, @accountName, @authenticationKey');
        }
        else
        {
            await ps.prepare('EXEC [ADMIN_UPSERT_Account] @issuerGLN, @accountName, @authenticationKey');
        }
        const dbResult = await ps.execute( account );

        if (dbResult.recordset)
        {
            result = dbResult.recordset[0]['SUCCESS'];
        }
        await ps.unprepare();
    }
    catch (err)
    {
        utils.logThis(`upsertOrDeleteAccount error: ${err}`);
        await resetDBConnection(err.message);
    }

    return result;
}



/**
 * SQL data columns are named as lowercase characters with underscores.
 * This function processes an array of returned rows using function
 * convertDBColumnsToAPIFormat() which performs the actual conversion.
 * @param rrArray
 * @returns {*}
 */
const convertDBRowsToAPIFormat = (rrArray) =>
{
    let rrOutputArray = [];
    if (rrArray.length !== undefined)
    {
        for (let rrElement of rrArray)
        {
            rrOutputArray.push(convertDBColumnsToAPIFormat(rrElement));
        }
    }
    return rrOutputArray;
};


/**
 * convertDBColumnsToAPIFormat converts DB underscored column names to camel case
 * e.g. column with name 'my_column_name' becomes 'myColumnName'.
 * If column is named 'identificationKeyType', the value of this property
 * has its AI numeric property such as '01' converted to the shortcode label 'gtin'.
 * Change this property:
 *    from its database name 'forwardRequestQuerystrings'
 *    to its API name 'fwqs'.
 * Delete property GLN as we don't want them surfacing via the API
 *
 * @param dbObject
 * @returns {{}}
 */
const convertDBColumnsToAPIFormat = (dbObject) =>
{
    let outputObj = {};
    let nextCharUpperCase = false;
    let keys = Object.keys(dbObject);
    for(let thisKey of keys)
    {
        let outputKeyName = "";
        if (thisKey === 'member_primary_gln')
        {
            //A 'special' for member_primary_gln, keeping the 'GLN' all capitals!
            outputKeyName = 'issuerGLN';
        }
        else
        {
            for(let char of [...thisKey])
            {
                if (char === '_')
                {
                    nextCharUpperCase = true;
                }
                else
                {
                    outputKeyName += nextCharUpperCase ? char.toUpperCase() : char.toLowerCase();
                    nextCharUpperCase = false;
                }
            }
        }

        if (thisKey === 'identification_key_type')
        {
            outputObj[outputKeyName] = utils.convertAINumericToLabel(dbObject[thisKey]);
        }
        else if (thisKey === 'forward_request_querystrings')
        {
            outputObj['fwqs'] = dbObject[thisKey];
        }
        else if (thisKey === 'linktype')
        {
            outputObj['linkType'] = dbObject[thisKey];
        }
        else if (thisKey === 'default_linktype')
        {
            outputObj['defaultLinkType'] = dbObject[thisKey];
        }
        else if (thisKey === 'member_primary_gln')
        {
            outputObj['issuerGLN'] = dbObject[thisKey];
        }
        else
        {
            outputObj[outputKeyName] = dbObject[thisKey];
        }



    }


    return outputObj;
}



module.exports = {
    checkAuth,
    countURIEntriesUsingGLN,
    searchURIEntriesByIdentificationKey,
    searchURIEntriesByGLN,
    searchURIResponses,
    upsertURIEntry,
    upsertURIResponse,
    deleteURIEntry,
    publishValidatedEntries,
    saveValidationResult,
    getValidationResultForBatchFromDB,
    searchGCPRedirects,
    upsertGCPRedirect,
    deleteGCPRedirect,
    runEndOfDaySQL,
    getHeardBuildServers,
    deleteBuildServerFromSyncRegistry,
    getAccounts,
    upsertOrDeleteAccount,
    closeDB
};
