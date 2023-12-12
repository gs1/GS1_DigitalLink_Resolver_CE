const { MongoClient } = require('mongodb');

const mongoConnection = process.env.MONGODBCONN || process.env.DBCONN;

let connClient;

/**
 * This function is used to establish a connection to the MongoDB database.
 * It uses the singleton pattern to ensure that only a single instance of the MongoDB connection is created.
 * If a connection already exists and is active, it will be reused instead of creating a new one.
 * @returns {Promise<MongoClient>} The MongoDB client instance.
 */
const dbConnection = async () => {
  if (!connClient || !connClient.isConnected()) {
    const mongoClient = new MongoClient(mongoConnection, { useNewUrlParser: true, useUnifiedTopology: true });
    connClient = await mongoClient.connect();
  }
  return connClient;
};

module.exports = dbConnection;