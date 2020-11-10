const CustomErrorBaseClass = require('./customErrorBaseClass');

class ServerResponseError extends CustomErrorBaseClass {
  constructor(message) {
    super(message);
  }
}

class ErrorResponse extends ServerResponseError {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 500;
    this.cause = `Server Error Response - ${message}`;
  }
}

module.exports = {
  ServerResponseError,
  ErrorResponse,
};
