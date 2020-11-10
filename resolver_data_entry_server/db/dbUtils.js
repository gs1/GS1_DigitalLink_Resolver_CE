const sql = require('mssql');
const getConnection = require('./dbConnection');

exports.makeDBConnectionAndPS = async () => {
  const dbConnection = await getConnection();
  const ps = new sql.PreparedStatement(dbConnection);
  return ps;
};
