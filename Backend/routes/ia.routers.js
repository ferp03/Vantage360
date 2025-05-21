const express = require('express');
const router = express.Router();
require('dotenv').config();

router.get('/gemini-api-key', (req, res) => {
  res.json({ apiKey: process.env.GEMINI_API_KEY });
});

module.exports = router;