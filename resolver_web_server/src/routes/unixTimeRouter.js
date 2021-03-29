const express = require('express');

const processStartTime = require('../middleware/processStartTime');
const { unixTimeCountController, unixTimePageController } = require('../controllers/unixTimeController');

const router = express.Router();

router.route('/:unixtime/count').get(processStartTime, unixTimeCountController);
router.route('/:unixtime/page/:pagenumber/limit/:limit').get(processStartTime, unixTimePageController);

module.exports = router;
