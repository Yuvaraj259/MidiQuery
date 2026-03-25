require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const medicineRoutes = require('./routes/medicine');
const { globalErrorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── SECURITY ───
app.use(helmet({
  contentSecurityPolicy: false, // disabled so frontend assets load cleanly
  crossOriginEmbedderPolicy: false
}));

// ─── CORS ───
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5001',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5001',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: true, // Echoes the origin of the request, allowing anything
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ─── LOGGING ───
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── BODY PARSING ───
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ─── STATIC FRONTEND ───
// Serve frontend from /frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── API ROUTES ───
app.use('/api/medicine', medicineRoutes);

// ─── HEALTH CHECK ───
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'MediCheck API'
  });
});

// ─── SPA FALLBACK ───
// For any non-API route, serve frontend index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ─── ERROR HANDLER ───
app.use(globalErrorHandler);

// ─── START ───
app.listen(PORT, () => {
  console.log(`\n🚀 MediCheck server running on http://localhost:${PORT}`);
  console.log(`📦 API:      http://localhost:${PORT}/api/medicine`);
  console.log(`❤️  Health:   http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`\n📋 ENV: ${process.env.NODE_ENV || 'development'}`);
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.warn('\n⚠️  WARNING: GEMINI_API_KEY not set! Update your .env file with a Gemini key.\n');
  }
});

module.exports = app;
