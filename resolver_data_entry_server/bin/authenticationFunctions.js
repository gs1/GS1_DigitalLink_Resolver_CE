const db = require('../db/sqldb');

/**
 *  * Check that the incoming request is authorised to use the service
 * @param req
 * @returns {Promise<boolean|{SUCCESS: boolean, issuerGLN: string}>}
 */
const authOK = async (req) =>
{
    try
    {
        if (!req.header('Authorization'))
        {
            return {SUCCESS: false, issuerGLN: ""};
        }
        const authString = req.header('Authorization').replace('Bearer ', '').trim();
        return await db.checkAuth(authString);
    }
    catch (err)
    {
        return { SUCCESS: false, issuerGLN: "" };
    }
};

module.exports = { authOK }