const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const resolverRequest = require('./routes/resolverRequest');
const resolverResponse = require('./routes/resolverResponse');
const resolverReference = require('./routes/ref');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/ui', express.static('public'));
app.use('/api/request', resolverRequest);
app.use('/api/response', resolverResponse);
app.use('/api/ref', resolverReference);

// catch 404 and forward to error handler
app.use(function (req, res, next)
{
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next)
{
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

/**
 * These functions exist to shut down the service gracefully when a SIGINT or SIGUSR(n) from Docker Engine is received.
 */
const serverShutDown = async () =>
{
    console.info("Shutdown in progress - closing databases");
    console.info("Shutdown completed");
    process.exit(0);
};

process.on('SIGINT',  async () => await serverShutDown());
process.on('SIGUSR1', async () => await serverShutDown());
process.on('SIGUSR2', async () => await serverShutDown());
process.on('SIGWINCH', async () => await serverShutDown());
