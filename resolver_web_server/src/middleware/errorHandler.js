const utils = require('../helper/utills');

const { ValidationError, ServerResponseError } = require('../utils/custom-error');

const errorHandler = (err, req, res, next) => {
  utils.logThis('Inside the ErrorHandler function of resolver_web_service');
  utils.logThis(`err.message = ${err.message}`);
  utils.logThis(`err.cause = ${err.cause}`);
  if (!(err.message || err.cause)) {
    next();
  }
  utils.logThis(`${err.cause || err.message} -- ${err.name}`);
  const _err = {
    statusCode: 500,
    message: 'Something went wrong in server!!!',
  };

  if (err instanceof ValidationError || err instanceof ServerResponseError) {
    _err.statusCode = err.statusCode;
    _err.message = err.message;
  }
  res.status(_err.statusCode).json({
    success: false,
    error: _err.message,
  });
};

module.exports = errorHandler;
