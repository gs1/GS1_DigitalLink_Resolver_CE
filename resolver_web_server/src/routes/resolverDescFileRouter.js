const express = require('express');

const router = express.Router();

const processStartTime = require('../middleware/processStartTime');
const { resolverDescFileController } = require('../controllers/resolverDescFileController');

router.route('/').get(processStartTime, resolverDescFileController);
module.exports = router;
