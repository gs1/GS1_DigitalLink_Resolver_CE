const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const hpp = require('hpp');
const xssPrevent = require('./middleware/xssPrevent');
const { customContentSecurityPolicy } = require('./middleware/securityHeaders');

// loading the globalVariables.js script adds some lookup arrays within to global object context
require('./bin/globalVariables');

const daemonServices = require('./bin/daemonServices');
const resolverDataEntryAPI = require('./routes/resolverDataEntryAPI');
const resolverGCPRedirectAPI = require('./routes/resolverGCPRedirectAPI');
const resolverReferenceAPI = require('./routes/ref');
const resolverAdminAPI = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Setting Security Headers middleware
app.use(helmet(), customContentSecurityPolicy());

// Handling XSS attacks middleware
app.use(xssPrevent());

// Prevent http params pollution middleware
app.use(hpp());

// Set the maximum size limit to 10 MB
app.use(bodyParser.json({ limit: '10mb', extended: true, parameterLimit: 100000 }));
app.use(
  bodyParser.urlencoded({
    limit: '10mb',
    extended: true,
    parameterLimit: 100000,
  }),
);

// Set up the API and UI endpoints
app.use('/ui', express.static('public'));
app.use('/resolver', resolverDataEntryAPI);
app.use('/redirect', resolverGCPRedirectAPI);
app.use('/reference', resolverReferenceAPI);
app.use('/admin', resolverAdminAPI);
// app.use("/admin/heardbuildsyncservers", resolverAdminAPI);

// Error handler middleware
app.use(errorHandler);

// catch 404 and forward to error handler
app.use((req, res) => {
  res.sendStatus(404);
});

// error handler
app.use((err, req, res) => {
  res.sendStatus(err.status || 500);
});

// Set up and launch any daemons required:
daemonServices.endOfDay_d();
daemonServices.updateLinktypes_d();

/**
 * These functions exist to shut down the service gracefully when a SIGTERM from Docker Engine or Kubernetes is received.
 */
const serverShutDown = async () => {
  console.info('Resolver Data Entry Server - Shutdown completed');
  process.exit(0);
};

// eslint-disable-next-line no-return-await
process.on('SIGTERM', async () => await serverShutDown());

module.exports = app;
