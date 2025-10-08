// server/app.js
require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const goatsRouter = require('./routes/goatRoutes');

const app = express();

// ---- Security & Parsing
const ORIGIN = process.env.CORS_ORIGIN || '*';

// Configure Helmet with an explicit CSP that allows your CDNs
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'",
        "https://code.jquery.com",
        "https://cdn.jsdelivr.net"
      ],
      "style-src": [
        "'self'",
        // allow inline styles used by Bootstrap components
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
      ],
      "img-src": ["'self'", "data:", "blob:"],
      "font-src": ["'self'", "data:", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      // allow the browser to fetch source maps and other XHRs from CDNs
      "connect-src": [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://code.jquery.com",
        "https://cdnjs.cloudflare.com"
      ],
      "frame-ancestors": ["'self'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"]
    }
  },
  // keep other Helmet protections
}));

app.use(cors({ origin: ORIGIN }));
app.use(express.json({ limit: '2mb' }));

// ---- API routes
const apiLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false });
app.use('/api', apiLimiter);
app.use('/api/goats', goatsRouter);

// ---- Static SPA
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get(/.*/, (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));

// ---- Errors
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
