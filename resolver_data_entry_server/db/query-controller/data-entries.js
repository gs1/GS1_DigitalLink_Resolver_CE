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
    utils.logThis('Exception to connect DB (SQL Procedure) using authkey : ', authKey);
    utils.logThis(e);
  }
};

const countURIEntriesUsingGLN = async (issuerGLN) => {
  try {
    const ps = await makeDBConnectionAndPS();
    ps.input('issuerGLN', sql.TYPES.NChar(13));
    await ps.prepare('EXEC [COUNT_URI_Entries_using_member_primary_gln] @issuerGLN');
    const queryResponse = await ps.execute({ issuerGLN });
    await ps.unprepare();
    utils.logThis('Get CountURIEntries Using GLN from DB');
    return queryResponse.recordset;
  } catch (e) {
    utils.logThis(e.message);
  }
};

const searchURIEntriesByIdentificationKeyAndGLN = async ({ issuerGLN, identificationKeyType, identificationKey }) => {
  try {
    const ps = await makeDBConnectionAndPS();
    ps.input('identificationKeyType', sql.TYPES.NVarChar(20));
    ps.input('identificationKey', sql.TYPES.NVarChar(45));
    ps.input('issuerGLN', sql.TYPES.NChar(13));

    await ps.prepare('EXEC [GET_URI_Entries_using_gln_and_identification_key] @identificationKeyType, @identificationKey, @issuerGLN');
    const queryResponse = await ps.execute({
      issuerGLN,
      identificationKeyType,
      identificationKey,
    });
    await ps.unprepare();
    utils.logThis('Successfull get URI Data Entries');
    return queryResponse.recordset;
  } catch (error) {
    utils.logThis(error.message);
  }
};

const searchURIResponsesByURIEntryId = async (uriEntryId) => {
  try {
    const ps = await makeDBConnectionAndPS();
    ps.input('uriEntryId', sql.TYPES.BigInt());
    await ps.prepare('EXEC [GET_URI_Responses] @uriEntryId');
    const queryResponse = await ps.execute({ uriEntryId });
    await ps.unprepare();
    return queryResponse.recordset;
  } catch (e) {
    utils.logThis('Error to getting URI Responses');
  }
};

const deleteURIEntryByIdentificationKeyAndGLN = async ({ issuerGLN, identificationKeyType, identificationKey }) => {
  try {
    const ps = await makeDBConnectionAndPS();
    ps.input('identificationKeyType', sql.TYPES.NVarChar(20));
    ps.input('identificationKey', sql.TYPES.NVarChar(45));
    ps.input('issuerGLN', sql.TYPES.NChar(13));
    await ps.prepare('EXEC [DELETE_URI_Entry] @issuerGLN, @identificationKeyType, @identificationKey');
    const queryResponse = await ps.execute({
      issuerGLN,
      identificationKeyType,
      identificationKey,
    });
    await ps.unprepare();
    return queryResponse.recordset;
  } catch (e) {
    utils.logThis(e.message);
  }
};

const getValidationResultForBatchFromDB = async ({ issuerGLN, batchId }) => {
  try {
    const ps = await makeDBConnectionAndPS();
    ps.input('issuerGLN', sql.TYPES.NChar(13));
    ps.input('batchId', sql.TYPES.Int());
    await ps.prepare('EXEC [VALIDATE_Get_Validation_Results] @issuerGLN, @batchId');
    const queryResponse = await ps.execute({ issuerGLN, batchId });
    await ps.unprepare();
    return queryResponse.recordset;
  } catch (e) {
    utils.logThis(e.message);
  }
};

const fetchDataEntriesByPage = async ({ issuerGLN, pageNumber, pageSize }) => {
  try {
    const ps = await makeDBConnectionAndPS();
    ps.input('issuerGLN', sql.TYPES.NChar(13));
    ps.input('pageNumber', sql.TYPES.Int());
    ps.input('pageSize', sql.TYPES.Int());
    await ps.prepare('EXEC [GET_URI_Entries_using_member_primary_gln] @issuerGLN, @pageNumber, @pageSize');
    const queryResponse = await ps.execute({
      issuerGLN,
      pageNumber,
      pageSize,
    });
    await ps.unprepare();
    return queryResponse.recordset;
  } catch (error) {
    utils.logThis(error.message);
  }
};

