const express = require('express');

const app = express();

const path = require('path');
const utils = require('./helper/utills');

const errorHandler = require('./middleware/errorHandler');
const heartBeatRouter = require('./routes/heartBeatRouter');
const wellKnownRouter = require('./routes/wellKnownRouter');
const unixTimeRouter = require('./routes/unixTimeRouter');
const aiRouterApp = require('./routes/aiRouter');
const analyseURI = require('./middleware/analyseURI');
const resolverDescFileRouter = require('./routes/resolverDescFileRouter');
// route handler of dashboard page of resolver application
const dashboardController = require('./dashboard/dashboardController');
const utilDbController = require('./db/query-controller/utilDbController');

const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// Setup the routes for API or requested endpoint(s)
app.use('/resolverdescriptionfile.schema.json', resolverDescFileRouter);
app.use('/.well-known/resolverdescriptionfile.schema.json', resolverDescFileRouter);
app.use('/hello', heartBeatRouter);
app.use('/.well-known', wellKnownRouter);
app.use('/unixtime', unixTimeRouter);
app.use('/dashboard', dashboardController);
app.use('/health/live', (req, res) => {res.status(200).send('OK');});
app.use('/health/ready', utilDbController);
app.use('/', analyseURI, aiRouterApp);

// Error handler middleware
app.use(errorHandler);

// catch 400 and forward to error handler (was 404 but only gets triggered with Bad Requests)
app.use(async (req, res) => {
  utils.logThis(`400 request of url :  ${req.url}`);
  res.statusCode = 400;
  res.sendFile(path.resolve('public/responses', '400.html'));
});

app.listen(PORT, (err) => {
  if (err) {
    console.log('Server listen error:', err);
    return;
  }
  console.log(`GS1 DigitalLink ID Server is listening on port ${PORT} in this container`);
});

/**
 * These functions exist to shut down the service gracefully when a SIGTERM from Docker Engine or Kubernetes is received.
 */
const serverShutDown = async () => {
  console.info('Resolver ID Web Server - Shutdown completed');
  process.exit(0);
};

process.on('SIGTERM', async () => serverShutDown().then());

// Handle UnhandlePromiseRejection error
process.on('unhandledRejection', (err) => {
  utils.logThis(`Error catch in unhandledRejection method : ${err.message}`);
});
