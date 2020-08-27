/** Resolver middle tier functions
 *
 */
const crypto = require('crypto');
const utils = require('../bin/resolver_utils');
const db = require('../db/sqldb');
const fetch = require('node-fetch');
const format = require('biguint-format');

// entryResponseStatusCode stores codes that are returned by the API to tne end user.
// This object is used much like an enum in other programming languages.
// function convertResponseStatusCodeFromDBValue() converts from entryResponseStatusCodeInDB equivalent value
// For validation purposes, you can repurpose any of these codes for your own use with the
// exception of code 0 (validation passed OK) and 99 (not yet validated) making sure that they
// are synchronised with entryResponseStatusCodeInDB
const entryResponseStatusCode = {
    OK: 0,
    INVALID_MO: 100,
    RESOLVER_ENTRY_MISSING_PROPERTIES: 110,
    FAILED_DIGITAL_LINK_TEST: 120,
    INACTIVE_LICENSE_UNDER_MO: 200,
    INVALID_LICENSE_UNDER_MO: 300,
    KEY_NOT_IN_MO_RANGE: 400,
    INVALID_KEY_TYPE: 500,
    KEY_NOT_FOUND: 600,
    FAILED_TO_SAVE_ENTRY: 700,
    FAILED_TO_SAVE_RESPONSE: 800,
    VALIDATION_ATTEMPT_FAILED: 900,
    NOT_YET_VALIDATED: 999
};


// entryResponseStatusCodeInDB is equivalent to entryResponseStatusCode
// but uses numbers that can fit within the database's 'tinyint' range (0 to 255).
// This object is used much like an enum in other programming languages.
// function convertResponseStatusCodeFromDBValue() converts to entryResponseStatusCode equivalent value
// For validation purposes, you can repurpose any of these codes for your own use with the
// exception of code 0 (validation passed OK) and 255 (not yet validated) making sure that they
//are synchronised with entryResponseStatusCode
const entryResponseStatusCodeInDB = {
    OK: 0,
    INVALID_MO: 1,
    RESOLVER_ENTRY_MISSING_PROPERTIES: 2,
    FAILED_DIGITAL_LINK_TEST: 3,
    INACTIVE_LICENSE_UNDER_MO: 4,
    INVALID_LICENSE_UNDER_MO: 5,
    KEY_NOT_IN_MO_RANGE: 6,
    KEY_NOT_FOUND: 7,
    INVALID_KEY_TYPE: 8,
    FAILED_TO_SAVE_ENTRY: 9,
    FAILED_TO_SAVE_RESPONSE: 10,
    VALIDATION_ATTEMPT_FAILED: 11,
    NOT_YET_VALIDATED: 255
};



/**
 * convertResponseStatusCodeFromDBValue() converts
 * from entryResponseStatusCodesInDB value
 * to entryResponseStatusCode equivalent value
 * @param code
 * @returns {number}
 */
const convertResponseStatusCodeFromDBValue = (code) =>
{
    const entryResponseStatusCodes = Object.entries(entryResponseStatusCode);
    const entryResponseStatusCodesInDB = Object.entries(entryResponseStatusCodeInDB);
    const codeName = entryResponseStatusCodesInDB.find((codeEntry) => codeEntry[1] === code);
    const codeValue = entryResponseStatusCodes.find((dbCodeEntry) => dbCodeEntry[0] === codeName[0]);
    return codeValue[1];
}

/**
 * Counts how many entries are owned by the supplied GLN
 * @param issuerGLN
 * @returns {Promise<{count: number}>}
 */
const countEntriesUsingGLN = async (issuerGLN) =>
{
    return { count: await db.countURIEntriesUsingGLN(issuerGLN) };
}


/**
 * Finds all the resolver entries with the specified key type and key, if owned by the specified GLN
 * @param issuerGLN
 * @param identificationKeyType
 * @param identificationKey
 * @returns {Promise<void>}
 */
const searchResolverEntriesByKey = async(issuerGLN, identificationKeyType, identificationKey) =>
{
    let entriesArray = await db.searchURIEntriesByIdentificationKey(issuerGLN, identificationKeyType, identificationKey);
    return await searchResponsesForTheseEntries(entriesArray);
}


