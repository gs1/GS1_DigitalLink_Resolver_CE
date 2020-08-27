const db = require('../db/sqldb');
const utils = require('../bin/resolver_utils');

const searchResolverGCPRedirectsByGCP = async (issuerGLN, identificationKeyType, gcp) =>
{
    return await db.searchGCPRedirects(issuerGLN, identificationKeyType, gcp);
}


const searchGCPRedirectsByGLN = async (issuerGLN) =>
{
    return await db.searchGCPRedirects(issuerGLN);
}


const saveGCPRedirect = async (issuerGLN, gcpData) =>
{
    try
    {
        const identificationKeyType = utils.convertAILabelToNumeric(gcpData.identificationKeyType);
        const gcp = gcpData.prefixValue;
        const targetUrl = gcpData.targetUrl;
        const active = gcpData.active;

        if (identificationKeyType && gcp && targetUrl && typeof active === 'boolean')
        {
            return await db.upsertGCPRedirect(issuerGLN, identificationKeyType, gcp, targetUrl, active);
        }
        else
        {
            return false;
        }
    }
    catch (err)
    {
        utils.logThis(`saveGCPRedirect error: ${err}`);
        return false;
    }
}


const deleteResolverEntry = async (issuerGLN, identificationKeyType, gcp) =>
{
    return await db.deleteGCPRedirect(issuerGLN, identificationKeyType, gcp);
}



module.exports = {
    searchResolverGCPRedirectsByGCP,
    searchGCPRedirectsByGLN,
    saveGCPRedirect,
    deleteResolverEntry
}