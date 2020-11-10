const { AuthenticationError, UnAuthRouteAccess } = require('./authenticationError');

const { ValidationError, BadRequestParameter } = require('./validationError');
const { ServerResponseError, ErrorResponse } = require('./serverResponseError');

module.exports = {
  AuthenticationError,
  UnAuthRouteAccess,
  ValidationError,
  BadRequestParameter,
  ServerResponseError,
  ErrorResponse,
};
