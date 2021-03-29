const express = require('express');

const router = express.Router();

const processStartTime = require('../middleware/processStartTime');
const { heartBeatController } = require('../controllers/heartBeatController');

router.route('/').get(processStartTime, heartBeatController);
module.exports = router;
