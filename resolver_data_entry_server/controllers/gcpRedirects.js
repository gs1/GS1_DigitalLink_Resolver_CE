const asynchHandler = require('../middleware/asyncHandler');
const utils = require('../bin/resolver_utils');
const { checkAPIAuth, searchGCPRedirectsByGLN, upsertGCPRedirect, removeGCPRedirect } = require('../db/query-controller/gcp-redirect');
const { ErrorResponse, BadRequestParameter, UnAuthRouteAccess } = require('../utils/custom-error');

// For get GCP Date
exports.getGCPDate = asynchHandler(async (req, res) => {
  const dateObj = new Date();
  res.send({
    staus: true,
    message: 'GS1 Resolver Data Entry API - GCP Redirect Service',
    SERVICEDATETIME: dateObj,
  });
});

/*
 * * getAllGCPRedirect
 * * @desc   Retrieve all GCP entries link to the issuerGLN
 * * @route  GET /redirect/all
 * * @access Private
 * * @params required auth bearer token
 */
exports.getAllGCPRedirect = asynchHandler(async (req, res, next) => {
  const { authToken } = req;
  const isValidUser = await checkAPIAuth(authToken);

  if (!isValidUser[0].success) {
    return next(new UnAuthRouteAccess('You are not authorize to access this endpoint'));
  }
  const memberGLN = isValidUser[0].member_primary_gln;
  const gcpSearchResult = await searchGCPRedirectsByGLN(memberGLN);
  if (!gcpSearchResult) {
    return next(new ErrorResponse('GCP redirects data not found', 404));
  }
  // Convert props in respect their API Format
  const convertedPropObj = await utils.convertPropsToAPIFormat(gcpSearchResult);
  res.status(200).json({
    success: true,
    count: convertedPropObj.length,
    data: convertedPropObj,
  });
});

/*
 * * getSingleGCPRedirect
 * * @desc   Retrieve a single GCP redirect entry using identificationkeytyp and gcp
 * * @route  GET /redirect/:identificationKeyType/:gcp
 * * @access Private
 * * @params required auth bearer token
 * * @params identificationKeyType and gcp
 */
exports.getSingleGCPRedirect = asynchHandler(async (req, res, next) => {
  const { authToken } = req;
  const { identificationKeyType, gcp } = req.params;
  const isValidUser = await checkAPIAuth(authToken);

  if (!isValidUser[0].success) {
    return next(new UnAuthRouteAccess('You are not authorize to access this endpoint'));
  }
  const memberGLN = isValidUser[0].member_primary_gln;
  const idKeyTypeAI = utils.convertShortCodeToAINumeric(identificationKeyType);

  const gcpSearchResult = await searchGCPRedirectsByGLN(memberGLN, idKeyTypeAI, gcp);
  if (!gcpSearchResult) {
    return next(new ErrorResponse('GCP redirect data not found', 404));
  }
  // Convert props in respect their API Format
  const convertedPropObj = await utils.convertPropsToAPIFormat(gcpSearchResult);
  res.status(200).json({
    success: true,
    data: convertedPropObj,
  });
});



/*
 * * addNewGCPRedirect
 * * @desc  add new GCP redirect entry to DB
 * * @route  POST /redirect
 * * @access Private
 * * @params required auth bearer token
 * * @params identificationKeyType, prefixValue, targetUrl, active
 */
exports.addNewGCPRedirect = asynchHandler(async (req, res, next) => {
  const { authToken } = req;
  const { identificationKeyType, prefixValue, active, targetUrl } = req.body;
  if (!identificationKeyType || !prefixValue || !(typeof prefixValue === 'string') || !targetUrl || !(typeof targetUrl === 'string') || !utils.detectJavaScriptCode(targetUrl) || !(typeof active === 'boolean')) {
    return next(new BadRequestParameter('Bad request parameters'));
  }
  const isValidUser = await checkAPIAuth(authToken);

  if (!isValidUser[0].success) {
    return next(new UnAuthRouteAccess('You are not authorize to access this endpoint'));
  }
  const issuerGLN = isValidUser[0].member_primary_gln;
  const idKeyType = utils.convertShortCodeToAINumeric(identificationKeyType);
  const success = await upsertGCPRedirect({
    issuerGLN,
    identificationKeyType: idKeyType,
    gcp: prefixValue,
    targetUrl,
    active,
  });

  if (!success) {
    return next(new ErrorResponse('Error in server to add new GCP redirect entry', 500));
  }

  res.status(200).json({
    success,
    data: req.body,
  });
});

/*
 * * deleteGCPRedirect
 * * @desc   Retrieve all GCP entries link to the issuerGLN
 * * @route  GET /redirect/all
 * * @access Private
 * * @params required auth bearer token
 */
exports.deleteGCPRedirect = asynchHandler(async (req, res, next) => {
  const { authToken } = req;
  const { identificationKeyType, gcp } = req.params;
  if (!identificationKeyType || !gcp) {
    return next(new BadRequestParameter('Bad request parameters'));
  }

  const isValidUser = await checkAPIAuth(authToken);
  if (!isValidUser[0].success) {
    return next(new UnAuthRouteAccess('You are not authorize to access this endpoint'));
  }
  const issuerGLN = isValidUser[0].member_primary_gln;
  const idKeyType = utils.convertShortCodeToAINumeric(identificationKeyType);
  const deleteGCPResponse = await removeGCPRedirect({
    issuerGLN,
    identificationKeyType: idKeyType,
    gcp,
  });

  if (!deleteGCPResponse) {
    return next(new ErrorResponse('Error in server to delete GCP redirect entry', 500));
  }
  res.status(200).json({
    success: deleteGCPResponse[0].SUCCESS,
    data: { identificationKeyType, gcp },
  });
});
