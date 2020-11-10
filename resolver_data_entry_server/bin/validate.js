/**
 * This file contains code for 'offline' batch validation of entries.
 * The requirements for validation will vary by Resolver, but its purpose
 * is to take a batch of entries fround in the database's [uri_entries_prevalid] table
 * and validate them against an algorithm and/or external data source.
 * Importantly, the API end-user has been disconnected from the APi having uploaded
 * their batch of entries (and been given a 'batchId'). The function validateBatchOfEntries()
 * then takes a batch of entries, validates them, and saves the results back to the [uri_entries_prevalid] table.
 * Note that these are async functions so you can use fetch to call an external API, or await a data source
 * to respond.
 */

//const fetch = require('node-fetch');  //Not used by default but is here if you need to call an external API as part of validation
const dbDataEntries = require('./../db/query-controller/data-entries')

/**
 * Use this function to performs a validation on each entry. The variable 'entry' represents one complete
 * entry,
 * @returns {Promise<{dbStatusCode: number}>}
 * @param entry
 */
const validateKeyEntry = async (entry) => {
    console.log(entry);
    const validationResult = {
        dbStatusCode: global.entryResponseStatusCodeInDB.NOT_YET_VALIDATED,
    };

    //Put your validation code here!
    validationResult.dbStatusCode = global.entryResponseStatusCodeInDB.OK;

    return validationResult;
};


/**
 * This function is used to control the validation of a batch of entries.
 * Each entry is tested and, if found to be valid by validateKeyEntry(), is saved into the main (non-'prevalid').
 * entries and responses tables.
 * @param savedUpsertArray
 * @returns {Promise<void>}
 */
const validateBatchOfEntries = async (savedUpsertArray) => {
    for (const entry of savedUpsertArray)
    {
        const validationResult = await validateKeyEntry(entry);
        await dbDataEntries.saveDataEntriesURIValidationResultToDB(entry.issuerGLN, entry.identificationKeyType, entry.identificationKey, validationResult.dbStatusCode);
    }
};

module.exports = { validateBatchOfEntries }