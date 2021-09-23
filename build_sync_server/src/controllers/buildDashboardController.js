const { getAuthAccountsSqlData, getURIEntriesCountByPage, searchURIResponsesByURIEntryId, getGCPRedirectsByGLN } = require('../db/mssql-controller/dashboardQuery');

const { updateDocumentInMongoDB } = require('../db/mongo-controller/resolverDocumentOps');

const { logThis, convertAINumericToLabel } = require('../resolverUtils');

// eslint-disable-next-line no-unused-vars
const buildSynDashboardRun = async (lastHeardDateTime, fullBuildFlag) => {
  logThis('Dashboard collection sync build start!!!');
  try {
    // Step 1 get list of all accounts from which we can calculate GTIN based on issuerGLN
    const authAccountArr = (await getAuthAccountsSqlData()) || [];
    // loop through each account and get the data
    for await (const account of authAccountArr) {
      const { member_primary_gln: issuerGLN, account_name: accountName } = account;
      // const newObj = { accountName, linksCount: 0, gcpCount: 0, ai: [], _id: accountName };
      // Step 2 get total responses or links of particular issuerGLN or member
      const newObj = await getLinksCountOfMO(issuerGLN);
      // Step 3 getGCP Redirect count for each auth accouts.
      const gcpRedirects = await getGCPRedirectsByGLN(issuerGLN);
      newObj.gcpCount = gcpRedirects.length;
      newObj.accountName = accountName;
      newObj._id = accountName;
      // Now push the data to mongo db
      await updateDocumentInMongoDB(newObj, 'resolver_dashboard');
      logThis(` Individual account ${newObj.accountName} data is stored in mongodb `);
    }
    logThis('DashboardDoc SYNC to database successfuly');
    logThis(` Heap memory used after DashboardDoc Sync ${process.memoryUsage().heapUsed}`);

    return true;
  } catch (error) {
    logThis(` Error in buildSynDashboardRun of buildDashboard Controller ${error}`);
    return false;
  }
};

async function getLinksCountOfMO(issuerGLN) {
  const newObj = { linksCount: 0, ai: [] };
  let pageNumber = 1;
  const pageSize = 100;
  let linksCount = 0;
  while (pageNumber) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const uriEntriesArr = await getURIEntriesCountByPage({ issuerGLN, pageNumber, pageSize });
    if (uriEntriesArr.length === 0) {
      pageNumber = null;
    } else {
      for await (const entry of uriEntriesArr) {
        const { uri_entry_id: uriEntryId, identification_key_type: identificationType } = entry;
        const getResponse = await searchURIResponsesByURIEntryId(uriEntryId);
        const responseCount = getResponse.length;
        linksCount += responseCount;

        // create identification type property in a newobj object
        // eslint-disable-next-line no-prototype-builtins
        const aiIndex = newObj.ai.findIndex((ai) => ai.identificationType === identificationType);
        if (aiIndex === -1) {
          const aiObj = { identificationType, count: 0 };
          aiObj.count = responseCount;
          const shortName = await convertAINumericToLabel(identificationType);
          aiObj.shortName = shortName;
          newObj.ai.push(aiObj);
        } else {
          newObj.ai[aiIndex].count += responseCount;
        }
      }
      newObj.linksCount = linksCount;
      logThis(`Paged data of issuerGLN ${issuerGLN} of page ${pageNumber} completed`);
      pageNumber += 1;
    }
  }
  return newObj;
}

module.exports = buildSynDashboardRun;
