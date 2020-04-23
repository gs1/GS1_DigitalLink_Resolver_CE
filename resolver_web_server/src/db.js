const MongoClient = require('mongodb').MongoClient;
const resolverutils = require("./resolver_utils");
const fetch = require("node-fetch");
const mongoConnection = process.env.MONGODBCONN;

//This server can call across to the build sync server to ask it to see if there is an entry
//for this request in the SQL database. However this can put the SQL service under strain so
//if there is no 'BUILDSYNCSERVICE' environment variable in Dockerfile (or Compose / K8s deployment)
// then this variable is set to 'N/A' which stops an attempt being made.
const buildSyncServer = process.env.BUILDSYNCSERVICE || 'N/A'


/**
 * findDigitalLinkEntry runs the function findDigitalLinkEntryInDB to get the local entry for the URI document.
 * If one cannot be found, it runs function requestBuildSearchForGS1KeyCodeAndValue which asks the build server
 * to check with the central SQL database. If an entry is found there, Build will insert it into the local database
 * and return 'true' so that this function can 'ask' the local database again.
 * This request can be overridden by removing the environment variable BUILDSYNCSERVICE from Dockerfile / Compose / K8s Deployment
 * (see variable declaration for 'buildSyncServer' at the top of this file)
 * @param gs1KeyCode
 * @param gs1KeyValue
 * @returns {Promise<{}>}
 */
const findDigitalLinkEntry = async (gs1KeyCode, gs1KeyValue) =>
{
    let result = await findDigitalLinkEntryInDB(gs1KeyCode, gs1KeyValue);
    if(!result && buildSyncServer !== 'N/A')
    {
        if(await requestBuildSearchForGS1KeyCodeAndValue(gs1KeyCode, gs1KeyValue))
        {
            result = await findDigitalLinkEntryInDB(gs1KeyCode, gs1KeyValue);
        }
    }
    return result;
};

/**
 * findDigitalLinkEntryInDB connects to the document database and looks for the document
 * for the values in gs1KeyCode and gs1KeyValue
 * @param gs1KeyCode
 * @param gs1KeyValue
 * @returns {Promise<{}>}
 */
const findDigitalLinkEntryInDB = async (gs1KeyCode, gs1KeyValue) =>
{
    try
    {
        const mongoClient = new MongoClient(mongoConnection, {useNewUrlParser: true, useUnifiedTopology: true});
        let connClient = await mongoClient.connect();
        let collection = connClient.db("gs1resolver").collection("uri");
        let finalResult = await collection.findOne({"_id": "/" + gs1KeyCode + "/" + gs1KeyValue});
        await mongoClient.close();
        return finalResult;
    }
    catch (e)
    {
        resolverutils.logThis(`findDigitalLinkEntryInDB error: ${e}`);
        return null;
    }
};


/**
 * Asks the build_sync_server to see if it can find this missing entry from SQL DB. This function doers this
 * by calling the 'buildkey' command on build_sync_server's web service.
 * URL call is: http://build_sync_server/buildkey/<gs1KeyCode></gs1KeyValue> and await a true or false success value
 *
 * @param gs1KeyCode
 * @param gs1KeyValue
 * @returns {Promise<boolean>}
 */
const requestBuildSearchForGS1KeyCodeAndValue = async (gs1KeyCode, gs1KeyValue) =>
{
    let success = false;
    if (buildSyncServer !== 'N/A')
    {
        const buildSyncServerURL = `http://${buildSyncServer}/buildkey/${gs1KeyCode}/${gs1KeyValue}`;
        resolverutils.logThis(buildSyncServerURL);
        try
        {
            const response = await fetch(buildSyncServerURL);
            const result = await response.json();
            success = result['SUCCESS'] === "Y";
        }
        catch (error)
        {
            resolverutils.logThis(`requestBuildSearchForGS1KeyCodeAndValue error: ${error}`);
        }
    }
    return success;
};


/**
 * findPrefixEntry looks for prefix versions of the gs1KeyValue. It is normally called should
 * no match be found by function findDigitalLinkEntryInDB().
 * @param gs1KeyCode
 * @param gs1KeyValue
 * @returns {Promise<{}>}
 */
const findPrefixEntry = async (gs1KeyCode, gs1KeyValue) =>
{
    let finalResult = null;
    try
    {
        const mongoClient = new MongoClient(mongoConnection, {useNewUrlParser: true, useUnifiedTopology: true});
        let connClient = await mongoClient.connect();
        let collection = connClient.db("gs1resolver").collection("gcp");

        //To find a match we must chop off more and more of a GS1 Key Value until we get a match
        const gs1KeyValueOriginalLength = gs1KeyValue.length;
        for (let gs1KeyValueLength = gs1KeyValueOriginalLength; gs1KeyValueLength > 3; gs1KeyValueLength--)
        {
            let partialGS1KeyValue = gs1KeyValue.substring(0, gs1KeyValueLength -1);
            finalResult = await collection.findOne({"_id": "/" + gs1KeyCode + "/" + partialGS1KeyValue});
            if (finalResult !== null)
            {
                break;  //we've found a result - stop the loop early!
            }
        }
        await mongoClient.close();
        return finalResult;
    }
    catch (e)
    {
        resolverutils.logThis(`findPrefixEntry error: ${e}`);
        return null;
    }

};


module.exports = {
    findDigitalLinkEntry,
    requestBuildSearchForGS1KeyCodeAndValue,
    findPrefixEntry
};