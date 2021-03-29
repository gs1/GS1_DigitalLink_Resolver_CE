const asynchHandler = require('../middleware/asyncHandler');
const utils = require('../bin/resolver_utils');
const validate = require('../bin/validate');

const { ErrorResponse, UnAuthRouteAccess, BadRequestParameter } = require('../utils/custom-error');

// Load DB CRUD operation methods
const {
  checkAPIAuth,
  countURIEntriesUsingGLN,
  searchURIEntriesByIdentificationKeyAndGLN,
  searchURIResponsesByURIEntryId,
  deleteURIEntryByIdentificationKeyAndGLN,
  getValidationResultForBatchFromDB,
  fetchDataEntriesByPage,
  upsertURIEntry,
  upsertURIResponse,
  // saveDataEntriesURIValidationResultToDB,
  publishValidatedEntries,
} = require('../db/query-controller/data-entries');

const {
  processBatchValidationResp,
  generateBatchId_v2,
  validateResolverEntriesArray_QuickCheck,
  cleanAndParseDataEntryResponse,
  setMissingDefaultsForAbsentResolverResponseProperties,
  cleanResolverEntry,
  checkResolverResponsePropertiesArePresent,
} = require('../controller-helper/dataEntries');

// get URI Date
exports.getDataEntryDate = asynchHandler(async (req, res) => {
  const dateObj = new Date();
  res.send({
    staus: true,
    message: 'GS1 Resolver Data Entry API',
    SERVICEDATETIME: dateObj,
  });
});

/*
 * * getAllDataEntriesCount
 * * @desc   Get and returns a count of all the resolver entries owned by the specified GLN.
 * * @route  GET /resolver/all/count
 * * @access Private
 * * @params required auth bearer token <auththentication-key>
 */
exports.getAllDataEntriesCount = asynchHandler(async (req, res, next) => {
  const { authToken } = req;
  const isValidUser = await checkAPIAuth(authToken);

  if (!isValidUser[0].success) {
    return next(new UnAuthRouteAccess('Unauthorized Access (Forbidden)'));
  }
  const memberGLN = isValidUser[0].member_primary_gln;
  const uriEntriesCountResponse = await countURIEntriesUsingGLN(memberGLN);
  if (!uriEntriesCountResponse) {
    return next(new ErrorResponse('Error to getting uri count', 500));
  }
  res.send({
    success: true,
    count: uriEntriesCountResponse[0].entry_count,
    data: { count: uriEntriesCountResponse[0].entry_count },
  });
});

/*
 * * getURIEntriesUsingIKeyAndGLN
 * * @desc   Get for Resolver Entries using Identification Key Type and Identification Key
 * * @route  GET /resolver/:identificationKeyType/:identificationKey
 * * @access Private
 * * @params required auth bearer token <auththentication-key>
 */
exports.getURIEntriesUsingIKeyAndGLN = asynchHandler(async (req, res, next) => {
  const { authToken } = req;
  const isValidUser = await checkAPIAuth(authToken);

  if (!isValidUser[0].success) {
    return next(new UnAuthRouteAccess('Unauthorized Access (Forbidden)'));
  }
  const issuerGLN = isValidUser[0].member_primary_gln;
  const { identificationKeyType, identificationKey } = req.params;
  const idKeyTypeAI = utils.convertShortCodeToAINumeric(identificationKeyType);

  const officialDef = await utils.getDigitalLinkStructure(`/${idKeyTypeAI}/${identificationKey}`);

  if (!officialDef.SUCCESS) {
    return next(new BadRequestParameter('Bad Parameters request'));
  }

  const searchURIEntriesData = await searchURIEntriesByIdentificationKeyAndGLN({
    issuerGLN,
    identificationKeyType: officialDef.identificationKeyType,
    identificationKey: officialDef.identificationKey,
  });

  if (!searchURIEntriesData) {
    return next(new ErrorResponse('Error to searching uri data entries', 500));
  }
  let convertedObj = utils.decodeSQLSafeResolverArray_v2(searchURIEntriesData);
  convertedObj = await utils.convertPropsToAPIFormat(convertedObj);

  // Loop over each URI entries and fetch response using uriEntryId
  for await (const entry of convertedObj) {
    let searchResponseData = await searchURIResponsesByURIEntryId(entry.uriEntryId);
    searchResponseData = await utils.convertPropsToAPIFormat(utils.decodeSQLSafeResolverArray_v2(searchResponseData));
    delete entry.uriEntryId;
    delete entry.issuerGLN;
    entry.responses = searchResponseData;
  }
  res.send({
    success: true,
    count: convertedObj.length,
    data: convertedObj,
  });
});

/*
 * * deleteURIEntriesUsingIKey
 * * @desc   Delete for Resolver Entries using Identification Key Type and Identification Key
 * * @route  DELETE /resolver/:identificationKeyType/:identificationKey
 * * @access Private
 * * @params required auth bearer token <auththentication-key>
 */
