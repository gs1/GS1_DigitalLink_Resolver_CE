const { UnAuthRouteAccess, ErrorResponse, BadRequestParameter } = require('../utils/custom-error');

/**
 * Returns true if the incoming admin auth key matches the one in the environment variable
 * @param req
 * @returns boolean
 */
exports.adminAuthOK = async (req, res, next) => {
  let token = null;
  const { authorization } = req.headers;
  if (authorization && authorization.startsWith('Bearer')) {
    token = authorization.split(' ')[1];
  }
  if (!(token === process.env.ADMIN_AUTH_KEY)) {
    return next(new UnAuthRouteAccess('Not Authorized (Forbidden Access)', 401));
  }
  next();
};

// For check x-kbs-auth-guid header authentication
exports.adminKBSAuth = async (req, res, next) => {
  const kbsAuth = req.header('X-K8S-AUTH-GUID');
  if (!kbsAuth === '01631767-2a12-48c7-befd-13321e46f309') {
    return next(new ErrorResponse('get /healthcheck_livenessprobe: Only authorised for access by Kubernetes LivenessProbe', 401));
  }
  next();
};

exports.checkAuthHeaderInclude = async (req, res, next) => {
  let token = null;
  const { authorization } = req.headers;
  if (authorization && authorization.startsWith('Bearer')) {
    token = authorization.split(' ')[1];
  }

  if (!token) {
    return next(new BadRequestParameter('Bad Parameters request'));
  }
  req.authToken = token;
  next();
};
