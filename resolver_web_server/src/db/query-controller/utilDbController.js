const express = require('express');

const dbConnection = require('../dbConnection');

const router = express.Router();

const checkDatabase = async (req, res) => {
  const mongoConn = await dbConnection();
  try {
    await mongoConn.db('admin').command({ ping: 1 });
    res.status(200).send('OK');
  } catch (err) {
    res.status(500).send('NOT OK');
  }
};

router.get('/', checkDatabase);

module.exports = router;