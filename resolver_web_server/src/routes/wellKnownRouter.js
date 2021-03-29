const express = require('express');

const { wellKnownController } = require('../controllers/wellKnownController');
const processStartTime = require('../middleware/processStartTime');

const router = express.Router();

router.route('/gs1resolver').get(processStartTime, wellKnownController);

module.exports = router;
