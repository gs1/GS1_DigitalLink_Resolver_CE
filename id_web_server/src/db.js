const MongoClient = require('mongodb').MongoClient;
const uri = process.env.DBCONN;

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
        const mongoClient = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
        let connClient = await mongoClient.connect();
        let collection = connClient.db("gs1resolver").collection("uri");
        let finalResult = await collection.findOne({"_id": "/" + gs1KeyCode + "/" + gs1KeyValue});
        console.log("findDigitalLinkEntryInDB: found entry for ","/" + gs1KeyCode + "/" + gs1KeyValue);
        await mongoClient.close();
        return finalResult;
    }
    catch (e)
    {
        console.log("findDigitalLinkEntryInDB error:", e);
        return null;
    }
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
    console.log("findPrefixEntry: Starting prefix search");
    let finalResult = null;
    try
    {
        const mongoClient = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
        let connClient = await mongoClient.connect();
        let collection = connClient.db("gs1resolver").collection("gcp");

        //To find a match we must chop off more and more of a GS1 Key Value until we get a match
        const gs1KeyValueOriginalLength = gs1KeyValue.length;
        for (let gs1KeyValueLength = gs1KeyValueOriginalLength; gs1KeyValueLength > 3; gs1KeyValueLength--)
        {
            let partialGS1KeyValue = gs1KeyValue.substring(0, gs1KeyValueLength -1);
            console.log("GCP search:", partialGS1KeyValue);
            finalResult = await collection.findOne({"_id": "/" + gs1KeyCode + "/" + partialGS1KeyValue});
            if (finalResult !== null)
            {
                console.log("Found GCP - entry is:", finalResult);
                break;  //we've found a result - stop the loop early!
            }
        }
        await mongoClient.close();
        console.log("Returning GCP entry is:", finalResult);
        return finalResult;
    }
    catch (e)
    {
        console.log("findPrefixEntry error:", e);
        return null;
    }

};


module.exports.findDigitalLinkEntry = findDigitalLinkEntryInDB;
module.exports.findPrefixEntry = findPrefixEntry;