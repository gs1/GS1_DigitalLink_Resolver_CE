const fs = require('fs');
const util = require('util');
const fetch = require('node-fetch');
const utills = require('../helper/utills');

const asynchHandler = require('../middleware/asyncHandler');
const responseFuncs = require('../responses');

exports.wellKnownController = asynchHandler(async (req, res, next) => {
  const readFileAsync = util.promisify(fs.readFile);
  let wellKnownJson = '';

  // Get the wellknown main file, which we will be adding the linktypes to:
  wellKnownJson = await readFileAsync('./src/wellknown.json', { encoding: 'utf8' });

  // Go and get the up to date linktypes list
  const fetchResponse = await fetch('https://www.gs1.org/voc/?show=linktypes', {
    method: 'get',
    headers: { Accept: 'application/json' },
  });

  if (fetchResponse.status === 200) {
    // Get the linktypes list as JSON from the response
    const linkTypes = await fetchResponse.json();
    // Convert the JSON in wellKnownJSON to an object
    const wellKnown = JSON.parse(wellKnownJson);

    // Add GTIN to each linktype property as applying to that particular GS! key Code
    for (const linkTypeKey of Object.keys(linkTypes)) {
      linkTypes[linkTypeKey].gs1key = 'gtin';
    }

    // Add the linktypes list to the wellknown document
    wellKnown.activeLinkTypes = {};
    wellKnown.activeLinkTypes['en-GB'] = linkTypes;
    wellKnown.activeLinkTypes['en-US'] = linkTypes;

    // Convert the wellknown doc back to JSON
    wellKnownJson = JSON.stringify(wellKnown, null, 2);
    // Send the results back to the calling user
    await responseFuncs.resolverHTTPResponse(res, { 'Content-Type': 'application/json' }, wellKnownJson, 200, req.processStartTime);
  } else {
    // httpResponse.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    next(new Error('Internal Server Error'));
    utills.logThis('processWellKnownRequest get linktypes error: received status ', fetchResponse.status);
  }
});
