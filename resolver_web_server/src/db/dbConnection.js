const { MongoClient } = require('mongodb');

const mongoConnection = process.env.MONGODBCONN || process.env.DBCONN;

const dbConnection = async () => {
  const mongoClient = new MongoClient(mongoConnection, { useNewUrlParser: true, useUnifiedTopology: true });
  const connClient = await mongoClient.connect();
  return connClient;
};

module.exports = dbConnection;
