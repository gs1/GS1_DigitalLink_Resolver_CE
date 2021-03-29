const { getURIEntriesSQLData } = require('../db/mssql-controller/uriTableOps');
const utils = require('../resolverUtils');
const { createUnixTimeIndex } = require('../db/mongo-controller/resolverGenericOps');
const { decodeSQLSafeResolverArray } = require('./controllerUtils');
const buildURIDocuments = require('./buildURIDocumentsController');

const rowBatchSize = process.env.SQLDB_PROCESS_BATCH_SIZE || 1000;

/**
 * Performs a build based on all the changes that have happened since this server last registered with the database.
 * @returns {Promise<void>}
 * @param lastHeardDateTime
 * @param fullBuildFlag
 */
const performSyncURIDocumentBuild = async (lastHeardDateTime, fullBuildFlag) => {
  if (fullBuildFlag) {
    await createUnixTimeIndex();
  }

  let nextUriEntryId = 0;

  // This code will now loop until no more URI entries are returned from the database
  /* eslint-disable no-constant-condition */
  while (true) {
    try {
      // get the first / next set of URI entries. Entries are return by the database in
      // ascending uriEntryId order
      let entrySet = await getURIEntriesSQLData(lastHeardDateTime, nextUriEntryId, rowBatchSize);
      entrySet = decodeSQLSafeResolverArray(entrySet);
      if (entrySet === null || entrySet.length === 0) {
        // No more entries so break out of the loop:
        break;
      } else {
        // We have one or more URI entries to Build:
        await buildURIDocuments(entrySet, fullBuildFlag);
        nextUriEntryId = parseInt(entrySet[entrySet.length - 1].uri_entry_id, 10) + 1;
      }
    } catch (err) {
      // It's all gone terribly wrong! Better make a note of the error and exit the loop
      utils.logThis(`performSyncURIDocumentBuild error: ${err}`);
      break;
    }
  }
};

module.exports = {
  performSyncURIDocumentBuild,
};
