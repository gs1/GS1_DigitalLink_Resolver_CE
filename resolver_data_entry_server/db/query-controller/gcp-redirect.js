const sql = require('mssql');
const { makeDBConnectionAndPS } = require('../dbUtils');
const utils = require('../../bin/resolver_utils');

const checkAPIAuth = async (authKey) => {
  try {
    const ps = await makeDBConnectionAndPS();
    ps.input('authKey', sql.TYPES.NVarChar(64));
    await ps.prepare('EXEC [READ_Resolver_Auth] @authKey');
    const queryResponse = await ps.execute({ authKey });
    ps.unprepare();
    return queryResponse.recordset;
  } catch (e) {
    utils.logThis('Error to connect DB (SQL Procedure Exception) authkey: ', authKey);
    utils.logThis(message);
  }
};

/**
 * Retrieves one or all GCPs for a given issuerGLN
 * @param issuerGLN
 * @param identificationKeyType
 * @param gcp
 */
const searchGCPRedirectsByGLN = async (issuerGLN, identificationKeyType, gcp) => {
  try {
    const ps = await makeDBConnectionAndPS();
    ps.input('issuerGLN', sql.TYPES.NChar(13));
    let queryResponse = null;
    if (identificationKeyType && gcp) {
      ps.input('identificationKeyType', sql.TYPES.NVarChar(20));
      ps.input('gcp', sql.TYPES.NVarChar(45));
      await ps.prepare('EXEC [READ_GCP_Redirect] @issuerGLN, @identificationKeyType, @gcp');
      queryResponse = await ps.execute({
        issuerGLN,
        identificationKeyType,
        gcp,
      });
    } else {
      await ps.prepare('EXEC [GET_GCP_Redirects] @issuerGLN');
      queryResponse = await ps.execute({ issuerGLN });
    }
    ps.unprepare();
    return queryResponse.recordset;
  } catch (e) {
    utils.logThis(e.message);
  }
};

const upsertGCPRedirect = async ({ issuerGLN, identificationKeyType, gcp, targetUrl, active }) => {
  try {
    const ps = await makeDBConnectionAndPS();
    ps.input('issuerGLN', sql.TYPES.NChar(13));
    ps.input('identificationKeyType', sql.TYPES.NVarChar(20));
    ps.input('gcp', sql.TYPES.NVarChar(45));
    ps.input('targetUrl', sql.TYPES.NVarChar(255));
    ps.input('active', sql.TYPES.Bit());
    await ps.prepare('EXEC [UPSERT_GCP_Redirect] @issuerGLN, @identificationKeyType, @gcp, @targetUrl, @active');
    await ps.execute({
      issuerGLN,
      identificationKeyType,
      gcp,
      targetUrl,
      active,
    });
    await ps.unprepare();
    return true;
  } catch (e) {
    utils.logThis(e.message);
    return false;
  }
};

const removeGCPRedirect = async ({ issuerGLN, identificationKeyType, gcp }) => {
  try {
    const ps = await makeDBConnectionAndPS();
    ps.input('issuerGLN', sql.TYPES.NChar(13));
    ps.input('identificationKeyType', sql.TYPES.NVarChar(20));
    ps.input('gcp', sql.TYPES.NVarChar(45));
    await ps.prepare('EXEC [DELETE_GCP_Redirect] @issuerGLN, @identificationKeyType, @gcp');
    const queryResponse = await ps.execute({
      issuerGLN,
      identificationKeyType,
      gcp,
    });
    await ps.unprepare();
    return queryResponse.recordset;
  } catch (e) {
    utils.logThis(e.message);
  }
};

module.exports = {
  checkAPIAuth,
  searchGCPRedirectsByGLN,
  upsertGCPRedirect,
  removeGCPRedirect,
};
