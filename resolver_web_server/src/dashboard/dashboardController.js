const express = require('express');
const path = require('path');

const { fetchDashboardData } = require('./fetchDashboardData');

const router = express.Router();

const checkAuth = (req, res, next) => {
  let token = null;
  const { authorization } = req.headers;
  if (authorization && authorization.startsWith('Bearer')) {
    [, token] = authorization.split(' ');
  }
  if (!token || token !== '3ba46e19-a79c-41e0-a30b-d8008bf72de2') {
    res.status(401).json({ status: 'Not authorized', code: 401 });
  } else {
    next();
  }
};

router
  .get('/', async (req, res) => {
    res.sendFile(path.resolve('public/responses', 'dashboard.html'));
  })
  .get('/data', checkAuth, fetchDashboardData);

module.exports = router;
