const express = require('express');
const { getGCPDate, getAllGCPRedirect, getSingleGCPRedirect, addNewGCPRedirect, deleteGCPRedirect } = require('../controllers/gcpRedirects');
const { checkAuthHeaderInclude } = require('../middleware/auth');

const router = express.Router();

router.route('/').get(getGCPDate).post(checkAuthHeaderInclude, addNewGCPRedirect);

router.route('/all').get(checkAuthHeaderInclude, getAllGCPRedirect);
router.route('/:identificationKeyType/:gcp').get(checkAuthHeaderInclude, getSingleGCPRedirect).delete(checkAuthHeaderInclude, deleteGCPRedirect);

module.exports = router;
