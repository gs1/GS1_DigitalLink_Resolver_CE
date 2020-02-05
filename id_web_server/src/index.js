const db = require('./db');
const resolver = require('./resolver');
const http = require('http');
const port = process.env.PORT || 80;
let requestCounter = 0;

/**
 * sayHello is the heartbeat / 'are you there?' function
 * @param httpResponse
 * @param processStartTime
 */
const sayHello = async (httpResponse, processStartTime) =>
{
    const util = require('util');
    const fs = require('fs');
    const readFileAsync = util.promisify(fs.readFile);
    let hello = {};
    const dateNow = new Date();
    const html = `<h2>Hello from GS1 Resolver Host ${process.env.HOSTNAME}</h2><h3>Current server time is " + ${dateNow} + "</h3>`;

    //Some essential metrics we can use!
    //Current date/time in the container
    hello.serverDateTime = dateNow;

    //The internal host name of the container (usually just random letters and numbers)
    hello.hostName = process.env.HOSTNAME;

    //This will return the number of requests processed by the container since it started
    hello.requestsProcessed = requestCounter;

    //The file /resolver/src/builddatetime.txt is created during the image build for this container, in Dockerfile.
    hello.buildDateTime = await readFileAsync('/resolver/src/builddatetime.txt', {encoding: 'utf8'});

    resolver.resolverHTTPResponse(httpResponse, {'X-STATS': JSON.stringify(hello) }, html, 200, processStartTime);
};


/**
 * Sends the favIcon.ico file stored in the container path /resolver/templates/interstitial/favicon.ico
 * @param response
 * @returns {Promise<void>}
 */
const sendFavIcon = async (response) =>
{
    const fs = require('fs');
    response.writeHead(200, {'Content-Type': 'image/x-icon'} );
    const iconBinaryStream = fs.createReadStream('/resolver/templates/interstitial/favicon.ico');
    iconBinaryStream.on('open',  () =>
    {
        iconBinaryStream.pipe(response);
    });
    console.log('favicon requested');
};


/**
 * The primary (only!) request handler for incoming digital link resolving requests.
 * @param request
 * @param response
 * @returns {Promise<void>}
 */
const requestHandler = async (request, response) =>
{
    //Start the timer!
    const processStartTime = new Date().getTime();
    console.time("PROCESSTIME");

    requestCounter ++;

    console.log(`======= New Incoming Request #${requestCounter}:`, request.url);

    //This is an 'are you there?!' test
    if (request.url.toLowerCase() === "/hello")
    {
        await sayHello(response, processStartTime);
    }
    else if (request.url.toLowerCase() === "/favicon.ico")
    {
        await sendFavIcon(response);
    }
    else if (request.url.toLowerCase() === "/.well-known/gs1resolver")
    {
        await resolver.processWellKnownRequest(response, processStartTime);
    }
    else
    {

        //Decode the digital link structure from the incoming request
        const structure = resolver.getDigitalLinkStructure("https://id.gs1.org" + request.url);
        if (structure.result === "ERROR")
        {
            response.writeHead(400, {'Content-Type': 'application/json'});
            response.end(`{ error: "${structure.error}" }`);
        }
        else
        {
            if (structure)
            {
                const gs1Key = Object.keys(structure.identifiers[0])[0];
                const gs1Value = structure.identifiers[0][gs1Key];
                let dbDocument = await db.findDigitalLinkEntry(gs1Key, gs1Value);
                if (dbDocument)
                {
                    //We have found a document for this gs1Key and gs1Value
                    resolver.processRequest(request, structure, dbDocument, response, processStartTime);
                }
                else
                {
                    //we didn't find a document, so we need to check if we have a 'general'
                    //redirect for the prefix part of this gs1Value in the the gcp collection
                    let gcpDoc = await db.findPrefixEntry(gs1Key, gs1Value);
                    if (gcpDoc)
                    {
                        resolver.processGCPRedirect(request, gcpDoc, response, processStartTime)
                    }
                    else
                    {
                        await resolver.getNotFoundPage(gs1Key, gs1Value, response, processStartTime);
                    }

                }
            }
            else
            {
                response.writeHead(400, {'Content-Type': 'application/json'});
                response.end('{error: "Not a GS1 Digital Link request"}');
            }
        }
    }
    console.log(`======= Completed Request #${requestCounter}:`, request.url);
    console.timeEnd("PROCESSTIME");
};

//Set up Node's built-in http server. This node container will sit behind a front-end https web server or
//load balancer, depending on use.
const server = http.createServer(requestHandler);
server.listen(port, (err) =>
{
    if (err)
    {
        return console.log('Server listen error:', err)
    }
    console.log(`GS1 DigitalLink ID Server is listening on ${port}`)
});