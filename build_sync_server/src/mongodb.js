const MongoClient = require('mongodb').MongoClient;
const utils = require("./resolver_utils");

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
 * @param gs1KeyCode
 * @param gs1KeyValue
 * @param collectionName
 * @returns {Promise<null>}
 */
const findEntryInMongoDB = async (gs1KeyCode, gs1KeyValue, collectionName) =>
{
    let result = null;
    try
    {
        if(await connectToMongoDB())
        {
            let collection = mongoClient.db("gs1resolver").collection(collectionName);
            result = await collection.findOne({"_id": "/" + gs1KeyCode + "/" + gs1KeyValue});
        }
        return result;
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
                let dbId = {};
                //No DB ID record was found, so create one from this container's current HOSTNAME
                dbId["_id"] = "database_id";
                dbId.databaseId = randomClusterDBNameGenerator();
                global.syncHostName = dbId.databaseId;
                const result = await collection.replaceOne({"_id": dbId["_id"]}, dbId, { upsert: true });
            }
            else
            {
                //Obtain the sync host name from the pre-saved database record
                global.syncHostName = dbId.databaseId;
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
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 12; i++)
    {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
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
        utils.logThis(`STOPPING PROGRAM! updateDocumentInMongoDB error: ${e}`);
        process.exit(1);
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


module.exports = {
    findEntryInMongoDB,
    updateDocumentInMongoDB,
    deleteDocumentInMongoDB,
    getResolverDatabaseIdFromMongoDB,
    closeDB
};
