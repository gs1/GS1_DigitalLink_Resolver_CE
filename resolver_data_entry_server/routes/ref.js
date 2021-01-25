const express = require('express');

const router = express.Router();

/**
 * Returns the list of linktypes allowed by this service
 */
router.get('/linktypes', async (req, res) => {
  res.send(global.linkTypesArray);
});

/**
 * Returns the list of IANA languages allowed by this service
 */
router.get('/languages', async (req, res) => {
  res.send(global.iana_language_array);
});

/**
 * (Alias) Returns the list of IANA languages allowed by this service
 */
router.get('/iana_languages', async (req, res) => {
  res.send(global.iana_language_array);
});

/**
 * Returns the list of Media (MIME) types allowed by this service
 */

router.get('/mediatypes', async (req, res) => {
  res.send(global.media_types_array);
});

/**
 * (Alias) Returns the list of Media (MIME) types allowed by this service
 */
router.get('/mime_types', async (req, res) => {
  res.send(global.media_types_array);
});

module.exports = router;
