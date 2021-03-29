/**
 * Processing of just the GTIN identifier
 * @type {e | (() => Express)}
 */
const express = require('express');
const processStartTime = require('../middleware/processStartTime');
const { identificationKeyController } = require('../controllers/processDigitalLinkController');

const router = express.Router();

router.route('/:identificationKey').get(processStartTime, identificationKeyController);
router.route('/:identificationKey/:lotnumber/:lotnumberkey').get(processStartTime, identificationKeyController);
router.route('/:identificationKey/:lotnumber/:lotnumberkey/:serialnumber/:serialnumbervalue').get(processStartTime, identificationKeyController);
router.route('/:identificationKey/:cpv/:cpvkey/:lotnumber/:lotnumberkey/:serialnumber/:serialnumbervalue').get(processStartTime, identificationKeyController);

module.exports = router;
