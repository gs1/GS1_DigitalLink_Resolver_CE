const asynchHandler = require('../middleware/asyncHandler');
const responseFuncs = require('../responses');

const { uriEntriesCountFromUnixTime, uriPagedEntriesFromUnixTime } = require('../db/query-controller/uriDbController');

exports.unixTimeCountController = asynchHandler(async (req, res) => {
  const { unixtime } = req.params;
  const count = await uriEntriesCountFromUnixTime(unixtime);
  await responseFuncs.resolverHTTPResponse(res, { 'Content-Type': 'application/json' }, JSON.stringify({ count }, null, 2), 200, req.processStartTime);
});

exports.unixTimePageController = asynchHandler(async (req, res) => {
  let { unixtime, pagenumber, limit } = req.params;
  unixtime = parseInt(Math.abs(unixtime), 10) || 0;
  pagenumber = parseInt(Math.abs(pagenumber), 10) || 1;
  limit = parseInt(Math.abs(limit), 10) || 1000;
  limit = limit > 1000 ? 1000 : limit;
  const dbResult = await uriPagedEntriesFromUnixTime({ unixtime, pagenumber, limit });
  const result = { page: pagenumber, limit, data: dbResult };
  await responseFuncs.resolverHTTPResponse(res, { 'Content-Type': 'application/json' }, JSON.stringify(result, null, 2), 200, req.processStartTime);
});
