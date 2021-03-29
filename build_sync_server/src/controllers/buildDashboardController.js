const { getAuthAccountsSqlData, getURIEntriesCountByPage, searchURIResponsesByURIEntryId, getGCPRedirectsByGLN } = require('../db/mssql-controller/dashboardQuery');

const { updateDocumentInMongoDB } = require('../db/mongo-controller/resolverDocumentOps');

const { logThis, convertAINumericToLabel } = require('../resolverUtils');

// eslint-disable-next-line no-unused-vars
const buildSynDashboardRun = async (lastHeardDateTime, fullBuildFlag) => {
  logThis('Dashboard collection sync build start');
  const dashboardDoc = { mo: [] };
  try {
    // Step 1 get list of all accounts from which we can calculate GTIN based on issuerGLN
    const authAccountArr = (await getAuthAccountsSqlData()) || [];
    dashboardDoc.authCount = authAccountArr.length;

    for await (const account of authAccountArr) {
      const { member_primary_gln: issuerGLN, account_name: accountName } = account;
      const newObj = { accountName, linksCount: 0, gcpCount: 0, ai: [] };

      // Step 2 getGCP Redirect count for each auth accouts.
      const gcpRedirects = await getGCPRedirectsByGLN(issuerGLN);
      newObj.gcpCount = gcpRedirects.length;

      // Step 3 get total responses or links of particular issuerGLN or member
      let pageNumber = 1;
      const pageSize = 100;
      let linksCount = 0;
      while (pageNumber) {
        const uriEntriesArr = await getURIEntriesCountByPage({ issuerGLN, pageNumber, pageSize });
        if (!uriEntriesArr.length) {
          break;
        }
        pageNumber += 1;
        for await (const entry of uriEntriesArr) {
          const { uri_entry_id: uriEntryId, identification_key: identificationKey, identification_key_type: identificationType } = entry;
          const getResponse = await searchURIResponsesByURIEntryId(uriEntryId);
          const responseCount = getResponse.length;
          linksCount += responseCount;

          // create identification type property in a newobj object
          // newObj[identificationType] = newObj[identificationType] || {};
          // eslint-disable-next-line no-prototype-builtins
          const aiIndex = newObj.ai.findIndex((ai) => ai.identificationType === identificationType);
          if (aiIndex === -1) {
            const aiObj = { identificationType, items: [], count: 0 };
            // newObj.ai.push({ identificationType: {} });
            const shortName = await convertAINumericToLabel(identificationType);
            aiObj.shortName = shortName;
            newObj.ai.push(aiObj);
            newObj.ai[0].items.push({ [identificationKey]: responseCount });
          } else {
            const findItemObj = newObj.ai[aiIndex].items.findIndex((item) => Object.keys(item)[0] === identificationKey);

            if (findItemObj === -1) {
              newObj.ai[aiIndex].items.push({ [identificationKey]: responseCount });
            } else {
              newObj.ai[aiIndex].items[findItemObj][identificationKey] += responseCount;
            }
          }
          // add count of individual gtin or identificationkey to the object

          // if ({}.hasOwnProperty.call(newObj[identificationType], identificationKey)) {
          //   newObj[identificationType][identificationKey] += responseCount;
          // } else {
          //   newObj[identificationType][identificationKey] = responseCount;
          // }
        }
        newObj.linksCount = linksCount;
      }
      dashboardDoc.mo.push(newObj);
    }

    // add dashboard data to collection in mongodb
    await updateDocumentInMongoDB(dashboardDoc, 'resolver_dashboard');
  } catch (error) {
    logThis(` Error in buildSynDashboardRun of buildDashboard Controller ${error}`);
  }
};

module.exports = buildSynDashboardRun;
