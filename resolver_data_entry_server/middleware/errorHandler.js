const utils = require('../bin/resolver_utils');

const { AuthenticationError, ValidationError, ServerResponseError } = require('../utils/custom-error');

const errorHandler = (err, req, res, next) => {
  utils.logThis('Inside the ErrorHandler function of resolver_data_entry_service');
  utils.logThis(`${err.cause || err.message} -- ${err.name}`);

  if (!(err.message || err.cause)) {
    next();
  }
  const _err = {
    statusCode: 500,
    message: 'Something went wrong in server!!!',
  };

  if (err instanceof AuthenticationError || err instanceof ValidationError || err instanceof ServerResponseError) {
    _err.statusCode = err.statusCode;
    _err.message = err.message;
  }

  res.status(_err.statusCode).json({
    success: false,
    error: _err.message,
  });
};

module.exports = errorHandler;
