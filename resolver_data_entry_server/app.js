const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');


//loading the globalVariables.js script adds some lookup arrays within to global object context
require('./bin/globalVariables');

const daemonServices = require('./bin/daemonServices');
const resolverDataEntryAPI = require('./routes/resolverDataEntry');
const resolverGCPRedirectAPI = require('./routes/resolverGCPRedirect');
const resolverReferenceAPI = require('./routes/ref');
const resolverAdminAPI = require('./routes/admin');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Set the maximum size limit to 10 MB
app.use(bodyParser.json({limit: '10mb', extended: true, parameterLimit: 100000}))
app.use(bodyParser.urlencoded({limit: '10mb', extended: true, parameterLimit: 100000}))

//Set up the API and UI endpoints
app.use('/ui', express.static('public'));
app.use('/resolver', resolverDataEntryAPI);
app.use('/redirect', resolverGCPRedirectAPI);
app.use('/reference', resolverReferenceAPI);
app.use('/admin', resolverAdminAPI);

// catch 404 and forward to error handler
app.use(function (req, res, next)
{
    res.sendStatus(404);
});

// error handler
app.use(function (err, req, res, next)
{
    res.sendStatus(err.status || 500);
});

//Set up and launch any daemons required:
daemonServices.endOfDay_d();
daemonServices.updateLinktypes_d();


module.exports = app;