/**
 * Finds the responses to the supplied entries list
 * @param entriesArray
 * @returns {Promise<*>}
 */
async function searchResponsesForTheseEntries(entriesArray)
{
    if (entriesArray.length > 0)
    {
        for (let resolverEntryIndex = 0; resolverEntryIndex < entriesArray.length; resolverEntryIndex++)
        {
            //Find all the response records that share the .uriEntryId value:
            entriesArray[resolverEntryIndex].responses = await db.searchURIResponses(entriesArray[resolverEntryIndex].uriEntryId);

            //Now we have finished with uriEntryId, delete it as we don't want this internal database-generated number
            //surfacing via the API. Nor do we want issuerGLN appearing
            delete entriesArray[resolverEntryIndex].uriEntryId;
            delete entriesArray[resolverEntryIndex].issuerGLN;
        }

    }
    return entriesArray;
}

/**
 * Searches for Resolver Entries with the given GLN. As this could be a large dataset,
 * pageNumber and size is included allowing clients to read the data in batches
 * until no more rows are returned. Page sizes of no larger than 1000 rows are allowed.
 * @param issuerGLN
 * @param pageNumber
 * @param pageSize
 * @returns {Promise<*>}
 */
const searchURIEntriesByGLN = async (issuerGLN, pageNumber, pageSize) =>
{
    const entriesArray = await db.searchURIEntriesByGLN(issuerGLN, pageNumber, pageSize);
    return await searchResponsesForTheseEntries(entriesArray);
}


/**
 * Cleans a Resolver Entry object by removing some disallowed characters (\n, \r, ', and ;)
 * @param resolverEntry
 * @returns {*}
 */
const cleanResolverEntry = (resolverEntry) =>
{
    let cleanedResolverEntry = {};
    for (let [key, value] of Object.entries(resolverEntry))
    {
        if(typeof value === "string")
        {
            cleanedResolverEntry[key] = value.replace("\n", "").replace("\r", "").replace("'", "").replace(";", "").trim();
        }
        else
        {
            cleanedResolverEntry[key] = value;
        }
    }
    return cleanedResolverEntry;
};


/**
 * Sets the linkType to its CURIE version if found, and returns true
 * OR sets linktype to "" which is an error state, and returns false.
 * @param resolverResponse
 * @returns {boolean}
 */
const setLinkType = (resolverResponse) =>
{
    try
    {
        //Fill in any 'blanks' from the web page selections
        if (resolverResponse.linkType !== "")
        {
            //Check that the linktype is 'allowed': To this, we check if it in the list stored.
            //We check if it is a URI or CURIE. If so, there is nothing more we need to do as resolverResponse.linkType is 'API ready'.
            //If isTitle instead (which we test lowercase/trimmed versions for max compatibility, we quietly convert the linkType to its CURIE value.
            //If not any of the three, it's an error.
            try
            {
                const isCURIE = global['linkTypesArray'].find(linkType => linkType.curie.toLowerCase().trim() === resolverResponse.linkType.toLowerCase().trim());
                const isURI = global['linkTypesArray'].find(linkType => linkType.url.toLowerCase().trim() === resolverResponse.linkType.toLowerCase().trim());
                const isTitle = global['linkTypesArray'].find(linkType => linkType.title.toLowerCase().trim() === resolverResponse.linkType.toLowerCase().trim());

                if (!isCURIE && !isURI && !isTitle)
                {
                    //Force linktype to be blank which will trigger an error in calling code
                    resolverResponse.linkType = "";
                }
                else if (typeof isURI === 'object')
                {
                    //set the linktype to its CURIE version
                    resolverResponse.linkType = isURI['curie'];
                }
                else if (typeof isTitle === 'object')
                {
                    //set the linktype to its CURIE version
                    resolverResponse.linkType = isTitle['curie'];
                }
                else if (typeof isCURIE === 'object')
                {
                    //set the linktype to its CURIE version
                    resolverResponse.linkType = isCURIE['curie'];
                }
                else
                {
                    //It's unlikely we would end up here but we have code to deal with this as we are definitely in a data error.
                    resolverResponse.linkType = "";
                }
            }
            catch (e)
            {
                utils.logThis(`setLinkType error: ${e} with resolverResponse = ${JSON.stringify(resolverResponse)}`)
                resolverResponse.linkType = "";
            }
        }
        //Used to check linkTypes
        return resolverResponse.linkType !== "";
    }
    catch (e2)
    {
        utils.logThis(`setLinkType error: ${e2} with resolverResponse = ${JSON.stringify(resolverResponse)}`)
        return false;
    }

}


