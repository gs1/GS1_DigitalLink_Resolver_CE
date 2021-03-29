const express = require('express');
const path = require('path');

const { fetchDashboardData } = require('./fetchDashboardData');

const router = express.Router();

router
  .get('/', async (req, res) => {
    res.sendFile(path.resolve('public/responses', 'dashboard.html'));
  })
  .get('/data', fetchDashboardData);

module.exports = router;