exports.deleteURIEntriesUsingIKey = asynchHandler(async (req, res, next) => {
  const { authToken } = req;
  const isValidUser = await checkAPIAuth(authToken);

  if (!isValidUser[0].success) {
    return next(new UnAuthRouteAccess('Unauthorized Access (Forbidden)'));
  }
  const issuerGLN = isValidUser[0].member_primary_gln;
  const { identificationKeyType, identificationKey } = req.params;
  const idKeyTypeAI = utils.convertShortCodeToAINumeric(identificationKeyType);
  const officialDef = await utils.getDigitalLinkStructure(`/${idKeyTypeAI}/${identificationKey}`);

  if (!officialDef.SUCCESS) {
    return next(new BadRequestParameter('Bad Parameters request'));
  }
  const deleteURIEntryResp = await deleteURIEntryByIdentificationKeyAndGLN({
    issuerGLN,
    identificationKeyType: officialDef.identificationKeyType,
    identificationKey: officialDef.identificationKey,
  });

  res.status(200).json({
    status: true,
    data: { SUCCESS: deleteURIEntryResp[0].SUCCESS, identificationKeyType: officialDef.identificationKeyType, identificationKey: officialDef.identificationKey },
  });
});

/**
 * * validateBatchURI
 * * @desc Retrieves the validation results from the database and converts the property names from DB format to API camelCase format.
 * * @route  GET /resolver/validation/batch/:batchId
 * * @access Private
 * * @params required auth bearer token <auththentication-key>
 * * @param batchId
 */
exports.validateBatchURI = asynchHandler(async (req, res, next) => {
  const { authToken } = req;
  const isValidUser = await checkAPIAuth(authToken);
  if (!isValidUser[0].success) {
    return next(new UnAuthRouteAccess('Unauthorized Access (Forbidden)', 401));
  }
  const issuerGLN = isValidUser[0].member_primary_gln;
  const { batchId } = req.params;

  const batchRespData = await getValidationResultForBatchFromDB({
    issuerGLN,
    batchId,
  });
  // Process validation result set based on STATUS Value
  const processValidationData = processBatchValidationResp(batchRespData);
  const validationDataAPIFormat = await utils.convertPropsToAPIFormat(processValidationData.validations);

  res.status(200).json({
    status: true,
    batchStatus: processValidationData.STATUS,
    data: validationDataAPIFormat,
  });
});

/**
 * * getDataEntriesByPage
 * * @desc Search for Resolver Entries using GLN from the lowest uriEntryId value and with maximum batch size.If batch size > 100 then it is forced down to 100.
 * * @route GET /resolver/all/page/:pageNumber/size/:pageSize
 * * @access Private
 * * @params required auth bearer token <auththentication-key>
 * * @param pageNumber, pageSize
 */
exports.getDataEntriesByPage = asynchHandler(async (req, res, next) => {
  const { authToken } = req;
  const isValidUser = await checkAPIAuth(authToken);
  if (!isValidUser[0].success) {
    return next(new UnAuthRouteAccess('Unauthorized Access (Forbidden)', 401));
  }
  const issuerGLN = isValidUser[0].member_primary_gln;
  let { pageNumber, pageSize } = req.params;
  pageNumber = pageNumber || 1;
  pageSize = pageSize > 1000 ? 100 : pageSize || 100;

  const dataEntriesRespData = await fetchDataEntriesByPage({
    issuerGLN,
    pageNumber,
    pageSize,
  });

  let convertedObj = utils.decodeSQLSafeResolverArray_v2(dataEntriesRespData);
  convertedObj = await utils.convertPropsToAPIFormat(convertedObj);

  // Loop over each URI entries and fetch response using uriEntryId
  for await (const entry of convertedObj) {
    let searchResponseData = await searchURIResponsesByURIEntryId(entry.uriEntryId);
    searchResponseData = await utils.convertPropsToAPIFormat(utils.decodeSQLSafeResolverArray_v2(searchResponseData));
    delete entry.uriEntryId;
    delete entry.issuerGLN;
    entry.responses = searchResponseData;
  }

  res.status(200).json({
    status: true,
    count: convertedObj.length,
    data: convertedObj,
  });
});

/*
 * * addDataURIEntry
 * * @desc   Post for Resolver Entries using Identification Key Type and Identification Key
 * * @route  POST /resolver
 * * @access Private
 * * @params required auth bearer token <auththentication-key>
 *   @params in Array i.e. [{}]
 */
