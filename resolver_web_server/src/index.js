const http = require('http');
const util = require('util');
const fs = require('fs');

const db = require('./db');
const resolver = require('./resolver');

const port = process.env.PORT || 8080;
let requestCounter = 0;

const processDigitalLink = async (request, response, processStartTime) => {
  // Decode the digital link structure from the incoming request
  const structure = await resolver.getDigitalLinkStructure(request.url);
  if (structure.result === 'ERROR') {
    response.writeHead(400, { 'Content-Type': 'application/json' });
    response.end(`{ "error": "${structure.error}" }`);
  } else if (structure) {
    const gs1KeyCode = Object.keys(structure.identifiers[0])[0];
    const gs1KeyValue = structure.identifiers[0][gs1KeyCode];
    const dbDocument = await db.findDigitalLinkEntry(gs1KeyCode, gs1KeyValue);
    if (dbDocument !== null) {
      // We have found a document for this gs1KeyCode and gs1KeyValue
      resolver.processRequest(request, structure, dbDocument, response, processStartTime);
    } else {
      // we didn't find a document, so we need to check if we have a 'general'
      // redirect for the prefix part of this gs1KeyValue in the the gcp collection
      const gcpDoc = await db.findPrefixEntry(gs1KeyCode, gs1KeyValue);
      if (gcpDoc) {
        resolver.processGCPRedirect(request, gcpDoc, response, processStartTime);
      } else {
        await resolver.response_NotFoundPage(gs1KeyCode, gs1KeyValue, response, processStartTime);
      }
    }
  } else {
    response.writeHead(400, { 'Content-Type': 'application/json' });
    response.end('{"error": "Not a GS1 Digital Link request"}');
  }
};

/**
 * sayHello is the heartbeat / 'are you there?' function
 * @param httpResponse
 * @param processStartTime
 */
const sayHello = async (httpResponse, processStartTime) => {
  const readFileAsync = util.promisify(fs.readFile);
  const hello = {};
  const dateNow = new Date();
  const html = `<h2>Hello from GS1 Resolver Host ${process.env.HOSTNAME}</h2><h3>Current server time is " + ${dateNow} + "</h3>`;

  // Some essential metrics we can use!
  // Current date/time in the container
  hello.serverDateTime = dateNow;

  // The internal host name of the container (usually just random letters and numbers)
  hello.hostName = process.env.HOSTNAME;

  // This will return the number of requests processed by the container since it started
  hello.requestsProcessed = requestCounter;

  // The file /resolver/src/builddatetime.txt is created during the image build for this container, in Dockerfile.
  hello.buildDateTime = await readFileAsync('./src/builddatetime.txt', { encoding: 'utf8' });

  resolver.resolverHTTPResponse(httpResponse, { 'X-STATS': JSON.stringify(hello) }, html, 200, processStartTime);
};

/**
 * Sends the favIcon.ico file stored in the container path ./templates/interstitial/favicon.ico
 * @param response
 * @returns {Promise<void>}
 */
const sendFavIcon = async (response) => {
  response.writeHead(200, { 'Content-Type': 'image/x-icon' });
  const iconBinaryStream = fs.createReadStream('./templates/interstitial/favicon.ico');
  iconBinaryStream.on('open', () => {
    iconBinaryStream.pipe(response);
  });
  console.log('favicon requested');
};

/**
 * Sends the GS1 logo as a binary file  stored in the container path ./templates/interstitial/gs1logo.png
 * @param response
 * @returns {Promise<void>}
 */
const sendGS1LogoPNG = async (response) => {
  response.writeHead(200, { 'Content-Type': 'image/x-icon' });
  const iconBinaryStream = fs.createReadStream('./templates/interstitial/gs1logo.png');
  iconBinaryStream.on('open', () => {
    iconBinaryStream.pipe(response);
  });
  console.log('GS1 Logo PNG image requested');
};

/**
 * The primary (only!) request handler for incoming digital link resolving requests.
 * @param request
 * @param response
 * @returns {Promise<void>}
 */
const requestHandler = async (request, response) => {
  // Start the timer!
  const processStartTime = new Date().getTime();
  console.time('PROCESSTIME');

  requestCounter += 1;

  console.log(`======= New Incoming Request #${requestCounter}:`, request.url);

  // This is an 'are you there?!' test
  if (request.url.toLowerCase() === '/hello') {
    await sayHello(response, processStartTime);
  } else if (request.url.toLowerCase() === '/favicon.ico') {
    await sendFavIcon(response);
  } else if (request.url.toLowerCase() === '/gs1logo.png') {
    await sendGS1LogoPNG(response);
  } else if (request.url.toLowerCase().includes('/.well-known/gs1resolver')) {
    await resolver.processWellKnownRequest(response, processStartTime);
  } else if (request.url.toLowerCase().includes('/resolverdescriptionfile.schema.json')) {
    await resolver.processResolverDescriptionFile(response, processStartTime);
  } else if (request.url.toLowerCase().startsWith('/unixtime')) {
    await resolver.processUnixTime(request.url, response, processStartTime);
  } else {
    await processDigitalLink(request, response, processStartTime);
  }
  console.log(`======= Completed Request #${requestCounter}:`, request.url);
  console.timeEnd('PROCESSTIME');
};

// Set up Node's built-in http server. This node container will sit behind a front-end https web server or
// load balancer, depending on use.
const server = http.createServer(requestHandler);
server.listen(port, (err) => {
  if (err) {
    console.log('Server listen error:', err);
    return;
  }
  console.log(`GS1 DigitalLink ID Server is listening on port ${port} in this container`);
});

/**
 * These functions exist to shut down the service gracefully when a SIGTERM from Docker Engine or Kubernetes is received.
 */
const serverShutDown = async () => {
  console.info('Resolver ID Web Server - Shutdown completed');
  process.exit(0);
};

process.on('SIGTERM', async () => serverShutDown().then());
