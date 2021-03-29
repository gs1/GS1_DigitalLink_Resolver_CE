const fs = require('fs');
const util = require('util');

const asynchHandler = require('../middleware/asyncHandler');
const responseFuncs = require('../responses');

/**
 * Returns the resolver description file at /resolver/src/resolverDescriptionFile.schema.json
 * @returns {Promise<void>}
 */
exports.resolverDescFileController = asynchHandler(async (req, res) => {
  const readFileAsync = util.promisify(fs.readFile);
  let resolverDescriptionFile = '';
  resolverDescriptionFile = await readFileAsync('./src/resolverDescriptionFile.schema.json', { encoding: 'utf8' });
  await responseFuncs.resolverHTTPResponse(res, { 'Content-Type': 'application/json' }, resolverDescriptionFile, 200, req.processStartTime);
});