exports.addDataURIEntry = asynchHandler(async (req, res, next) => {
  const { authToken, body } = req;
  const isValidUser = await checkAPIAuth(authToken);

  if (!isValidUser[0].success) {
    return next(new UnAuthRouteAccess('Unauthorized Access (Forbidden)'));
  }
  const issuerGLN = isValidUser[0].member_primary_gln;

  if (!Array.isArray(body)) {
    return next(new BadRequestParameter('Bad request parameter(s)'));
  }

  // Create a new batch Id and validate the data entries parameters, return the status immediatialy.
  const batchIdAndEntriesObj = await processBatchAndValidateEntries(body);
  // We'll send the batchID and any quickly-found bad entries back in response end this connection.
  res.send(batchIdAndEntriesObj);

  // START - FROM THIS LINE, THE SERVER IS PROCESSING THIS CODE VIA THE EVENT LOOP QUEUE ////////////////////////////////////
  // If the length of the badEntries array is the same as the body array length, there's no point in continuing!
  if (batchIdAndEntriesObj.badEntries.length < body.length) {
    // Now send the more serious checking off into an asynchronous batch save and check.
    // Everything we do now is happening asynchronously as we send tasks into the event loop.
    processBatchToSaveDataEntries({
      issuerGLN,
      requestBody: body,
      batchId: batchIdAndEntriesObj.batchId,
    });
  }
});

// This function is for create batchId and validate addDataEntry parameters in request
const processBatchAndValidateEntries = async (entriesObj) => {
  const processObj = { batchId: 0, badEntries: [] };
  processObj.batchId = generateBatchId_v2();

  // check validation entries that supplies as API's parameters
  processObj.badEntries = await validateResolverEntriesArray_QuickCheck(entriesObj);
  return processObj;
};

// Definition to process data entries to DB using batch
const processBatchToSaveDataEntries = asynchHandler(async ({ issuerGLN, requestBody, batchId }) => {
  const savedUpsertArray = [];
  const dataEntriesResponseArr = await cleanAndParseDataEntryResponse(requestBody);

  // First save the request of the entry. This function upsertURIEntry will return
  // an object like this: { SUCCESS: true, uriEntryID: 12345 }
  // ..where uriEntryID is the primary key identity ID of the saved request part of
  // the resolver entry. This value will be used to link the responses to the request in
  // the SQL database.try
  for await (const resolverEntry of dataEntriesResponseArr) {
    if (resolverEntry.validationCode === global.entryResponseStatusCode.OK) {
      // get official definitions for GS1 Key Code and Value as this is what we must store in the SQL database
      const officialDef = await utils.getDigitalLinkStructure(`/${resolverEntry.identificationKeyType}/${resolverEntry.identificationKey}`);
      if (!officialDef.SUCCESS) {
        // Failed the Digital Link toolkit test
        utils.logThis(`${resolverEntry.identificationKeyType}/${resolverEntry.identificationKey} - failed the Digital Link toolkit test`);
      } else {
        // this will change any identificationKeyType as a shortcode (e.g. 'gtin') to its numeric equivalent (e.g.'01')
        resolverEntry.identificationKeyType = officialDef.identificationKeyType;
        resolverEntry.identificationKey = officialDef.identificationKey;
        // Convert active flag into 1 or 0, and add issuerGLN just for the SQL call, convert item description to use SQLSafe
        resolverEntry.active = resolverEntry.active ? 1 : 0;
        resolverEntry.issuerGLN = issuerGLN;
        resolverEntry.itemDescription = utils.convertTextToSQLSafe_v2(resolverEntry.itemDescription);
        // Add the batchId property ready for entry into the database
        resolverEntry.batchId = batchId;
        // Value 255 is 'pending validation check'
        resolverEntry.validationCode = 255;
        const entryUpsertResultResp = await upsertURIEntry(resolverEntry);
        // check if the upsert URI Entry data response success if yes than make a call to uriResponse to DB
        if (entryUpsertResultResp[0].SUCCESS) {
          const uriEntryId = entryUpsertResultResp[0].uri_entry_id;
          // Loop through each of the resolver response entries:
          for await (const resolverResponse of resolverEntry.responses) {
            resolverResponse.uriEntryId = uriEntryId;
            // Make a call to DB for inserting responses data
            await makeDBReqForDataURIResponses(resolverResponse);
          }
          // Add the successful save to the 'savedUpsertArray':
          savedUpsertArray.push({
            identificationKeyType: resolverEntry.identificationKeyType,
            identificationKey: resolverEntry.identificationKey,
            issuerGLN,
          });
        }
      }
    }
  }

  utils.logThis(`Save of batchId ${batchId} completed`);
  // Validate the entries
  await validate.validateBatchOfEntries(savedUpsertArray);
  // Publish any entries validated as OK
  const publishCount = await publishValidatedEntries(batchId);
  utils.logThis(`${publishCount[0].entriesPublishedCount} entries were published`);
});

// Method to loop over each entries and response to make insert request to DB
const makeDBReqForDataURIResponses = async (incomingResolverResponse) => {
  const resolverResponse = setMissingDefaultsForAbsentResolverResponseProperties(cleanResolverEntry(incomingResolverResponse));
  if (checkResolverResponsePropertiesArePresent(resolverResponse)) {
    const upsertURIDataResp = await upsertURIResponse(resolverResponse);
    return upsertURIDataResp.SUCCESS;
  }
  return false;
};
