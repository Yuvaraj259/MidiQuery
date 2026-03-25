const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const {
  identifyByText,
  identifyByImage,
  identifyByBarcode,
  getSuggestions
} = require('../controllers/medicineController');

// ─── RATE LIMITING ───
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Stricter limit for image uploads
const imageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many image requests, please try again later.' }
});

// ─── FILE UPLOAD ───
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP and GIF allowed.'));
    }
  }
});

// ─── ROUTES ───

// POST /api/medicine/text
router.post('/text', apiLimiter, identifyByText);

// POST /api/medicine/image
router.post('/image', imageLimiter, upload.single('image'), identifyByImage);

// POST /api/medicine/barcode
router.post('/barcode', apiLimiter, identifyByBarcode);

// GET /api/medicine/suggestions
router.get('/suggestions', getSuggestions);

module.exports = router;
