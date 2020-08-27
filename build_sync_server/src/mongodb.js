const MongoClient = require('mongodb').MongoClient;
const crypto = require('crypto');
const utils = require("./resolverUtils");

const mongoConnString = process.env.MONGODBCONN;

//A global (to this file) mongoClient.
let mongoClient = null;

let connectedToMongoDBFlag = false;

/**
 * Connects to the MongoDB server storing Resolver's documents
 * @returns {Promise<null|MongoClient>}
 */
const connectToMongoDB = async () =>
{
    if(mongoClient === null || !mongoClient.isConnected())
    {
        try
        {
            mongoClient = new MongoClient(mongoConnString, {useNewUrlParser: true, useUnifiedTopology: true});
            await mongoClient.connect();
            connectedToMongoDBFlag = true;
            utils.logThis("Connected to MongoDB successfully");
        }
        catch (error)
        {
            utils.logThis(`connectToMongoDB error: ${error}`);
            connectedToMongoDBFlag = false;
        }
    }
    return connectedToMongoDBFlag;
};


/**
 * Closes the database
 * @returns {Promise<void>}
 */
const closeDB = async () =>
{
    if(connectedToMongoDBFlag)
    {
        await mongoClient.close();
    }
    connectedToMongoDBFlag = false;
};


/**
 * Finds either a URI or GCP entry in the MongoDB database, as the format of the key
 * to each document is identical: "/<gs1-or-gcp-key-code>/<gs1-or-gcp-key-value>"
 * @param identificationKeyType
 * @param identificationKey
 * @param collectionName
 * @returns {Promise<null>}
 */
const findEntryInMongoDB = async (identificationKeyType, identificationKey, collectionName) =>
{
    try
    {
        if(await connectToMongoDB())
        {
            let collection = mongoClient.db("gs1resolver").collection(collectionName);
            return await collection.findOne({"_id": "/" + identificationKeyType + "/" + identificationKey});
        }
    }
    catch (e)
    {
        utils.logThis(`findEntryInMongoDB error: ${e}`);
        return null;
    }
};


/**
 * gets (and if necessary sets) the syncHistName from a database I stored in MongoDB.
 * If there is no such entry then the container's currrent HOSTNAME is used. After that,
 * the database will carry that name for synchronising purposes even when the container
 * changes its hostname after a rebuild.
 */
const getResolverDatabaseIdFromMongoDB = async () =>
{
    try
    {
        if(await connectToMongoDB())
        {
            let collection = mongoClient.db("gs1resolver").collection("database_id");
            let dbId = await collection.findOne({"_id": "database_id"});
            if(dbId === null)
            {
                //No DB ID record was found, so make dbId a new object
                //and create a name using randomClusterDBNameGenerator()
                dbId = {};
                dbId["_id"] = "database_id";
                dbId.databaseId = randomClusterDBNameGenerator();
                global.syncId = dbId.databaseId;

                //Save the new name into the Mongo database
                await collection.replaceOne({"_id": dbId["_id"]}, dbId, { upsert: true });
            }
            else
            {
                //Obtain the sync Id from the pre-saved database record which remains consistent
                //even if the build sync server is killed and re-spawned with a different Host name.
                global.syncId = dbId.databaseId;
            }
        }
        else
        {
            utils.logThis("getResolverDatabaseIdFromMongoDB error: Unable to connect to Mongo DB");
            global.syncHostName = null;
        }
    }
    catch (e)
    {
        utils.logThis(`getResolverDatabaseIdFromMongoDB error: ${e}`);
        global.syncHostName = null;
    }
};


/**
 * Generates a 12-character random value for use with getResolverDatabaseIdFromMongoDB();
 * @returns {string}
 */
const randomClusterDBNameGenerator = () =>
{
    return crypto.randomBytes(Math.ceil(12 / 2)).toString('hex');
};

/**
 * Inserts or Updates ('upserts') a single MongoDB resolver record
 * @param doc
 * @param collectionName
 * @returns {Promise<boolean>}
 */
const updateDocumentInMongoDB = async (doc, collectionName) =>
{
    try
    {
        if(await connectToMongoDB())
        {
            let db = mongoClient.db("gs1resolver");
            let collection = db.collection(collectionName);
            let updateResult = await collection.replaceOne({"_id": doc["_id"]}, doc, { upsert: true });
            return updateResult.result.ok === 1; // <- equates to true or false
        }
        else
        {
            utils.logThis("updateDocumentInMongoDB error: Unable to connect to Mongo DB");
            return false;
        }
    }
    catch (e)
    {
        utils.logThis(`updateDocumentInMongoDB error: ${e}`);
        return false;
    }
};

/**
 * Deletes a resolver document in MongoDB
 * @param doc
 * @param collectionName
 * @returns {Promise<boolean>}
 */
const deleteDocumentInMongoDB = async (doc, collectionName) =>
{
    try
    {
        if(await connectToMongoDB())
        {
            let collection = mongoClient.db("gs1resolver").collection(collectionName);
            let deleteResult = await collection.deleteOne({"_id": doc["_id"]});
            return deleteResult.result.ok === 1;  // <- equates to true or false
        }
        else
        {
            utils.logThis("deleteDocumentInMongoDB error: Unable to connect to Mongo DB");
            return false;
        }
    }
    catch (e)
    {
        utils.logThis(`deleteDocumentInMongoDB error: ${e}`);
        return false;
    }
};


/**
 * Empties the collection of data - used when build sync server not heard by SQL DB.
 * @param collectionName
 * @returns {Promise<boolean>}
 */
const dropCollection = async (collectionName) =>
{
    try
    {
        if(await connectToMongoDB())
        {
            let collection = mongoClient.db("gs1resolver").collection(collectionName);
            const dropResult = await collection.drop();
            utils.logThis(`dropCollection: collection ${collectionName} dropped (emptied): ${dropResult}`);
            return dropResult;  // <- equates to true or false
        }
        else
        {
            utils.logThis("dropCollection error: Unable to connect to Mongo DB");
            return false;
        }
    }
    catch (e)
    {
        utils.logThis(`dropCollection error: ${e}`);
        return false;
    }
};







/**
 * Creates the unixtime index which is used for indexing the data
 * @returns {Promise<boolean>}
 */
const createUnixTimeIndex = async () =>
{
    utils.logThis("Building 'unixtime' index");
    try
    {
        if(await connectToMongoDB())
        {
            let collection = mongoClient.db("gs1resolver").collection("uri");
            let result = await collection.createIndex({ unixtime: 1 } );
            await mongoClient.close();
            utils.logThis("Index 'unixtime' build completed");
            return result.ok === 1;
        }
        else
        {
            utils.logThis("createUnixTimeIndex error: Unable to connect to Mongo DB");
            return false;
        }
    }
    catch (err)
    {
        utils.logThis(`createUnixTimeIndex error: ${err}`);
        return false;
    }
};

module.exports = {
    findEntryInMongoDB,
    updateDocumentInMongoDB,
    deleteDocumentInMongoDB,
    getResolverDatabaseIdFromMongoDB,
    createUnixTimeIndex,
    dropCollection,
    closeDB
};