/**
 * Loops through the array of entries checking of there's anything immediately wrong with any entry.
 * The array validationResultsArray contains 'bad entries' which will be returned immediately
 * to the end user.
 * @param resolverEntriesArray
 * @returns {[]|*[]}
 */
const validateResolverEntriesArray_QuickCheck = (resolverEntriesArray) =>
{
    let validationResultsArray = [];
    if (Array.isArray(resolverEntriesArray))
    {
        for (let resolverEntry of resolverEntriesArray)
        {
            let result = validateResolverEntry_QuickCheck(resolverEntry);
            //Only add to the results array if it's not OK
            if (result.validationCode !== global.entryResponseStatusCode.OK)
            {
                //Bad entry found! We'll be sending it back as one of an array of bad entries
                //back to the end user. First, we'll change the numeric identificationKeyType back to its label
                //(e.g. '01' becomes 'gtin').
                resolverEntry.identificationKeyType = utils.convertAINumericToLabel(resolverEntry.identificationKeyType);
                //Now we push (add) this bad entry to the bottom of the array.
                validationResultsArray.push(validateResolverEntry_QuickCheck(resolverEntry));

            }
        }
        return validationResultsArray;
    }
    else
    {
        return [];
    }
}


/**
 * Checks that the mandatory elements of a resolver entry object are present. If all is well
 * The responses are sent via entryResponseStatusCode values initialised at the top of this source file:
 * @param resolverEntry
 * @returns {{identificationKey: string, identificationKeyType: string, validationCode: number}}
 */
const validateResolverEntry_QuickCheck = (resolverEntry) =>
{
    let returnObj = {
        identificationKeyType: resolverEntry.identificationKeyType,
        identificationKey: resolverEntry.identificationKey,
        qualifierPath: resolverEntry.qualifierPath,
        validationCode: global.entryResponseStatusCode.OK
    };

    //Check for the presence of all properties
    if (!checkResolverEntryPropertiesArePresent(resolverEntry))
    {
        returnObj.validationCode = global.entryResponseStatusCode.RESOLVER_ENTRY_MISSING_PROPERTIES;
        return returnObj;
    }

    //Now see if the entry passes a test from the GS1 DigitalLink Toolkit:
    const officialDef = utils.getGS1DigitalLinkToolkitDefinition(resolverEntry.identificationKeyType, resolverEntry.identificationKey);
    if (!officialDef.SUCCESS)
    {
        returnObj.validationCode = global.entryResponseStatusCode.FAILED_DIGITAL_LINK_TEST;
        return returnObj;
    }

    //loop through the responses looking for anything missing for the response.
    //NB I'm using a conventional for loop rather than for..of as I am making a change to resolverResponse.linkType
    //  which needs to be reflected in the resolverEntry object.
    for (let i=0; i < resolverEntry.responses.length; i++)
    {
        //If the title of the linktype was uploaded, change it to the CURIE version in this function call:
        //console.log('BEFORE', resolverEntry.responses[i]);
        setLinkType(resolverEntry.responses[i]);
        //console.log('AFTER', resolverEntry.responses[i]);

        //Now check it:
        setMissingDefaultsForAbsentResolverResponseProperties(cleanResolverEntry(resolverEntry.responses[i]));
        if (resolverEntry.responses[i] === null || !checkResolverResponsePropertiesArePresent(resolverEntry.responses[i]))
        {
            //Only one response in the resolverEntry.responses[] array has to be wrong for the whole entry to be marked as having missing properties.
            returnObj.validationCode = global.entryResponseStatusCode.RESOLVER_ENTRY_MISSING_PROPERTIES;
            return returnObj; //return early as we have found a problem with one of the responses
        }
    }

    return returnObj;
}


/**
 * Retrieves the validation results from the database and converts the property names from
 * DB format to API camelCase format.
 * @param issuerGLN
 * @param batchId
 * @returns {Promise<{STATUS: number, validations: []}>}
 */
