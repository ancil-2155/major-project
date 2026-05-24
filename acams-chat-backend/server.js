// backend/server.js
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
app.use(express.json());

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
    });
    res.json({ response: result.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Proxy server running on port 3000'));
