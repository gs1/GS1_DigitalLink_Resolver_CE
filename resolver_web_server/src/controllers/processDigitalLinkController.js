const asynchHandler = require('../middleware/asyncHandler');
const { getDigitalLinkStructure } = require('../resolver');
const { BadRequestParameter } = require('../utils/custom-error');
const { findDigitalLinkEntryUsingIdentifier, findDigitalLinkPrefixEntry } = require('../db/query-controller/digitalLinkDBController');
const utills = require('../helper/utills');
const resolver = require('../resolver');
const responseFuncs = require('../responses');

exports.identificationKeyController = asynchHandler(async (req, res, next) => {
  // Decode the digital link structure from the incoming request
  const { originalUrl } = req;
  const structure = await getDigitalLinkStructure(originalUrl);

  // Check error of digital link structure
  if (structure.result.toUpperCase() === 'ERROR') {
    return next(new BadRequestParameter('Invalid identification key or value in a requested URL'));
  }
  const { identifiers } = structure;
  const identifiersArr = Object.entries(identifiers[0])[0];
  const identifierKeyType = identifiersArr[0];
  const identifierKey = identifiersArr[1];
  const dbDocument = await findDigitalLinkEntryUsingIdentifier({ identifierKeyType, identifierKey });
  if (dbDocument !== null) {
    // We have found a document for this gs1KeyCode and gs1KeyValue
    utills.logThis(`identificationKeyController: Found the dbDocument for requested URL ${req.url}`);
    resolver.processRequest(req, structure, dbDocument, res, req.processStartTime);
  } else {
    // we didn't find a document, so we need to check if we have a 'general'
    // redirect for the prefix part of this gs1KeyValue in the the gcp collection
    const gcpDoc = await findDigitalLinkPrefixEntry({ identifierKeyType, identifierKey });
    if (gcpDoc) {
      resolver.processGCPRedirect(req, gcpDoc, res, req.processStartTime, identifierKeyType);
    } else {
      await responseFuncs.response_404_Not_Found_HTML_Page(identifierKeyType, identifierKey, res, req.processStartTime);
    }
  }
});
