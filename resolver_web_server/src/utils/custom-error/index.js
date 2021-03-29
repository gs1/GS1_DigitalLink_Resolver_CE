const { ValidationError, BadRequestParameter } = require('./validationError');
const { ServerResponseError, ErrorResponse } = require('./serverResponseError');

module.exports = {
  ValidationError,
  BadRequestParameter,
  ServerResponseError,
  ErrorResponse,
};