const upsertURIEntry = async (resolverEntry) => {
  try {
    const ps = await makeDBConnectionAndPS();
    ps.input('issuerGLN', sql.TYPES.NChar(13));
    ps.input('identificationKeyType', sql.TYPES.NVarChar(20));
    ps.input('identificationKey', sql.TYPES.NVarChar(45));
    ps.input('itemDescription', sql.TYPES.NVarChar(200));
    ps.input('qualifierPath', sql.TYPES.NVarChar(255));
    ps.input('active', sql.TYPES.Bit());
    ps.input('batchId', sql.TYPES.Int());
    ps.input('validationCode', sql.TYPES.TinyInt());
    await ps.prepare(
      'EXEC [UPSERT_URI_Entry_Prevalid] @issuerGLN, @identificationKeyType, @identificationKey, @itemDescription, @qualifierPath, @active, @batchId, @validationCode',
    );
    const queryResponse = await ps.execute(resolverEntry);
    await ps.unprepare();
    return queryResponse.recordset;
  } catch (e) {
    utils.logThis(e.message);
  }
};

/**
 * Creates or Updates a Resolver Entry entry, returning a result object with the new (or updated) uriResponseId.
 * The decision to insert or update is made by the stored procedure [UPSERT_URI_Response_Prevalid].
 * @param resolverResponse
 * @returns {Promise<{SUCCESS: boolean, uriResponseId: number, HTTPSTATUS: number}>}
 */
const upsertURIResponse = async (resolverResponse) => {
  try {
    const ps = await makeDBConnectionAndPS();
    ps.input('uriEntryId', sql.TYPES.BigInt());
    ps.input('linkType', sql.TYPES.NVarChar(100));
    ps.input('ianaLanguage', sql.TYPES.NChar(2));
    ps.input('context', sql.TYPES.NVarChar(100));
    ps.input('mimeType', sql.TYPES.NVarChar(45));
    ps.input('linkTitle', sql.TYPES.NVarChar(100));
    ps.input('targetUrl', sql.TYPES.NVarChar(1024));
    ps.input('fwqs', sql.TYPES.Bit());
    ps.input('active', sql.TYPES.Bit());
    ps.input('defaultLinkType', sql.TYPES.Bit());
    ps.input('defaultIanaLanguage', sql.TYPES.Bit());
    ps.input('defaultContext', sql.TYPES.Bit());
    ps.input('defaultMimeType', sql.TYPES.Bit());

    await ps.prepare(
      // eslint-disable-next-line operator-linebreak
      'EXEC [UPSERT_URI_Response_Prevalid] @uriEntryId, @linkType, @ianaLanguage, @context, @mimeType, @linkTitle, ' +
        '@targetUrl, @fwqs, @active, @defaultLinkType, @defaultIanaLanguage, @defaultContext, @defaultMimeType',
    );

    const queryResponse = await ps.execute(resolverResponse);
    await ps.unprepare();
    return queryResponse.recordset;
  } catch (e) {
    utils.logThis(e.message);
  }
};

const saveDataEntriesURIValidationResultToDB = async (issuerGLN, identificationKeyType, identificationKey, validationCode) => {
  try {
    const ps = await makeDBConnectionAndPS();
    ps.input('issuerGLN', sql.TYPES.NVarChar(20));
    ps.input('identificationKeyType', sql.TYPES.NVarChar(20));
    ps.input('identificationKey', sql.TYPES.NVarChar(45));
    ps.input('validationCode', sql.TYPES.TinyInt());

    await ps.prepare('EXEC [VALIDATE_Save_Validation_Result] @issuerGLN, @identificationKeyType, @identificationKey, @validationCode');
    const queryResponse = await ps.execute({
      issuerGLN,
      identificationKeyType,
      identificationKey,
      validationCode,
    });

    await ps.unprepare();
    return queryResponse.recordset;
  } catch (e) {
    utils.logThis(e.message);
  }
};

const publishValidatedEntries = async (batchId) => {
  try {
    const ps = await makeDBConnectionAndPS();
    ps.input('batchId', sql.TYPES.Int());
    await ps.prepare('EXEC [VALIDATE_Publish_Validated_Entries] @batchId');
    const queryResponse = await ps.execute({ batchId });
    await ps.unprepare();
    return queryResponse.recordset;
  } catch (e) {
    utils.logThis(e.message);
  }
};
module.exports = {
  checkAPIAuth,
  countURIEntriesUsingGLN,
  searchURIEntriesByIdentificationKeyAndGLN,
  searchURIResponsesByURIEntryId,
  deleteURIEntryByIdentificationKeyAndGLN,
  getValidationResultForBatchFromDB,
  fetchDataEntriesByPage,
  upsertURIEntry,
  upsertURIResponse,
  saveDataEntriesURIValidationResultToDB,
  publishValidatedEntries,
};
