import express from 'express';
const router = express.Router();
import dotenv from 'dotenv';
dotenv.config();

router.get('/gemini-api-key', (req, res) => {
  res.json({ apiKey: process.env.GEMINI_API_KEY });
});

export default router;