const getValidationResultsForBatch = async (issuerGLN, batchId) =>
{
    const resultSet = await db.getValidationResultForBatchFromDB(issuerGLN, batchId);
    let resultsForAPI = {STATUS: resultSet.STATUS, validations: []}

    if (resultSet.STATUS === 1)
    {
        for (let result of resultSet.validations)
        {
            let resultForAPI = {
                identificationKeyType: result['identification_key_type'],
                identificationKey: result['identification_key'],
                validationCode: convertResponseStatusCodeFromDBValue(result['validation_code'])
            }
            resultsForAPI.validations.push(resultForAPI);
        }
    }

    return resultsForAPI;
}


/**
 * Not all properties need to be present on the inbound request, so defaults are set here if they are missing.
 * @param resolverEntry
 * @returns {{active}|*}
 */
const setMissingDefaultsForAbsentResolverEntryProperties = (resolverEntry) =>
{
    //Check for presence of the optional active flag. If not defined create it and set it to true,
    //otherwise set it to whatever boolean value it was beforehand
    resolverEntry.active = resolverEntry.active === undefined || resolverEntry.active;

    //If the qualifier path is missing, set it to "/":
    resolverEntry.qualifierPath = resolverEntry.qualifierPath === undefined ? "/" : resolverEntry.qualifierPath;

    return resolverEntry;
}


/**
 * The batch id is a randomly generated 9-digit number between 100000000 and 999999999
 * used to temporarily and uniquely identify a batch(single array upload) of entries in the database.
 * In the database, batchId adds to a unique combination of the GLN of the uploading user, and a time period
 * of up to 7 days giving a solid level of uniqueness for thr purpose needed (batchId is stored as an INT
 * in the uri_entries db table).
 */
const generateBatchId = () =>
{
    //These functions are sourced from:
    //https://stackoverflow.com/questions/33609404/node-js-how-to-generate-random-numbers-in-specific-range-using-crypto-randomby
    const randomC = (qty)       => {return format(crypto.randomBytes(qty), 'dec')};
    const random =  (low, high) => {return randomC(4)/Math.pow(2,4*8-1) * (high - low) + low};

    //I use the above two functions to generate the desired always-9-digit number:
    return parseInt(random(100000000,999999999));
}


/**
 * This function processes validation and insert / update of resolver entries.
 * It runs asynchronously, delivering all its results through the database via batchId.
 * It returns an array of all id key types and keys it successfully inserted
 * @param issuerGLN
 * @param requestBody
 * @param batchId
 * @returns {Promise<[]>}
 */
const saveResolverEntries = async (issuerGLN, requestBody, batchId) =>
{
    let savedUpsertArray = [];

    //Loop through the array or resolver entries
    for (let resolverEntry of requestBody)
    {
        //Clean and set missing (non mandatory) properties to make it a consistent resolver entry.
        const fullResolverEntry = setMissingDefaultsForAbsentResolverEntryProperties(cleanResolverEntry(resolverEntry));


        //If it passes validation we can insert or update this entry. If it fails we have already informed
        //the end user when they uploaded their entries. Yes this does mean running the QuickCheck a second time
        //but computationally it adds very little extra to the CPU overhead. This could be more elegant, however.
        if (validateResolverEntry_QuickCheck(fullResolverEntry).validationCode === global.entryResponseStatusCode.OK)
        {
            try
            {
                //First save the request of the entry. This function upsertURIEntry will return
                //an object like this: { SUCCESS: true, uriEntryID: 12345 }
                //..where uriEntryID is the primary key identity ID of the saved request part of
                //the resolver entry. This value will be used to link the responses to the request in
                //the SQL database.try
                const entryUpsertResult = await db.upsertURIEntry(issuerGLN, fullResolverEntry, batchId);

                //test for upsert success
                if (entryUpsertResult.SUCCESS)
                {
                    //Loop through each of the resolver response entries:
                    for (let resolverResponse of fullResolverEntry.responses)
                    {
                        //this line links the response(s) to the request (see comment above "const entryUpsertResult = await db.upsertURIEntry(..)")
                        resolverResponse.uriEntryId = entryUpsertResult.uriEntryId;

                        //Save the responses to the database:
                        await saveResolverResponse(resolverResponse);
                    }

                    //Add the successful save to the 'savedUpsertArray':
                    savedUpsertArray.push({
                            identificationKeyType: fullResolverEntry.identificationKeyType,
                            identificationKey: fullResolverEntry.identificationKey,
                            issuerGLN
                        });
                }
             }
            catch(err)
            {
                utils.logThis("saveResolverEntries Error: " + err);
            }
        }
    }
    return savedUpsertArray;
}


