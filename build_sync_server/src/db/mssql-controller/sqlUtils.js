/* eslint-disable new-cap */
// eslint-disable-next-line import/no-unresolved
const sql = require('mssql');
const sqlConnection = require('../sqlConnection');

exports.makeSQLConnectionWithPS = async () => {
  const dbConnection = await sqlConnection();
  const ps = new sql.PreparedStatement(dbConnection);
  return ps;
};
