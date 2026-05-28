// backend/server.js
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const crypto = require('crypto');
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

app.post('/api/cloudinary/delete', async (req, res) => {
  try {
    const { publicId, resourceType = 'image', invalidate = true } = req.body || {};
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({ error: 'Cloudinary delete credentials are not configured.' });
    }
    if (!publicId) {
      return res.status(400).json({ error: 'publicId is required.' });
    }
    if (!['image', 'video', 'raw'].includes(resourceType)) {
      return res.status(400).json({ error: 'Invalid resourceType.' });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const invalidateValue = invalidate ? 'true' : 'false';
    const signature = crypto
      .createHash('sha1')
      .update(`invalidate=${invalidateValue}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const form = new URLSearchParams();
    form.append('public_id', publicId);
    form.append('invalidate', invalidateValue);
    form.append('api_key', apiKey);
    form.append('timestamp', String(timestamp));
    form.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      },
    );

    const payload = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(payload);
    }

    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Proxy server running on port 3000'));