/**
 * validateEntries is where you can run some validation on uploaded entries
 * @param savedUpsertArray
 * @returns {Promise<void>}
 */
const validateEntries = async (savedUpsertArray) =>
{
    for (let i=0; i<savedUpsertArray.length; i++)
    {
        //This is simply to make the code easier to read
        let entry = savedUpsertArray[i];

        //TODO: Put your optional validation code here, which will result in a status value from the selection available in global.entryResponseStatusCodeInDB
        //In this next line, we simply set the result to global.entryResponseStatusCodeInDB.OK which has value 0. All 0 values
        //will subsequently be published from the "_prevalid" prefixed SQL tables into the non-prefixed equivalent tables.
        //Non-zero values will not be published. Your validation should result in an equivalent code from the list
        //global.entryResponseStatusCodeInDB
        const result = global.entryResponseStatusCodeInDB.OK;

        await db.saveValidationResult(entry.issuerGLN, entry.identificationKeyType, entry.identificationKey, result);
    }
}


/**
 * Checks to see if the GCP value is starts from within the first 3 chars of a key.
 * For example: keyHasSameGCP('09506000134352','95060001343') = true;
 * @param key
 * @param gcp
 * @returns {boolean}
 */
const keyHasSameGCP = (key, gcp) =>
{
    let result = false;
    for (let startPosition=0; startPosition < 3; startPosition++)
    {
        result = key.substring(startPosition).startsWith(gcp);
        if (result) return true;
    }
    return result;
}


/**
 * Passthrough middle-tier function asking the database to publish all entries
 * in the given batch that passed validation.
 * (A design rule I use forbids frontend API code form accessing the DB directly)
 * @param batchId
 * @returns {Promise<number>}
 */
const publishValidatedEntries = async (batchId) =>
{
    return await db.publishValidatedEntries(batchId);
}


const deleteResolverEntry = async (issuerGLN, identificationKeyType, identificationKey) =>
{
    try
    {
        return await db.deleteURIEntry(issuerGLN, identificationKeyType, identificationKey);
    }
    catch (err)
    {
        utils.logThis("deleteResolverEntry error: " + err);
    }
}


/**
 * Checks that all the Resolver entry properties are present (and implicitly correctly spelled)
 * @param resolverEntry
 * @returns {boolean}
 */
const checkResolverEntryPropertiesArePresent = (resolverEntry) =>
{
    try
    {
        //Check for the presence of all correct properties
        return resolverEntry.identificationKeyType !== undefined &&
            resolverEntry.identificationKey !== undefined &&
            resolverEntry.itemDescription !== undefined &&
            resolverEntry.qualifierPath !== undefined &&
            resolverEntry.active !== undefined &&
            resolverEntry.responses !== undefined &&
            Array.isArray(resolverEntry.responses) &&
            resolverEntry.identificationKeyType !== "" &&
            resolverEntry.identificationKey !== "" &&
            resolverEntry.itemDescription !== "" &&
            resolverEntry.qualifierPath !== "" &&
            resolverEntry.responses !== "";
    }
    catch (e)
    {
        utils.logThis(`checkResolverEntryPropertiesArePresent: entry ${JSON.stringify(resolverEntry)} has error: ${e}`);
        return false;
    }
}


/**
 * Checks that the mandatory elements of a resolverResponse object are present. If all is well
 * then the resolver response is returned - if not, null is returned.
 * (more checks can be added as needed) * @param resolverResponse
 * @returns {boolean}
 */
