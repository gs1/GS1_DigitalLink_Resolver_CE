/**
 * upload.js is the 'startup' file for Node. It runs continuously as a simple HTTP server used principally by Docker Engine
 * to test its Health (see Dockerfile), although it also has a "/build" command if, in the future, an externally-triggered
 * BUILD is required. Otherwise, BUILD is executed regular by an interval timer set at the bottom of this file.
 */

const http = require('http');
const build = require('./build');
const sqldb = require('./sqldb');
const mongodb = require('./mongodb');
const utils = require("./resolverUtils");

const port = process.env.PORT || 80;
const buildSecs = process.env.BUILD_INTERVAL_SECONDS || 10;
const processIntervalMilliSeconds = buildSecs * 1000;

global.buildRunningFlag = false;
global.buildRunningSince = new Date();
global.serverRunningSince = new Date();
global.serverRunningSince = new Date();


/**
 * requestHandler processes incoming requests to the HTTP service
 * @param request
 * @param response
 * @returns {Promise<void>}
 */
const requestHandler = async (request, response) =>
{
    if (request.url.toLowerCase() === "/build")
    {
        utils.logThis("Build process requested");
        {
            if(!global.buildRunningFlag)
            {
                utils.logThis("Web request: Starting Build process");
                build.run();
                response.end('{"STATUS": "BUILD PROCESS STARTED"}');
            }
            else
            {
                utils.logThis("Web Request: Build already running");
                response.end('{"STATUS": "BUILD PROCESS ALREADY RUNNING"}');
            }
        }
        response.writeHead(200, {'Content-Type': 'application/json'});
    }
    if (request.url.toLowerCase().startsWith("/buildkey"))
    {
        //Here we are building from entries for a specific GS1 Key Code and GS1 Key Value
        //which is in the format /buildkey/<identificationKeyType>/<identificationKey>
        const requestCodes = request.url.split("/");
        response.writeHead(200, {'Content-Type': 'application/json'});
        if(requestCodes.length === 4)
        {
            const identificationKeyType = requestCodes[2];
            const identificationKey = requestCodes[3];
            utils.logThis(`Update Build Requested for just GS1 Key Code: ${identificationKeyType} and GS1 Key Value: ${identificationKey}`);
            {
                //TODO: Manage the load should entries that are simply not in the SQL database keep getting asked for - e.g. a MongoDB '404' placeholder for this gs1 key code and value which goes stale after a week?
                const success = await build.performIdKeyTypeAndValueURIDocumentBuild(identificationKeyType, identificationKey);
                if(success)
                {
                    response.end('{"SUCCESS": "Y"}');
                }
                else
                {
                    response.end('{"SUCCESS": "N"}');
                }
            }
        }
        else
        {
            response.end('{"ERROR": "Invalid buildkey request - format is /buildkey/<identificationKeyType>/<identificationKey>" }')
        }
    }
    else if (request.url.toLowerCase() === "/healthcheck")
    {
        utils.logThis("Healthcheck process requested");
        response.writeHead(200, {'Content-Type': 'application/json'});
        if(global.buildRunningFlag)
        {
            response.end(`{"STATUS": "OK - SERVER SYNC ID [${global.syncId}] HOSTNAME [${process.env.HOSTNAME}] - BUILD IN PROGRESS SINCE ${global.buildRunningSince} - SERVER UP SINCE ${global.serverRunningSince}" }`);
        }
        else
        {
            response.end(`{"STATUS": "OK - SERVER SYNC ID [${global.syncId}] HOSTNAME [${process.env.HOSTNAME}] - NO BUILD RUNNING AT PRESENT - SERVER UP SINCE ${global.serverRunningSince}"}`);
        }
    }
    else
    {
        utils.logThis(`Unknown command request: ${request.url}`);
        response.end(`Unknown command request: ${request.url}`);
    }


};

/**
 * This function sets up the HTTP listening service.
 * @type {Server}
 */
const server = http.createServer(requestHandler);
server.listen(port, async (err) =>
{
    await mongodb.getResolverDatabaseIdFromMongoDB();

    if (err)
    {
        return utils.logThis(`GS1 DigitalLink Build Sync Server SYNC ID [${global.syncId}] HOSTNAME [${process.env.HOSTNAME}] listen error:`, err);
    }
    utils.logThis(`GS1 DigitalLink Build Sync Server SYNC ID [${global.syncId}] HOSTNAME [${process.env.HOSTNAME}] is listening on ${port} with Build event interval every ${buildSecs} seconds`);
});


/**
 * This important function runs the BUILD process at regular intervals defined in the processIntervalMilliSeconds variable.
 */
setInterval(async () =>
{
    if(!global.buildRunningFlag)
    {
        utils.logThis("Interval timer: Starting Build process");
        await build.run();
    }
    else
    {
        utils.logThis("Interval timer: Build already running");
    }
}, processIntervalMilliSeconds);


/**
 * These functions exist to shut down the service gracefully when a SIGINT or SIGUSR(n) from Docker Engine is received.
 */
const serverShutDown = async () =>
{
    console.info("Shutdown in progress - closing databases");
    await mongodb.closeDB();
    await sqldb.closeDB();
    console.info("Shutdown completed");
    process.exit(0);
};

process.on('SIGINT',  async () => await serverShutDown());
process.on('SIGTERM', async () => await serverShutDown());
process.on('SIGUSR1', async () => await serverShutDown());
process.on('SIGUSR2', async () => await serverShutDown());
