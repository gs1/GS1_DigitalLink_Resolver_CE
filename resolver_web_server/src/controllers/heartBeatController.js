const util = require('util');
const fs = require('fs');
const asynchHandler = require('../middleware/asyncHandler');

const responseFuncs = require('../responses');

/**
 * heartBeatController is the heartbeat / 'are you there?' function
 */
exports.heartBeatController = asynchHandler(async (req, res) => {
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
  // hello.requestsProcessed = requestCounter;

  // The file /resolver/src/builddatetime.txt is created during the image build for this container, in Dockerfile.
  hello.buildDateTime = await readFileAsync('../../src/builddatetime.txt', { encoding: 'utf8' });

  responseFuncs.resolverHTTPResponse(res, { 'X-STATS': JSON.stringify(hello) }, html, 200, req.processStartTime);
});