const checkResolverResponsePropertiesArePresent = (resolverResponse) =>
{
    //Check for the presence of mandatory data.
    try
    {
        return resolverResponse.linkType !== undefined &&
            resolverResponse.ianaLanguage !== undefined &&
            resolverResponse.context !== undefined &&
            resolverResponse.mimeType !== undefined &&
            resolverResponse.linkTitle !== undefined &&
            resolverResponse.targetUrl !== undefined &&
            resolverResponse.defaultLinkType !== undefined &&
            resolverResponse.defaultIanaLanguage !== undefined &&
            resolverResponse.defaultContext !== undefined &&
            resolverResponse.defaultMimeType !== undefined &&
            resolverResponse.fwqs !== undefined &&
            resolverResponse.active !== undefined &&
            resolverResponse.linkType.length > 6 &&
            resolverResponse.linkTitle !== "" &&
            utils.isValidIANALanguage(resolverResponse.ianaLanguage) &&
            utils.isValidMediaType(resolverResponse.mimeType) &&
            setLinkType(resolverResponse) &&
            lineIncludesInternetURIScheme(resolverResponse.targetUrl);
    }
    catch (e)
    {
        utils.logThis(`checkResolverResponsePropertiesArePresent: for response ${JSON.stringify(resolverResponse)} error ${e}`);
        return false;
    }
}



/**
 * Returns true if the data line includes an instance from this Non-exhaustive list
 * of URI schemes most likely to be used in an upload file.
 * This function is used as a simple way of detecting a data line since a target url
 * is a mandatory item of data to upload.
 * @param dataLine
 * @returns {boolean}
 */
const lineIncludesInternetURIScheme = (dataLine) =>
{
    return dataLine.includes('http://')  || //unencrypted web address
        dataLine.includes('https://') || //encrypted web address
        dataLine.includes('ftp://')   || //file transfer protocol (file download)
        dataLine.includes('sftp://')  || //secure file transfer protocol (file download)
        dataLine.includes('rtsp://')  || //media streaming protocol
        dataLine.includes('sip:')     || //internet telephone number
        dataLine.includes('tel:')     || //standard telephone number
        dataLine.includes('mailto:')     // create an email to send
}




/**
 * Not all properties need to be present on the inbound request, so defaults are set here if they are missing.
 * @param resolverResponse
 * @returns {{defaultMimeType}|*}
 */
const setMissingDefaultsForAbsentResolverResponseProperties = (resolverResponse) =>
{
    resolverResponse.active = resolverResponse.active === undefined || resolverResponse.active;
    resolverResponse.defaultLinkType = resolverResponse.defaultLinkType === undefined || resolverResponse.defaultLinkType;
    resolverResponse.defaultIanaLanguage = resolverResponse.defaultIanaLanguage === undefined || resolverResponse.defaultIanaLanguage;
    resolverResponse.defaultContext = resolverResponse.defaultContext === undefined || resolverResponse.defaultContext;
    resolverResponse.defaultMimeType = resolverResponse.defaultMimeType === undefined || resolverResponse.defaultMimeType;
    resolverResponse.ianaLanguage = resolverResponse.ianaLanguage === undefined ? "xx" : resolverResponse.ianaLanguage;
    resolverResponse.context = resolverResponse.context === undefined ? "xx" : resolverResponse.context;
    resolverResponse.mimeType = resolverResponse.mimeType === undefined ? "" : resolverResponse.mimeType;

    return resolverResponse;
}


/**
 * This function processes insert and update of a resolver response
 * @param incomingResolverResponse
 * @returns {Promise<boolean>}
 */
const saveResolverResponse = async (incomingResolverResponse) =>
{
    const resolverResponse = setMissingDefaultsForAbsentResolverResponseProperties(cleanResolverEntry(incomingResolverResponse));
    if(checkResolverResponsePropertiesArePresent(resolverResponse))
    {
        const result = await db.upsertURIResponse(resolverResponse);
        return result.SUCCESS;
    }
    else
    {
        return false;
    }
}

module.exports = {
    searchResolverEntriesByKey,
    searchURIEntriesByGLN,
    countEntriesUsingGLN,
    cleanResolverEntry,
    saveResolverEntries,
    deleteResolverEntry,
    validateResolverEntriesArray_QuickCheck,
    validateEntries,
    generateBatchId,
    publishValidatedEntries,
    getValidationResultsForBatch
}