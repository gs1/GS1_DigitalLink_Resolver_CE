const express = require('express');
const HttpStatus = require('http-status-codes');
const db = require('../db/sqldb')
const utils = require('../bin/resolver_utils');

const router = express.Router();

router.get('/runendofday', async function (req, res, next)
{
    if (adminAuthOK(req))
    {
        try
        {
            res.send({MESSAGE: "End of day processing started"})
            db.runEndOfDaySQL().then(); //No need for admin caller to wait
        }
        catch (err)
        {
            utils.logThis(`/admin/runendofday: ${err}`);
            res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    else
    {
        res.sendStatus(HttpStatus.UNAUTHORIZED);
        utils.logThis(`get /runendofday: unauthorised attempt`);
    }
});


/**
 * This API call is used by a Kubernetes Live Probe. The header is set in resolver-data-entry-server.yaml
 * and is created simply to stop anything else trying to run this healthcheck
 */
router.get('/healthcheck_livenessprobe', async function (req, res, next)
{
    if (req.header('X-K8S-AUTH-GUID') === "01631767-2a12-48c7-befd-13321e46f309")
    {
        try
        {
            const resultSet = await db.getHeardBuildServers();
            if (resultSet === null)
            {
                res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
            }
            else
            {
                res.sendStatus(HttpStatus.OK);
            }
        }
        catch (err)
        {
            utils.logThis("/admin/healthcheck: " + err.message);
            res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    else
    {
        res.sendStatus(HttpStatus.UNAUTHORIZED);
        utils.logThis(`get /healthcheck_livenessprobe: Only authorised for access by Kubernetes LivenessProbe`);
    }

});




router.get('/heardbuildsyncservers', async function (req, res, next)
{
    if (adminAuthOK(req))
    {
        try
        {
            const resultSet = await db.getHeardBuildServers();
            if (resultSet === null)
            {
                res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
            }
            else
            {
                res.send(resultSet);
            }
        }
        catch (err)
        {
            utils.logThis("/admin/heardbuildsyncservers: " + err.message);
            res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    else
    {
        res.sendStatus(HttpStatus.UNAUTHORIZED);
        utils.logThis(`get /heardbuildservers: unauthorised attempt`);
    }
});


router.delete('/heardbuildsyncserver/:syncServerId', async function (req, res, next)
{
    if (adminAuthOK(req))
    {
        try
        {
            const syncServerId = req.params.syncServerId;
            const success = await db.deleteBuildServerFromSyncRegistry(syncServerId);
            if (success)
            {
                res.send({SUCCESS: true});
            }
            else
            {
                res.sendStatus(HttpStatus.NOT_FOUND);
            }
        }
        catch (err)
        {
            utils.logThis("delete /admin/heardbuildsyncserver: " + err.message);
            res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    else
    {
        res.sendStatus(HttpStatus.UNAUTHORIZED);
        utils.logThis(`delete /heardbuildsyncserver: unauthorised attempt`);
    }
});


router.get('/accounts', async function (req, res, next)
{
    if (adminAuthOK(req))
    {
        try
        {
            const resultSet = await db.getAccounts();
            if (resultSet === null)
            {
                res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
            }
            else
            {
                res.send(resultSet);
            }
        }
        catch (err)
        {
            utils.logThis("get /admin/accounts: " + err.message);
            res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    else
    {
        res.sendStatus(HttpStatus.UNAUTHORIZED);
        utils.logThis(`get /admin/accounts: unauthorised attempt`);
    }
});


router.post('/accounts', async function (req, res, next)
{
    let responseArray = [];
    if (adminAuthOK(req))
    {
        try
        {
            if (Array.isArray(req.body))
            {
                for (let account of req.body)
                {
                    let thisAccount = {
                        issuerGLN: account.issuerGLN,
                        accountName: account.accountName,
                        authenticationKey: account.authenticationKey
                    }

                    responseArray.push( {
                        issuerGLN: account.issuerGLN,
                        accountName: account.accountName,
                        authenticationKey: account.authenticationKey,
                        success: await db.upsertOrDeleteAccount(thisAccount, false)
                    });
                }
                res.send(responseArray);
            }

        }
        catch (err)
        {
            utils.logThis("upsert /admin/accounts: " + err.message);
            res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    else
    {
        res.sendStatus(HttpStatus.UNAUTHORIZED);
        utils.logThis(`upsert /admin/accounts: unauthorised attempt`);
    }
});



router.delete('/accounts', async function (req, res, next)
{
    let responseArray = [];
    if (adminAuthOK(req))
    {
        try
        {
            if (Array.isArray(req.body))
            {
                for (let account of req.body)
                {
                    let thisAccount = {
                        issuerGLN: account.issuerGLN,
                        accountName: account.accountName,
                        authenticationKey: account.authenticationKey
                    }

                    responseArray.push( {
                        issuerGLN: account.issuerGLN,
                        accountName: account.accountName,
                        authenticationKey: account.authenticationKey,
                        success: await db.upsertOrDeleteAccount(thisAccount, true)
                    });
                }
                res.send(responseArray);
            }

        }
        catch (err)
        {
            utils.logThis("delete /admin/accounts: " + err.message);
            res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    else
    {
        res.sendStatus(HttpStatus.UNAUTHORIZED);
        utils.logThis(`delete /admin/accounts: unauthorised attempt`);
    }
});

module.exports = router;


/**
 * Returns true if the incoming admin auth key matches the one in the environment variable
 * @param req
 * @returns boolean
 */
const adminAuthOK = (req) =>
{
    if (!req.header('Authorization'))
    {
        return false;
    }
    const authString = req.header('Authorization').replace('Bearer ', '').trim();
    return authString === process.env.ADMIN_AUTH_KEY;
};

