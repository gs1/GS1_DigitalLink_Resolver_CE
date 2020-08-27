const express = require('express');
const HttpStatus = require('http-status-codes');
const utils = require('../bin/resolver_utils');
const dataEntryFuncs = require('../bin/dataEntryFunctions');
const authFuncs = require('../bin/authenticationFunctions');
const router = express.Router();


router.get('/', async function (req, res, next)
{
    let dateObj = new Date();
    res.send( {STATUS: "GS1 Resolver Data Entry API", SERVICEDATETIME: dateObj} );
});

/**
 * Returns a count of all the resolver entries owned by the specified GLN.
 * Always place this function BEFORE router.get('/:identificationKeyType/:identificationKey' ...)
 * as /all/count satisfies the same API pattern as /:identificationKeyType/:identificationKey
 */
router.get('/all/count', async function (req, res, next)
{
    const authResponse = await authFuncs.authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            const result = await dataEntryFuncs.countEntriesUsingGLN(authResponse.issuerGLN);
            res.send(result);
        }
        catch (err)
        {
            utils.logThis(`router.get('/all/count') error: ${err}`)
            res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
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
 * Search for Resolver Entries using Identification Key Type and Identification Key
 * Always place this function AFTER router.get('/all/count' ...)
 */
router.get('/:identificationKeyType/:identificationKey', async function (req, res, next)
{
    const authResponse = await authFuncs.authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            let identificationKeyType = req.params.identificationKeyType;
            let idKeyTypeAI = utils.convertAILabelToNumeric(identificationKeyType);
            const identificationKey = req.params.identificationKey;
            const result = await dataEntryFuncs.searchResolverEntriesByKey(authResponse.issuerGLN, idKeyTypeAI, identificationKey);
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
            utils.logThis(`router.get('/:identificationKeyType/:identificationKey') error: ${err}`)
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
 * Gets the validation results using the batch Id supplied as a response to
 * a successful POST entry data.
 */
router.get('/validation/batch/:batchId', async function (req, res, next)
{
    const batchId = req.params.batchId;
    const authResponse = await authFuncs.authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            const response = await dataEntryFuncs.getValidationResultsForBatch(authResponse.issuerGLN, batchId);

            //STATUS 1 = Completed, STATUS 7 = Pending (STATUS 5 also available, denotes failure)
            if (response.STATUS === 1 || response.STATUS === 7)
            {
                res.send(response);
            }
            else
            {
                utils.logThis(`router.get('/validation/batch/:batchId') error from DB`)
                res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        catch (err)
        {
            utils.logThis(`router.get('/validation/batch/:batchId') error: ${err}`)
            res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
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
 * Search for Resolver Entries using GLN from the lowest uriEntryId value and with maximum batch size.
 * If batch size > 100 then it is forced down to 100.
 */
router.get('/all/page/:pageNumber/size/:pageSize', async function (req, res, next)
{

    //Just use a default if any weird data is incoming - page 1, size 100
    let pageNumber = req.params.pageNumber;
    if(pageNumber === undefined || isNaN(pageNumber))
    {
        pageNumber = 1;
    }

    let pageSize = req.params.pageSize;
    if(pageSize === undefined || isNaN(pageSize) || pageSize > 100)
    {
        pageSize = 100;
    }

    const authResponse = await authFuncs.authOK(req);
    if(authResponse.SUCCESS)
    {
        let result = [];
        try
        {
            result = await dataEntryFuncs.searchURIEntriesByGLN(authResponse.issuerGLN, pageNumber, pageSize);
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
            utils.logThis(`router.get('/all/page/:pageNumber/size/:pageSize' error: ${err}`)
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
 * Creates a new URI Entry
 */
router.post('/', async function (req, res, next)
{
    const authResponse = await authFuncs.authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            //Perform a quick realtime batch check:
            if (Array.isArray(req.body))
            {
                let returnObj = { batchId: 0, badEntries: []}
                returnObj.batchId = await dataEntryFuncs.generateBatchId();
                returnObj.badEntries = dataEntryFuncs.validateResolverEntriesArray_QuickCheck(req.body);

                //We'll send the batchID and any quickly-found bad entries back in response end this connection.
                res.send(returnObj);

                //START - FROM THIS LINE, THE SERVER IS PROCESSING THIS CODE VIA THE EVENT LOOP QUEUE ////////////////////////////////////

                //If the length of the badEntries array is the same as the body array length, there's no point in continuing!
                if (returnObj.badEntries.length < req.body.length)
                {
                    //Now send the more serious checking off into an asynchronous batch save and check.
                    //Everything we do now is happening asynchronously as we send tasks into the event loop.
                    const savedUpsertArray = await dataEntryFuncs.saveResolverEntries(authResponse.issuerGLN, req.body, returnObj.batchId);
                    utils.logThis(`save of batchId ${returnObj.batchId} completed`);
                    await dataEntryFuncs.validateEntries(savedUpsertArray);
                    const publishCount = await dataEntryFuncs.publishValidatedEntries(returnObj.batchId);
                     utils.logThis(`${publishCount} entries were published`);
                }
                //END - UP TO THIS LINE, THE SERVER IS PROCESSING THIS CODE VIA THE EVENT LOOP QUEUE ////////////////////////////////////

            }
            else
            {
                res.sendStatus(HttpStatus.BAD_REQUEST);
            }

        }
        catch (err)
        {
            utils.logThis("API POST: " + err);
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


router.delete('/:identificationKeyType/:identificationKey', async function (req, res, next)
{
    const authResponse = await authFuncs.authOK(req);
    if(authResponse.SUCCESS)
    {
        try
        {
            let identificationKeyType = req.params.identificationKeyType;
            let idKeyTypeAI = utils.convertAILabelToNumeric(identificationKeyType);
            const identificationKey = req.params.identificationKey;
            const success = await dataEntryFuncs.deleteResolverEntry(authResponse.issuerGLN, idKeyTypeAI, identificationKey);
            res.send( {success} );
        }
        catch (err)
        {
            utils.logThis("API DELETE: " + err);
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