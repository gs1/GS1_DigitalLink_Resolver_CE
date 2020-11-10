const helmet = require('helmet');

// Overwrite the CSP props manually (i.e. allow inline script/style for own application domain name replace CSP_NONCE_SOURCE_URL in configuration file for whitelist domain name )
const customContentSecurityPolicy = (req, res, next) =>
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", process.env.CSP_NONCE_SOURCE_URL],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
    reportOnly: false,
  });

module.exports = {
  customContentSecurityPolicy,
};
