const mongoConnection = require('../mongoConnection');
const utils = require('../../resolverUtils');

/**
 * Finds either a URI or GCP entry in the MongoDB database, as the format of the key
 * to each document is identical: "/<gs1-or-gcp-key-code>/<gs1-or-gcp-key-value>"
 * @param identificationKeyType
 * @param identificationKey
 * @param collectionName
 * @returns {Promise<null>}
 */
const findEntryInMongoDB = async (identificationKeyType, identificationKey, collectionName) => {
  try {
    const mongoConn = await mongoConnection();
    const collection = mongoConn.db('gs1resolver').collection(collectionName);
    const result = await collection.findOne({ _id: `/${identificationKeyType}/${identificationKey}` });
    await mongoConn.close();
    return result;
  } catch (e) {
    utils.logThis('Error findEntryInMongoDB method of resolverDocumentOps');
    utils.logThis(e);
    return null;
  }
};

/**
 * Deletes a resolver document in MongoDB
 * @param doc
 * @param collectionName
 * @returns {Promise<boolean>}
 */
const deleteDocumentInMongoDB = async (doc, collectionName) => {
  try {
    const mongoConn = await mongoConnection();
    const collection = mongoConn.db('gs1resolver').collection(collectionName);
    const deleteResult = await collection.deleteOne({ _id: doc._id });
    await mongoConn.close();
    return deleteResult.result.ok === 1; // <- equates to true or false
  } catch (e) {
    utils.logThis('Error deleteDocumentInMongoDB method of resolverDocumentOPs');
    utils.logThis(e);
    return false;
  }
};

/**
 * Inserts or Updates ('upserts') a single MongoDB resolver record
 * @param doc
 * @param collectionName
 * @returns {Promise<boolean>}
 */
const updateDocumentInMongoDB = async (doc, collectionName) => {
  try {
    const mongoConn = await mongoConnection();
    const db = mongoConn.db('gs1resolver');
    const collection = db.collection(collectionName);
    const updateResult = await collection.replaceOne({ _id: doc._id }, doc, { upsert: true });
    await mongoConn.close();
    return updateResult.result.ok === 1; // <- equates to true or false
  } catch (e) {
    utils.logThis('Error updateDocumentInMongoDB method of resolverDocumentOps: ');
    return false;
  }
};

module.exports = {
  findEntryInMongoDB,
  deleteDocumentInMongoDB,
  updateDocumentInMongoDB,
};
