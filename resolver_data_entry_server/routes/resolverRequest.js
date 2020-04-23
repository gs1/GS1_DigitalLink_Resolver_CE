const express = require('express');
const HttpStatus = require('http-status-codes');
const db = require('../db/sqldb');
const router = express.Router();

/**
 * Get a Resolver Request using a known uriRequestId
 */
router.get('/:uriRequestId', async function (req, res, next)
{
    const uriRequestId = req.params.uriRequestId;
    const authResponse = await authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            const result = await db.readURIRequest(uriRequestId, authResponse.memberPrimaryGLN);
            if(result.length === 0)
            {
                res.sendStatus(HttpStatus.NOT_FOUND);
            }
            else
            {
                for(let resolverRequest of result)
                {
                    resolverRequest.responses = await db.searchURIResponses(resolverRequest.uri_request_id);
                }
                res.send(result);
            }
        }
        catch
        {
            res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    else
    {
        res.sendStatus(HttpStatus.UNAUTHORIZED);
    }
});


/**
 * Search for Resolver Requests using GS1 Key Code and GS1 Key Value
 */
router.get('/code/:gs1KeyCode/value/:gs1KeyValue', async function (req, res, next)
{
    const gs1KeyCode = req.params.gs1KeyCode;
    const gs1KeyValue = req.params.gs1KeyValue;
    const authResponse = await authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            let result = await db.searchURIRequestsByGS1Key(authResponse.memberPrimaryGLN, gs1KeyCode, gs1KeyValue);
            if(result.length === 0)
            {
                res.sendStatus(HttpStatus.NOT_FOUND);
            }
            else
            {
                for(let resolverRequest of result)
                {
                    resolverRequest.responses = await db.searchURIResponses(resolverRequest.uri_request_id);
                }
                res.send(result);
            }
        }
        catch
        {
            res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    else
    {
        res.sendStatus(HttpStatus.UNAUTHORIZED);
    }
});


router.get('/count/all', async function (req, res, next)
{
    const authResponse = await authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            const result = await db.countURIRequestsUsingGLN(authResponse.memberPrimaryGLN);
            if(result.lowestUriRequestId === 0)
            {
                res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
            }
            else
            {
                res.send(result);
            }
        }
        catch
        {
            res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    else
    {
        res.sendStatus(HttpStatus.UNAUTHORIZED);
    }

});


/**
 * Search for Resolver Requests using GLN from the lowest uriRequestId value and with  maximum batch size.
 * If batch size > 1000 then it is forced down to 1000.
 */
router.get('/lowestid/:lowest/maxrows/:batchSize', async function (req, res, next)
{
    let lowestUriRequestId = req.params.lowest;
    let maxRows = req.params.batchSize;

    if(maxRows === undefined || maxRows > 1000)
    {
        maxRows = 1000;
    }

    const authResponse = await authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            const result = await db.searchURIRequestsByGLN(authResponse.memberPrimaryGLN, lowestUriRequestId, maxRows);
            if(result.length === 0)
            {
                res.sendStatus(HttpStatus.NOT_FOUND);
            }
            else
            {
                for(let resolverRequest of result)
                {
                    resolverRequest.responses = await db.searchURIResponses(resolverRequest.uri_request_id);
                }
                res.send(result);
            }
        }
        catch
        {
            res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    else
    {
        res.sendStatus(HttpStatus.UNAUTHORIZED);
    }
});


/**
 * Creates a new URI Request
 */
router.post('/', async function (req, res, next)
{
    const authResponse = await authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            const result = await db.upsertURIRequest(authResponse.memberPrimaryGLN, cleanResolverRequest(req.body));
            res.status(result.HTTPSTATUS);
            delete result.HTTPSTATUS; //So that status is not transferred in the body of the JSON response
            res.send(result);
        }
        catch (err)
        {
            console.log("resolverRequest POST: " + err);
            res.sendStatus(HttpStatus.BAD_REQUEST);
        }
    }
    else
    {
        res.sendStatus(HttpStatus.UNAUTHORIZED);
    }
});


/**
 * Updates a URI Request (PUT request)
 */
router.put('/', async function (req, res, next)
{
    const authResponse = await authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            const result = await db.upsertURIRequest(authResponse.memberPrimaryGLN, cleanResolverRequest(req.body));
            res.status(result.HTTPSTATUS);
            delete result.HTTPSTATUS; //So that status is not transferred in the body of the JSON response
            res.send(result);
        }
        catch
        {
            res.sendStatus(HttpStatus.BAD_REQUEST);
        }
    }
    else
    {
        res.sendStatus(HttpStatus.UNAUTHORIZED);
    }
});


/**
 * Updates a URI Request (PATCH request)
 */
router.patch('/', async function (req, res, next)
{
    const authResponse = await authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            const result = await db.upsertURIRequest(authResponse.memberPrimaryGLN, cleanResolverRequest(req.body));
            res.status(result.HTTPSTATUS);
            delete result.HTTPSTATUS; //So that status is not transferred in the body of the JSON response
            res.send(result);
        }
        catch
        {
            res.sendStatus(HttpStatus.BAD_REQUEST);
        }
    }
    else
    {
        res.sendStatus(HttpStatus.UNAUTHORIZED);
    }
});



/**
 * Get a Resolver Request using a known uriRequestId
 */
router.delete('/:uriRequestId', async function (req, res, next)
{
    const uriRequestId = req.params.uriRequestId;
    const authResponse = await authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            const result = await db.deleteURIRequest(authResponse.memberPrimaryGLN, uriRequestId);
            res.status(result.HTTPSTATUS);
            delete result.HTTPSTATUS; //So that status is not transferred in the body of the JSON response
            res.send(result);
        }
        catch
        {
            res.sendStatus(HttpStatus.BAD_REQUEST);
        }
    }
    else
    {
        res.sendStatus(HttpStatus.UNAUTHORIZED);
    }
});


/**
 * Cleans a Resolver Request object (adds a layer of security, too)
 * @param resolverRequest
 * @returns {*}
 */
const cleanResolverRequest = (resolverRequest) =>
{
    for (let [key, value] of Object.entries(resolverRequest))
    {
        if(typeof value === "string")
        {
            resolverRequest[key] = value.replace("\n", "").replace("\r", "").replace("'", "").trim();
        }
    }
    return resolverRequest;
};


/**
 *  * Check that the incoming request is authorised to use the service
 * @param req
 * @returns {Promise<boolean|{SUCCESS: boolean, memberPrimaryGLN: string}>}
 */
const authOK = async (req) =>
{
    if (!req.header('Authorization'))
    {
        return  { SUCCESS: false, memberPrimaryGLN: "" };
    }
    const authString = req.header('Authorization').replace('Bearer ', '').trim();
    return await db.checkAuth(authString);
};

module.exports = router;
