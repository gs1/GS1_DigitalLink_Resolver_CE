const { getGCPRedirectsSQLData } = require('../db/mssql-controller/gcpTableOps');
const utils = require('../resolverUtils');
const { findEntryInMongoDB, updateDocumentInMongoDB, deleteDocumentInMongoDB } = require('../db/mongo-controller/resolverDocumentOps');

const rowBatchSize = process.env.SQLDB_PROCESS_BATCH_SIZE || 1000;

/**
 * Performs a build based on all the changes to GCP records that have happened since this server last registered with the database.
 * @returns {Promise<void>}
 * @param lastHeardDateTime
 * @param fullBuildFlag
 */
const performSyncGCPDocumentBuild = async (lastHeardDateTime, fullBuildFlag) => {
  /* eslint-disable no-constant-condition */
  let nextGCPRedirectId = 0;
  while (true) {
    try {
      const gcpSet = await getGCPRedirectsSQLData(lastHeardDateTime, nextGCPRedirectId, rowBatchSize);
      if (gcpSet === null || gcpSet.length === 0) {
        break;
      } else {
        await buildGCPDocuments(gcpSet, fullBuildFlag);
        nextGCPRedirectId = gcpSet[gcpSet.length - 1].gcp_redirect_id + 1;
      }
    } catch (err) {
      utils.logThis(`performSyncGCPDocumentBuild error: ${err}`);
      break;
    }
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
const buildGCPDocuments = async (gcpRedirectSet, fullBuildIfTrue) => {
  try {
    let processCounter = 0;
    utils.logThis(`Processing batch of ${gcpRedirectSet.length} GCP redirect entries`);
    for (const gcpRedirectEntry of gcpRedirectSet) {
      processCounter += 1;
      const identificationKeyType = gcpRedirectEntry.identification_key_type.trim();
      const prefixValue = gcpRedirectEntry.prefix_value.trim();
      const redirectURL = gcpRedirectEntry.target_url.trim();

      if (processCounter % 100 === 0) {
        utils.logThis(`Processed count: ${processCounter} of ${gcpRedirectSet.length}`);
      }

      await findEntryInMongoDB(identificationKeyType, prefixValue, 'gcp');

      // The GCP document is far simpler than the URI document, with just an ID and URL.
      // So we will create the document here and insert/update it in the MongoDB database.
      const doc = {
        _id: `/${identificationKeyType}/${prefixValue}`,
        resolve_url_format: redirectURL,
      };

      if (fullBuildIfTrue) {
        await updateDocumentInMongoDB(doc, 'gcp');
      } else {
        const updateOrDeleteFlag = gcpRedirectEntry.active;
        if (updateOrDeleteFlag) {
          await updateDocumentInMongoDB(doc, 'gcp');
        } else {
          // Delete the GCP entry using its key:
          await deleteDocumentInMongoDB({ _id: `/${identificationKeyType}/${prefixValue}` }, 'gcp');
        }
      }
    }
  } catch (err) {
    utils.logThis(`buildGCPDocuments error: ${err}`);
  }
};

module.exports = {
  performSyncGCPDocumentBuild,
};
