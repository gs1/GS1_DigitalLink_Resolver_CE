const processStartTime = (req, res, next) => {
  const startTime = new Date().getTime();
  // add process start time as property in request object, this prop will be used by any router response to client
  req.processStartTime = startTime;
  next();
};

module.exports = processStartTime;
