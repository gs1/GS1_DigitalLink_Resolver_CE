const express = require('express');
const HttpStatus = require('http-status-codes');
const db = require('../db/sqldb');
const router = express.Router();

/**
 * Find a Resolver Response entry using a known uriResponseId
 */
router.get('/:uriResponseId', async function (req, res, next)
{
    const uriResponseId = req.params.uriResponseId;

    const authResponse = await authOK(req);
    if(authResponse.SUCCESS)

    {
        const dbResult = await db.readURIResponse(uriResponseId);
        if (dbResult.length === 0)
        {
            res.sendStatus(HttpStatus.NOT_FOUND);
        }
        else
        {
            res.send(dbResult);
        }
    }
    else
    {
        res.sendStatus(HttpStatus.UNAUTHORIZED);
    }
});


/**
 * Creates a new URI Response
 */
router.post('/', async function (req, res, next)
{
    const authResponse = await authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            const result = await db.upsertURIResponse(cleanResolverResponse(req.body));
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
 * Updates a URI Response (PUT)
 */
router.put('/', async function (req, res, next)
{
    const authResponse = await authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            const result = await db.upsertURIResponse(cleanResolverResponse(req.body));
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
 * Updates a URI Response (PATCH)
 */
router.patch('/', async function (req, res, next)
{
    const authResponse = await authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            const result = await db.upsertURIResponse(cleanResolverResponse(req.body));
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
 * Deletes a Resolver Response using a known uriResponseId
 */
router.delete('/:uriResponseId', async function (req, res, next)
{
    const uriResponseId = req.params.uriResponseId;
    const authResponse = await authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            const result = await db.deleteURIResponse(uriResponseId);
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
 * @param resolverResponse
 * @returns {*}
 */
const cleanResolverResponse = (resolverResponse) =>
{
    for (let [key, value] of Object.entries(resolverResponse))
    {
        if(typeof value === "string")
        {
            resolverResponse[key] = value.replace("\n", "").replace("\r", "").replace("'", "").trim();
        }
    }
    return resolverResponse;
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
