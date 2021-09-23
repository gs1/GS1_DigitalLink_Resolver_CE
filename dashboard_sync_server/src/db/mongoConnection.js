// eslint-disable-next-line import/no-unresolved
const { MongoClient } = require('mongodb');

const mongoConnString = process.env.MONGODBCONN;

const mongoConnection = async () => {
  const mongoClient = new MongoClient(mongoConnString, { useNewUrlParser: true, useUnifiedTopology: true });
  // eslint-disable-next-line import/no-unresolved
  const connClient = await mongoClient.connect();
  return connClient;
};

module.exports = mongoConnection;
