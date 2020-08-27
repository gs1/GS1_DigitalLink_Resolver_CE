const express = require('express');
const HttpStatus = require('http-status-codes');
const utils = require('../bin/resolver_utils');
const gcpRedirectFuncs = require('../bin/gcpRedirectFunctions');
const authFuncs = require('../bin/authenticationFunctions');
const router = express.Router();


router.get('/', async function (req, res, next)
{
    let dateObj = new Date();
    res.send( {STATUS: "GS1 Resolver Data Entry API - GCP Redirect Service", SERVICEDATETIME: dateObj} );
});


router.get('/:identificationKeyType/:gcp', async function (req, res, next)
{
    const authResponse = await authFuncs.authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            let identificationKeyType = req.params.identificationKeyType;
            let idKeyTypeAI = utils.convertAILabelToNumeric(identificationKeyType);

            let gcp = req.params.gcp;
            const result = await gcpRedirectFuncs.searchResolverGCPRedirectsByGCP(authResponse.issuerGLN, idKeyTypeAI, gcp);
            if (result.length === 0)
            {
                if (!res.headersSent)
                {
                    res.sendStatus(HttpStatus.NOT_FOUND);
                }
            }
            res.send(result);
        }
        catch (err)
        {
            utils.logThis(`GCP router.get('/:identificationKeyType/:gcp) error: ${err}`)
            if (!res.headersSent)
            {
                res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
    else
    {
        if (!res.headersSent)
        {
            res.sendStatus(HttpStatus.UNAUTHORIZED);
        }
    }
});


/**
 * Retrieve all GCP entries link to the issuerGLN
 */
router.get('/all', async function (req, res, next)
{
    const authResponse = await authFuncs.authOK(req);
    if(authResponse.SUCCESS)
    {
        let result = [];
        try
        {
            result = await gcpRedirectFuncs.searchGCPRedirectsByGLN(authResponse.issuerGLN);
            if(result.length === 0)
            {
                res.sendStatus(HttpStatus.NOT_FOUND);
            }
            else
            {
                res.send(result);
            }

        }
        catch (err)
        {
            utils.logThis(`GCP router.get('/all/') error: ${err}`)
            if (!res.headersSent)
            {
                res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
    else
    {
        if (!res.headersSent)
        {
            res.sendStatus(HttpStatus.UNAUTHORIZED);
        }
    }
});


/**
 * Inserts or updates a GCP entry
 */
router.post('/', async function (req, res, next)
{
    const authResponse = await authFuncs.authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            const gcpData = req.body;
            const success = await gcpRedirectFuncs.saveGCPRedirect(authResponse.issuerGLN, gcpData);
            if (success)
            {
                res.sendStatus(HttpStatus.OK);
            }
            else
            {
                res.sendStatus(HttpStatus.BAD_REQUEST);
            }
        }
        catch (err)
        {
            utils.logThis("API GCP Redirect POST: " + err);
            if (!res.headersSent)
            {
                res.sendStatus(HttpStatus.BAD_REQUEST);
            }
        }
    }
    else
    {
        if (!res.headersSent)
        {
            res.sendStatus(HttpStatus.UNAUTHORIZED);
        }
    }
});


router.delete('/:identificationKeyType/:gcp', async function (req, res, next)
{
    const authResponse = await authFuncs.authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            let idKeyType = req.params.identificationKeyType;
            let gcp = req.params.gcp;
            const success = await gcpRedirectFuncs.deleteResolverEntry(authResponse.issuerGLN, idKeyType, gcp);
            res.send( {success} );
        }
        catch (err)
        {
            utils.logThis("GCP REDIRECT DELETE: " + err);
            if (!res.headersSent)
            {
                res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
    else
    {
        if (!res.headersSent)
        {
            res.sendStatus(HttpStatus.UNAUTHORIZED);
        }
    }
});

module.exports = router;