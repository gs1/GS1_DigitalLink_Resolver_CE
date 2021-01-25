const http = require('http');
const util = require('util');
const fs = require('fs');

const db = require('./db');
const resolver = require('./resolver');
const responseFuncs = require('./responses');
const utills = require('./helper/utills');

const port = process.env.PORT || 8080;
let requestCounter = 0;

const processDigitalLink = async (request, response, processStartTime) => {
  // Decode the digital link structure from the incoming request
  const structure = await resolver.getDigitalLinkStructure(request.url);
  if (structure.result === 'ERROR') {
    utills.logThis(`processDigitalLink >> URL: ${request.url} -- ${structure.error}`);
    response.writeHead(400, { 'Content-Type': 'application/json' });
    response.end(`{ "error": "${structure.error}" }`);
  } else if (structure) {
    const gs1KeyCode = Object.keys(structure.identifiers[0])[0];
    const gs1KeyValue = structure.identifiers[0][gs1KeyCode];
    const dbDocument = await db.findDigitalLinkEntry(gs1KeyCode, gs1KeyValue);
    if (dbDocument !== null) {
      // We have found a document for this gs1KeyCode and gs1KeyValue
      utills.logThis(`Found the dbDocument for requested URL ${request.url}`);
      resolver.processRequest(request, structure, dbDocument, response, processStartTime);
    } else {
      // we didn't find a document, so we need to check if we have a 'general'
      // redirect for the prefix part of this gs1KeyValue in the the gcp collection
      const gcpDoc = await db.findPrefixEntry(gs1KeyCode, gs1KeyValue);
      if (gcpDoc) {
        resolver.processGCPRedirect(request, gcpDoc, response, processStartTime);
      } else {
        await responseFuncs.response_404_Not_Found_HTML_Page(gs1KeyCode, gs1KeyValue, response, processStartTime);
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

  responseFuncs.resolverHTTPResponse(httpResponse, { 'X-STATS': JSON.stringify(hello) }, html, 200, processStartTime);
};

/**
 * Sends the binary (and text) files stored in the container path ./templates/responses/
 * @param filename
 * @param response
 * @returns {Promise<void>}
 */
const sendBinaryFile = async (filename, response) => {
  if (filename.endsWith('.ico')) {
    response.writeHead(200, { 'Content-Type': 'image/x-icon' });
  } else if (filename.endsWith('.png')) {
    response.writeHead(200, { 'Content-Type': 'image/png' });
  } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
    response.writeHead(200, { 'Content-Type': 'image/jpeg' });
  } else if (filename.endsWith('.css')) {
    response.writeHead(200, { 'Content-Type': 'text/css' });
  } else if (filename.endsWith('.js')) {
    response.writeHead(200, { 'Content-Type': 'text/javascript' });
  } else if (filename.endsWith('.htm') || filename.endsWith('.html')) {
    response.writeHead(200, { 'Content-Type': 'text/html' });
  }
  const iconBinaryStream = fs.createReadStream(`./templates/responses/${filename}`);
  iconBinaryStream.on('open', () => {
    iconBinaryStream.pipe(response);
  });
  console.log(`Binary file ${filename}' requested`);
};

/**
 * The primary (only!) request handler for incoming digital link resolving requests.
 * NOTE: The fake path names for nearly all entries.
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

  const lcRequest = request.url;

  if (lcRequest === '/hello') {
    await sayHello(response, processStartTime);
  } else if (lcRequest === '/favicon.ico') {
    await sendBinaryFile('favicon.ico', response);
  } else if (lcRequest.startsWith('/css/')) {
    await sendBinaryFile(lcRequest.replace('/css/', ''), response);
  } else if (lcRequest.startsWith('/images/')) {
    await sendBinaryFile(lcRequest.replace('/images/', ''), response);
  } else if (lcRequest.startsWith('/scripts/')) {
    await sendBinaryFile(lcRequest.replace('/scripts/', ''), response);
  } else if (lcRequest.includes('/.well-known/gs1resolver')) {
    await resolver.processWellKnownRequest(response, processStartTime);
  } else if (lcRequest.includes('/resolverdescriptionfile.schema.json')) {
    await resolver.processResolverDescriptionFile(response, processStartTime);
  } else if (lcRequest.startsWith('/unixtime')) {
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
