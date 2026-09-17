const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const IMAGE_NAME = 'login-image.png';
const IMAGE_PATH = path.join(PUBLIC_DIR, IMAGE_NAME);

// Allow CRs and admins to manage the login image
router.use(authenticate, requireRole('cr', 'admin'));

// GET current image URL (if exists)
router.get('/login-image', (req, res) => {
  if (fs.existsSync(IMAGE_PATH)) {
    return res.json({ url: `/public/${IMAGE_NAME}` });
  }
  return res.json({ url: null });
});

// POST a base64 image payload { image_base64 }
router.post('/login-image', (req, res) => {
  const img = typeof req.body.image_base64 === 'string' ? req.body.image_base64 : '';
  if (!img) return res.status(400).json({ error: 'Missing image_base64 in request body' });

  const match = img.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) return res.status(400).json({ error: 'Invalid image data' });

  const b64 = match[2];
  const buffer = Buffer.from(b64, 'base64');

  try {
    if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    fs.writeFileSync(IMAGE_PATH, buffer);
    return res.status(201).json({ url: `/public/${IMAGE_NAME}` });
  } catch (err) {
    console.error('Failed to save login image', err);
    return res.status(500).json({ error: 'Failed to save image' });
  }
});

module.exports = router;
