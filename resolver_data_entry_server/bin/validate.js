/**
 * This file contains code for optional 'offline' batch validation of entries.
 * It's here so that you can perform your own extra custom validations in order
 * to maintain Data Quality.
 *
 * The requirements for validation will vary by Resolver, but its purpose
 * is to take a batch of entries fround in the database's [uri_entries_prevalid] table
 * and validate them against an algorithm and/or external data source.
 *
 * Each uploaded entry is offered in turn to function validateKeyEntry(entry) below. Use this function
 * to perform a validation on each entry. The variable 'entry' represents one complete entry.
 *
 * Importantly, the API end-user has been disconnected from the API having uploaded
 * their batch of entries and been given a 'batchId'.
 *
 * Note that these are async functions, so you can use fetch to call an external API,
 * or await a data source to respond.
 */

const dbDataEntries = require('./../db/query-controller/data-entries')

/**
 * Use this function to perform a validation on each entry. The variable 'entry' represents one complete
 * entry,
 * @returns {Promise<{dbStatusCode: number}>}
 * @param entry
 */
const validateKeyEntry = async (entry) => {
    const validationResult = {
        dbStatusCode: global.entryResponseStatusCodeInDB.NOT_YET_VALIDATED,
    };

    // Put your validation code here that takes the entry and validates it.
    // As there is no such code right now, this function will always return a 'OK' response.
    // See resolver_data_entry_server/bin/globalVariables.js for list of response codes
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
