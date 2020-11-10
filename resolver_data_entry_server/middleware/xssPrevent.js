const xss = require('xss');

const cleanXSSData = (data = '') => {
  let isObject = false;
  if (typeof data === 'object') {
    data = JSON.stringify(data);
    isObject = true;
  }
  data = xss(data).trim();
  if (isObject) data = JSON.parse(data);

  return data;
};
module.exports = () => (req, res, next) => {
  if (req.body) req.body = cleanXSSData(req.body);
  if (req.query) req.query = cleanXSSData(req.query);
  if (req.params) req.params = cleanXSSData(req.params);

  next();
};
