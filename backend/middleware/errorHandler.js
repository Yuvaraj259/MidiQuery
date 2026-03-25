// ─── GLOBAL ERROR HANDLER ───
const globalErrorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.message);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
  }

  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(415).json({ error: err.message });
  }

  // Anthropic API errors
  if (err.status === 401 || err.message?.includes('API key')) {
    return res.status(500).json({
      error: 'API configuration error. Please check your ANTHROPIC_API_KEY.',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  if (err.status === 429 || err.message?.includes('rate limit')) {
    return res.status(429).json({ error: 'AI service rate limit reached. Please wait a moment and try again.' });
  }

  // JSON parse errors
  if (err instanceof SyntaxError) {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS: origin not allowed.' });
  }

  // Generic server error
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error. Please try again.'
    : err.message || 'Internal server error';

  res.status(statusCode).json({ error: message });
};

// ─── NOT FOUND HANDLER ───
const notFoundHandler = (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
};

module.exports = { globalErrorHandler, notFoundHandler };
