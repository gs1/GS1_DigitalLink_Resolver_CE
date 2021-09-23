/* eslint-disable new-cap */
/**
 * sqldb.js provides the complete interface to Resolver's SQL Server database. All SQL entries are requested via this file.
 * As a result, any desired database brand change from Microsoft SQL Server requires alterations only to this file.
 */
// eslint-disable-next-line import/no-unresolved
const sql = require('mssql');
const utils = require('../resolverUtils');

/**
 * Gets the server config connection details from environment variables provided in the Dockerfile
 * @type {{server: string, password: string, database: string, options: {encrypt: boolean, enableArithAbort: boolean}, user: string}}
 */

const sqlServerConfig = {
  user: process.env.SQLDBCONN_USER,
  password: process.env.SQLDBCONN_PASSWORD,
  server: process.env.SQLDBCONN_SERVER,
  database: process.env.SQLDBCONN_DB,
  connectionTimeout: +process.env.SQLDBCONN_CONNECTION_TIMEOUT || 30000,
  options: {
    encrypt: true,
    enableArithAbort: true,
    trustServerCertificate: true,
  },
  pool: {
    max: +process.env.SQLDBCONN_MAX_POOL || 10,
    min: +process.env.SQLDBCONN_MIN_POOL || 1,
    idleTimeoutMillis: +process.env.SQLDB_POOL_IDLE_TIMEOUT || 3000,
  },
};

let pool = null;
const closePool = async () => {
  try {
    // try to close the connection pool
    await pool.close();
    // set the pool to null to ensure
    // a new one will be created by getConnection()
    pool = null;
  } catch (err) {
    // error closing the connection (could already be closed)
    // set the pool to null to ensure
    // a new one will be created by getConnection()
    pool = null;
    utils.logThis('Close MSSQL Close Pool Error');
    utils.logThis(err.message);
  }
};
const sqlConnection = async () => {
  try {
    if (pool) {
      // has the connection pool already been created?
      // if so, return the existing pool
      // utils.logThis('Return existing pool connection without creating a new connection to DB');
      return pool;
    }
    // create a new connection pool
    utils.logThis('Making a new connection to DB Client');
    pool = await sql.connect(sqlServerConfig);
    // catch any connection errors and close the pool
    pool.on('error', async (err) => {
      utils.logThis('DB Connection Pool Error');
      utils.logThis(err.message);
      await closePool();
    });
    utils.logThis('Connected to SQLServer DB successfully');
    return pool;
  } catch (err) {
    // error connecting to SQL Server
    utils.logThis('Error connecting to sql server');
    utils.logThis(err.message);
    pool = null;
  }
};

module.exports = sqlConnection;
