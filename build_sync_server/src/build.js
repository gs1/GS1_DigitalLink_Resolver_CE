/**
 * build.js holds all the functionality required to run the BUILD application.
 * BUILD is controlled through the globally exposed .run() function below.
 */

const sqldb = require("./sqldb");
const mongodb = require("./mongodb");
const utils = require("./resolverUtils");
const GS1DigitalLinkToolkit = require("./GS1DigitalLinkToolkit");

const rowBatchSize = process.env.SQLDB_PROCESS_BATCH_SIZE || 1000;



/**
 * The run function controls the BUILD process.
 * @returns {Promise<void>}
 */
const run = async () =>
{
    global.buildRunningFlag = true;

    // Register this server's hostname with the SQL Database.
    // In response, the object returned has three properties:
    //     .updateCount - which lists the number of sync updates required, or -1 if a full sync is needed.
    //     .lastHeardUnixTime - which contains the unixtime (secs since 01-01-1970) when this hostname was last heard (or NULL if never heard before)
    //     .nextResolverSyncChangeId - the id of the next sync queue entry that will be used by a 'changes-only' sync
    const lastHeardDateTimeObj = await registerThisSyncServer();

    //Convert date/time object to a string representing the date:
    const lastHeardDateTime = JSON.stringify(lastHeardDateTimeObj).replace(/"/g,'');

    //If this server has not been heard from before, lastHeardDataTime will be 1st January 2020.
    const fullBuildFlag = String(lastHeardDateTime).includes('2020-01-01');
    if(fullBuildFlag)
    {
        utils.logThis("This sync server has not been heard from before, so a full build of the MongoDB will now commence");
        await mongodb.dropCollection('gcp');
        await mongodb.dropCollection('uri');
    }
    else
    {
        utils.logThis(`This sync server was last heard by the data-entry sqldb on ${lastHeardDateTime}`);
    }

    //build GCPs before URIs as there are far fewer entries to build with GCP.
    await performSyncGCPDocumentBuild(lastHeardDateTime, fullBuildFlag);
    await performSyncURIDocumentBuild(lastHeardDateTime, fullBuildFlag);

    utils.logThis("closing database connections");
    await sqldb.closeDB();
    await mongodb.closeDB();
    global.buildRunningFlag = false;
    utils.logThis("Build event completed");
};


/**
 * Updates the resolver URI document with the included variant entry, inserting it if
 * does not exist already.
 * @param entryEntry
 * @param qualifierPath
 * @param mongoEntry
 * @param identKeyType
 * @param identKey
 * @returns {Promise<*>}
 */
const updateUriDocument = async (entryEntry, qualifierPath, mongoEntry, identKeyType, identKey) =>
{
    try
    {
        //First get the responses for this uri_entry_id
        const responseSet = await sqldb.getURIResponses(entryEntry.uri_entry_id);
        if (responseSet !== null)
        {
            //This is an update so we will go ahead and build the record.
            //Build a variant record for this entry entry and its responses.
            let variantRecord = createVariantRecord(qualifierPath, entryEntry, responseSet);

            if (variantRecord !== null)
            {
                if (mongoEntry === null)
                {
                    //Create a brand new document
                    mongoEntry = variantRecord;
                    mongoEntry["_id"] = "/" + identKeyType + "/" + identKey;
                }
                else
                {
                    //Just update the existing document with this variant
                    let variantKey = Object.keys(variantRecord)[0];
                    mongoEntry[variantKey] = variantRecord[variantKey];
                }

                //update unixtime to latest value (now!)
                mongoEntry.unixtime = Math.round((new Date()).getTime() / 1000);

                //format the document:
                mongoEntry = formattUriDocument(mongoEntry);

                //update in the database
                let success = await mongodb.updateDocumentInMongoDB(mongoEntry, 'uri');
                if (!success)
                {
                    utils.logThis('Failed to update Mongo database with entry: ' + JSON.stringify(mongoEntry));
                }
            }
            else
            {
                //A entry with no responses has been found in the database, so this safety feature kicks in
                //to remove the variant from the record (or the entire record) in MongoDB (if mongoEntry isn't
                //null, which would be the case if no record exists in MongoDB anyway).
                if (mongoEntry !== null)
                {
                    if (mongoEntry[qualifierPath] !== null)
                    {
                        delete mongoEntry[qualifierPath];
                    }
                    if (Object.keys(mongoEntry).length < 3)
                    {
                        //Now we've removed that variant, there are no variants left! Delete the record.
                        let result = mongodb.deleteDocumentInMongoDB(mongoEntry, "uri");
                        utils.logThis(`${mongoEntry["_id"]} delete all: ${result}`);
                    }
                    else
                    {
                        //There is still at least one variant left, so update the record which has had this variant removed.
                        let result = mongodb.deleteDocumentInMongoDB(mongoEntry, "uri");
                        utils.logThis(`${mongoEntry["_id"]} delete variant: ${result}`);
                    }
                }
            }
        }
        else
        {
            utils.logThis("updateUriDocument: A null response array was returned");
        }

        return mongoEntry;
    }
    catch (err)
    {
        utils.logThis(`updateUriDocument error: ${err}`);
    }
};




/**
 * Deletes the URI variant entry from the resolver document for this gs1 keyy acode and value.
 * If there are no URI entries left, deletes the whole document
 * @param mongoEntry
 * @param qualifierPath
 * @returns {Promise<void>}
 */
const deleteUriVariantEntry = async (mongoEntry, qualifierPath) =>
{
    //DELETE entry entry
    //We need to remove this entry from the list in the MongoDB record
    if (mongoEntry !== null)
    {
        //Remove from the document
        delete mongoEntry[qualifierPath];

        //Let's see if that there are any more variants left after deleting that variant.
        //if not then delete the entire document, otherwise update it.
        if (Object.keys(mongoEntry).length < 3)
        {
            //delete
            await mongodb.deleteDocumentInMongoDB(mongoEntry, "uri");
        }
        else
        {
            //update
            await mongodb.updateDocumentInMongoDB(mongoEntry, "uri");
        }
    }
};


/**
 * This function formats the URI document so that 'headers' such as "_id" and "unixtime" are placed at the top
 * and the variants (if more than one) are sorted alphanumerically, with the root variant "/" at the top.
 * This makes the JSON version of this document easier to read by 'mere' humans.
 * @param doc
 * @returns {{}}
 */
const formattUriDocument = (doc) =>
{
    const formattedDoc = {};
    formattedDoc["_id"] = doc["_id"];
    formattedDoc["unixtime"] = doc["unixtime"];

    if(doc["/"] !== undefined)
    {
        formattedDoc["/"] = doc["/"];
    }

    const sortedKeys = Object.keys(doc).sort();
    sortedKeys.forEach((entry) =>
    {
        if(entry !== "_id" && entry !== "unixtime" && entry !== "/")
        {
            formattedDoc[entry] = doc[entry];
        }
    });

    return formattedDoc;
};


/**
 * buildURIDocuments takes a entrySet of entry rows and processes them into MongoDB by building each document.
 * If fullBuildIfTrue = true, this function will always process this entry as an update. If false, the added column
 * 'update_or_delete_flag' is examined (it is part of the entry record).
 * @param entrySet
 * @param fullBuildIfTrue
 * @returns {Promise<{db_attributeId: *, entryEntry: *}>}
 */
const buildURIDocuments = async (entrySet, fullBuildIfTrue) =>
{
    try
    {
        let processCounter = 0;
        utils.logThis(`Processing batch of ${entrySet.length} entry entries`);
        for (let entryEntry of entrySet)
        {
            processCounter++;
            if (processCounter % 100 === 0)
            {
                utils.logThis(`Processed count: ${processCounter} of ${entrySet.length}`);
            }

            //Get the qualifier_path
            let qualifierPath =  entryEntry["qualifier_path"].trim();
            if (qualifierPath === "" || qualifierPath.includes("undefined"))
            {
                //There are no variant attributes so we'll just define this entry as the 'root variant' denoted by '/':
                qualifierPath = "/";
            }

            //test that the entry is DigitalLink compliant
            let urlToTest = "https://id.gs1.org/" + entryEntry.identification_key_type.trim() + "/" + entryEntry.identification_key.trim() + qualifierPath;
            let structure = getDigitalLinkStructure(urlToTest);
            if (structure.result === "OK")
            {
                //These are the identificationKeyTypes and values as the official GS1 Digital Link Toolkit understands them,
                //which is the same toolkit also used by id_web_server to gain that same understanding.
                //by having both servers rely on the toolkit, we get consistency of data (e.g. '01' and not 'gtin').
                const identificationKeyType = Object.keys(structure.identifiers[0])[0];
                const identificationKey = structure.identifiers[0][identificationKeyType];

                //qualifierPath is now rebuilt according to the values in structure.qualifiers, and we build
                //in the order of .sortedQualifiers[] if it exists:
                qualifierPath = '';
                const theseQualifiers = structure.sortedQualifiers ? structure.sortedQualifiers : structure.qualifiers;

                for(let qualifier of theseQualifiers)
                {
                    let qualifierKey = Object.keys(qualifier);
                    let qualifierValue = qualifier[qualifierKey];
                    qualifierPath += `/${qualifierKey}/${qualifierValue}`;
                }

                if(qualifierPath === '')
                {
                    qualifierPath = '/';
                }

                //Go and get the existing entry from the MongoDB database
                let mongoEntry = await mongodb.findEntryInMongoDB(identificationKeyType, identificationKey, "uri");

                if(fullBuildIfTrue)
                {
                    await updateUriDocument(entryEntry, qualifierPath, mongoEntry, identificationKeyType, identificationKey);
                }
                else
                {
                    let updateOrDeleteFlag = entryEntry['active'];
                    if (updateOrDeleteFlag)
                    {
                        await updateUriDocument(entryEntry, qualifierPath, mongoEntry, identificationKeyType, identificationKey);
                    }
                    else
                    {
                        await deleteUriVariantEntry(mongoEntry, qualifierPath);
                    }
                }
            }
            else
            {
                utils.logThis(`Warning: Non DigitalLink-compliant resolver data entry record rejected: ${urlToTest} - error is: ${structure.error}`);
            }
        }
    }
    catch (err)
    {
        utils.logThis("buildURIDocuments error:", err)
    }
};


/**
 * Build the GCP Redirect entries for Resolver. If a full build is in progress,
 * the entry is updated, else a column 'update_or_delete_flag' that is part of each entry in
 * the gcpRedirectSet is examined as to whether it should update or delete the record
 * @param gcpRedirectSet
 * @param fullBuildIfTrue
 * @returns {Promise<void>}
 */
const buildGCPDocuments = async (gcpRedirectSet, fullBuildIfTrue) =>
{
    try
    {
        let processCounter = 0;
        utils.logThis(`Processing batch of ${gcpRedirectSet.length} GCP redirect entries`);
        for (let gcpRedirectEntry of gcpRedirectSet)
        {
            processCounter++;
            const identificationKeyType = gcpRedirectEntry.identification_key_type.trim();
            const prefixValue = gcpRedirectEntry.prefix_value.trim();
            const redirectURL = gcpRedirectEntry.target_url.trim();

            if (processCounter % 1000 === 0)
            {
                utils.logThis(`Processed count: ${processCounter} of ${gcpRedirectSet.length}`);
            }

            await mongodb.findEntryInMongoDB(identificationKeyType, prefixValue, "gcp");

            //The GCP document is far simpler than the URI document, with just an ID and URL.
            //So we will create the document here and insert/update it in the MongoDB database.
            const doc = {
                "_id": "/" + identificationKeyType + "/" + prefixValue,
                resolve_url_format: redirectURL
            };

            if(fullBuildIfTrue)
            {
                await mongodb.updateDocumentInMongoDB(doc, "gcp");
            }
            else
            {
                let updateOrDeleteFlag = gcpRedirectEntry['active'];
                if (updateOrDeleteFlag)
                {
                    await mongodb.updateDocumentInMongoDB(doc, "gcp");
                }
                else
                {
                    //Delete the GCP entry using its key:
                    await mongodb.deleteDocumentInMongoDB( { "_id": "/" + identificationKeyType + "/" + prefixValue }, "gcp");
                }
            }
        }
    }
    catch (err)
    {
        utils.logThis(`buildGCPDocuments error: ${err}`);
    }
};



/**
 * Performs a build based on all the changes that have happened since this server last registered with the database.
 * @returns {Promise<void>}
 * @param lastHeardDateTime
 * @param fullBuildFlag
 */
const performSyncURIDocumentBuild = async (lastHeardDateTime, fullBuildFlag) =>
{
    utils.logThis(`Perform an ${fullBuildFlag ? 'Full' : 'Update'} Build of the database reflecting latest changes`);

    if (fullBuildFlag)
    {
        await mongodb.createUnixTimeIndex();
    }

    let nextUriEntryId = 0;

    //This code will now loop until no more URI entries are returned from the database
    while (true)
    {
        try
        {
            //get the first / next set of URI entries
            const entrySet = await sqldb.getURIEntries(lastHeardDateTime, nextUriEntryId, rowBatchSize);
            if (entrySet === null || entrySet.length === 0)
            {
                //No more entries so break out of the loop:
                utils.logThis("Build Processing completed");
                break;
            }
            else
            {
                //We have one or more URI entries to Build:
                await buildURIDocuments(entrySet, fullBuildFlag);
                nextUriEntryId = parseInt(entrySet[entrySet.length - 1]['uri_entry_id']) + 1;
            }
        }
        catch (err)
        {
            //It's all gone terribly wrong! Better make a note of the error and exit the loop
            utils.logThis(`performSyncURIDocumentBuild error: ${err}`);
            break;
        }
    }
};


/**
 * Performs a build based on entries for a specific GS1 Key Code and GS1 Key Value.
 * @param identificationKeyType
 * @param identificationKey
 * @returns {Promise<boolean>}
 */
const performIdKeyTypeAndValueURIDocumentBuild = async (identificationKeyType, identificationKey) =>
{
    utils.logThis(`Performing a URI Update Build of the database using GS1 Key Code: ${identificationKeyType} and GS1 Key Value: ${identificationKey}`);
    let success = true;
    try
    {
        const entrySet = await sqldb.getURIEntriesUsingIdentificationKeyValue(identificationKeyType, identificationKey);
        if (entrySet === null || entrySet.length === 0)
        {
            utils.logThis(`No identificationKeyType: ${identificationKeyType} and identificationKey: ${identificationKey} exists in SQL DB!`);
            success = false;
        }
        else
        {
            await buildURIDocuments(entrySet, true);
            utils.logThis(`Build completed for identificationKeyType: ${identificationKeyType} and identificationKey: ${identificationKey}`);
        }
    }
    catch (err)
    {
        utils.logThis(`performIdKeyTypeAndValueURIDocumentBuild error: ${err}`);
        success = false;
    }

    return success;
};


/**
 * createVariantRecord creates the variant record that will be inserted into the larger document
 * indexed on identificationKeyType and identificationKey.
 * Each document can have one or more variants, with each variant representing on date entry entry row
 * and one or more matching responses rows from the SQL DB.
 * @param qualifierPath
 * @param entryEntry
 * @param responses
 * @returns {{}}
 */
const createVariantRecord = (qualifierPath, entryEntry, responses) =>
{
    let record = {};

    record[qualifierPath] = {};
    record[qualifierPath].item_name = decodeTextFromSQLSafe(entryEntry.item_description);
    record[qualifierPath].responses = {};

    for (let response of responses)
    {
        if (response.active)
        {
            let destination = {
                link: response['target_url'],
                fwqs: response['forward_request_querystrings'],
                linktype_uri: response['linktype'],
                title: decodeTextFromSQLSafe(response['link_title'])
            };

            let linkTypeForDB = getDigitalLinkVocabWord(response['linktype']);

            if(record[qualifierPath].responses.linktype === undefined)
            {
                record[qualifierPath].responses.linktype = {};
            }

            if(record[qualifierPath].responses.linktype[linkTypeForDB] === undefined)
            {
                record[qualifierPath].responses.linktype[linkTypeForDB] = {};
            }

            if(record[qualifierPath].responses.linktype[linkTypeForDB]['lang'] === undefined)
            {
                record[qualifierPath].responses.linktype[linkTypeForDB]['lang'] = {};
            }

            if(record[qualifierPath].responses.linktype[linkTypeForDB]['lang'][response['iana_language']] === undefined)
            {
                record[qualifierPath].responses.linktype[linkTypeForDB]['lang'][response['iana_language']] = {}
            }

            if(record[qualifierPath].responses.linktype[linkTypeForDB]['lang'][response['iana_language']]['context'] === undefined)
            {
                record[qualifierPath].responses.linktype[linkTypeForDB]['lang'][response['iana_language']]['context'] = {};
            }

            if(record[qualifierPath].responses.linktype[linkTypeForDB]['lang'][response['iana_language']]['context'][response['context']] === undefined)
            {
                record[qualifierPath].responses.linktype[linkTypeForDB]['lang'][response['iana_language']]['context'][response['context']] = {};
            }

            if(record[qualifierPath].responses.linktype[linkTypeForDB]['lang'][response['iana_language']]['context'][response['context']]['mime_type'] === undefined)
            {
                record[qualifierPath].responses.linktype[linkTypeForDB]['lang'][response['iana_language']]['context'][response['context']]['mime_type'] = {};
            }

            record[qualifierPath].responses.linktype[linkTypeForDB]['lang'][response['iana_language']]['context'][response['context']]['mime_type'][response['mime_type']] = destination;

            if (response['default_linktype'])
            {
                record[qualifierPath].responses['default_linktype'] = linkTypeForDB;
            }

            if (response['default_iana_language'])
            {
                record[qualifierPath].responses.linktype[linkTypeForDB]['default_lang'] = response['iana_language'];
            }

            if (response['default_context'])
            {
                record[qualifierPath].responses.linktype[linkTypeForDB]['lang'][response['iana_language']]['default_context'] = response['context'];
            }

            if (response['default_mime_type'])
            {
                record[qualifierPath].responses.linktype[linkTypeForDB]['lang'][response['iana_language']]['context'][response['context']]['default_mime_type'] = response['mime_type'];
            }
        }
    }

    if (record[qualifierPath].responses.linktype !== undefined)
    {
        //Now the document is built, enforce defaults
        return enforceDefaults(record, qualifierPath);
    }
    else
    {
        //No responses! Ditch this record by returning null
        return null;
    }
};


/**
 * Iterates through the record looking for the absence of defaults an, if necessary, enforcing defaults
 * by taking the first entry found for each attribute
 * @param record
 * @param qualifierPath
 * @return array
 */
const enforceDefaults = (record, qualifierPath) =>
{
    if (record[qualifierPath].responses['default_linktype'] === undefined)
    {
        record[qualifierPath].responses['default_linktype'] = Object.keys(record[qualifierPath].responses['linktype'])[0];
    }

    for (let linkTypeName in record[qualifierPath].responses['linktype'])
    {
        let linkType = record[qualifierPath].responses['linktype'][linkTypeName];
        if (!linkType.hasOwnProperty('default_lang'))
        {
            linkType['default_lang'] = Object.keys(linkType['lang'])[0];
        }

        for (let langName in linkType['lang'])
        {
            let lang = linkType['lang'][langName];
            if (!lang.hasOwnProperty('default_context'))
            {
                lang['default_context'] = Object.keys(lang['context'])[0];
            }

            for (let contextName in lang['context'])
            {
                let context = lang['context'][contextName];
                if (!context.hasOwnProperty('default_mime_type'))
                {
                    context['default_mime_type'] = Object.keys(context['mime_type'])[0];
                }
            }
        }
    }

    return record;
};


/**
 * Performs a build based on all the changes to GCP records that have happened since this server last registered with the database.
 * @returns {Promise<void>}
 * @param lastHeardDateTime
 * @param fullBuildFlag
 */

const performSyncGCPDocumentBuild = async (lastHeardDateTime, fullBuildFlag) =>
{
    utils.logThis("Performing a GCP Update Build of the database reflecting latest changes");
    let nextGCPRedirectId = 0;
    while (true)
    {
        try
        {
            const gcpSet = await sqldb.getGCPRedirects(lastHeardDateTime, nextGCPRedirectId, rowBatchSize);
            if (gcpSet === null || gcpSet.length === 0)
            {
                utils.logThis("GCP Processing completed");
                break;
            }
            else
            {
                await buildGCPDocuments(gcpSet, fullBuildFlag);
                nextGCPRedirectId = gcpSet[gcpSet.length - 1]['gcp_redirect_id'] + 1;
            }
        }
        catch (err)
        {
            utils.logThis(`performSyncGCPDocumentBuild error: ${err}`);
            break;
        }
    }
};


/**
 * getDigitalLinkVocabWord takes the linktype and creates a 'compressed' version (CURIE).
 * For example, 'https:/gs1.org/voc/hasRetailers' becomes 'gs1*hasRetailers', and
 *              alternative format 'gs1:hasRetailers' becomes 'gs1*hasRetailers'
 * But, since colons are reserved in come computer languages making the database inaccessible.
 * Indeed, MongoDB and other Document DBs doesn't allow colons in names of name/value pairs.
 * So this function actually returns 'gs1*hasRetailers' which will be returned to a colon
 * by code reading the database for the benefit of end users.
 * Currently this function detects and supports 'gs1' and 'schema' CURIEs
 * @param linkTypeURL
 * @return string
 */
const getDigitalLinkVocabWord = (linkTypeURL) =>
{
    //Does the incoming linktype have a ":" but no "/" ?
    if (linkTypeURL.includes(':') && !linkTypeURL.includes('/'))
    {
        //If so, convert the ":" to "*":
        return linkTypeURL.replace(':', '*');
    }
    else if (linkTypeURL.includes('/'))
    {
        const list = linkTypeURL.split('/');
        if (linkTypeURL.includes('gs1'))
        {
            return 'gs1*' + list[list.length - 1];
        }
        else if (linkTypeURL.includes('schema'))
        {
            return 'schema*' + list[list.length - 1];
        }
        else
        {
            //Just return the original
            return list[list.length - 1];
        }
    }
    else
    {
        //We haven't much choice just to return what we were given - add a warning to console.
        utils.logThis(`getDigitalLinkVocabWord WARNING: unformatted CURIE linktype ${linkTypeURL} returned`);
        return linkTypeURL;
    }
};


/**
 * Each synchronisation process needs calling build sync servers to register with the SQL data entry database
 * using a unique id. This 12 character ID is originally sourced from the build-sync-server's given HOSTNAME
 * from an environment variable offered to it by the hosting Docker-compatible engine.
 * This value is stored in the local MongoDB database, and subsequently retrieved when build-sync-server
 * starts up. After then, build-sync-server uses the value in the database rather than its own HOSTNAME
 * so that the data sync is consistent with the MongoDB database's data store.
 * It also make it easy to force a rebuild by deleting the registered entry in the SQL database.
 * In response, the object returned has three properties:
 *    .updateCount - which lists the number of sync updates required, or -1 if a full sync is needed.
 *    .lastHeardUnixTime - which contains the unixtime (secs since 01-01-1970) when this hostname was last heard (or NULL if never heard before)
 *    .nextResolverSyncChangeId - the id of the next sync queue entry that will be used by a 'changes-only' sync
 * @returns {Promise<{lastHeardDateTime}>}
 */
const registerThisSyncServer = async () =>
{
    let lastHeardDateTime = '';

    try
    {
        await mongodb.getResolverDatabaseIdFromMongoDB();
        utils.logThis(`Registering as sync server name: ${global.syncId}`);

        //Register this server with the data-entry database
        const result = await sqldb.registerSyncServer(global.syncId, process.env.HOSTNAME);

        if (result === null)
        {
            utils.logThis(`registerThisSyncServer warning: Could not get last heard datetime from SQL database!`);
        }
        else
        {
            //Process metrics that have come back from a successful registration so that the calling function
            //can find out what synchronisation work (if any) it needs to do.
            lastHeardDateTime = result[0]["last_heard_datetime"];
        }
    }
    catch (error)
    {
        utils.logThis(`registerThisSyncServer error: ${error}`);
    }
    return lastHeardDateTime;
};



/**
 * getDigitalLinkStructure calls into the GS1 DigitalInk Toolkit library and
 * returns the object structure (if any) or an error. The qualifiers are sorted
 * into the correct order (if there are any).
 * @param uri
 * @returns {{result: string, error: string}}
 */
const getDigitalLinkStructure = (uri) =>
{
    let structuredObject = {result: '', error: ''};

    let gs1dlt = new GS1DigitalLinkToolkit();
    try
    {
        structuredObject = gs1dlt.analyseURI(uri, true).structuredOutput;
        structuredObject.result = "OK";

        //If the are qualifiers to sort then we use the details in the Digital Link
        //Toolkit's aiTable.
        if (structuredObject.qualifiers && Array.isArray(structuredObject.qualifiers))
        {
            //Find the appropriate aiTable entry matching the identificationKeyType ('01' if GTIN)
            const wantedAITableEntry = gs1dlt.aitable.find((aiTableEntry) => aiTableEntry.ai === Object.keys(structuredObject.identifiers[0])[0]);

            //only a couple of aiTable entries have the qualifiers property. This array property contains
            //a list of the qualifiers in the correct sort order (if it exists):
            if (wantedAITableEntry.qualifiers)
            {
                //create a new array property 'sortedQualifiers'
                structuredObject.sortedQualifiers = [];

                //loop through the wantedAITableEntry.qualifiers:
                for (let wantedQualifier of wantedAITableEntry.qualifiers)
                {
                    //for each wantedAITableEntry.qualifiers entry, find the same entry
                    //in structuredObject.qualifiers and add it to the sortedQualifiers array.
                    for (let qualifier of structuredObject.qualifiers)
                    {
                        if (Object.keys(qualifier)[0] === wantedQualifier)
                        {
                            structuredObject.sortedQualifiers.push(qualifier);
                        }
                    }

                }
            }
        }

        //We're done.
        return structuredObject;
    }
    catch (err)
    {
        structuredObject.result = "ERROR";
        structuredObject.error = err.toString();
        return structuredObject;
    }
};


/**
 * @param textThatIsSQLSafe
 * @return string
 * Purpose: Restores 'SQL Safe' text back to the original string from Base64
 *          if it is prefixed with the double-character '[]' symbol
 */
const decodeTextFromSQLSafe = (textThatIsSQLSafe) =>
{
    let result = textThatIsSQLSafe;
    if (textThatIsSQLSafe.startsWith('[]'))
    {
        let buff = new Buffer.from(textThatIsSQLSafe.substring(2), 'base64');
        result = buff.toString('utf8');
    }
    if (result == null)
    {
        result = '';
    }
    return result;
};


module.exports = {
    run,
    performIdKeyTypeAndValueURIDocumentBuild
};