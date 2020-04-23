const express = require('express');
const HttpStatus = require('http-status-codes');
const fetch = require('node-fetch');
const router = express.Router();

router.get('/linktypes', async function (req, res, next)
{
    try
    {
        let fetchResponse = await fetch('https://www.gs1.org/voc/?show=linktypes', {
            method: 'get',
            headers: { 'Accept': 'application/json' },
        });


        if (fetchResponse.status === 200)
        {
            const linkTypes = await fetchResponse.json();
            res.send(linkTypes);
        }
        else
        {
            res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    catch(err)
    {
        console.log("/ref/linktypes error: ", err);
        res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    }
});

module.exports = router;