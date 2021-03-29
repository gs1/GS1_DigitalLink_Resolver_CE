const fetch = require('node-fetch');
const url = require('url');

const { BadRequestParameter } = require('../utils/custom-error');

const analyseURI = async (req, res, next) => {
  // Make a request to analysis uri call to DL toolkit
  const _url = `http://digitallink-toolkit-service/analyseuri${req.path}`;
  const fetchData = await fetch(_url);
  const result = await fetchData.json();

  if (result.result.toUpperCase() === 'ERROR') {
    return next(new BadRequestParameter(result.data, 400));
  }
  // Now prepare the full url and send to the next middleware method
  const { data } = result;
  const _ai = Object.entries(data.identifiers[0])[0].join('/');
  const _qualifiers = data.qualifiers.length ? data.qualifiers.reduce((acc, item) => `${acc}${Object.entries(item)[0].join('/')}/`, '') : '';
  const _search = url.parse(req.url, true).search || '';
  const _newPath = `/${_ai}/${_qualifiers}${_search}`;
  req.url = _newPath;
  next();
};

module.exports = analyseURI;
