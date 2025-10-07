// server/app.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const goatsRouter = require('./routes/goatRoutes');

const app = express();

// ---- security & parsing
const ORIGIN = process.env.CORS_ORIGIN || '*';
app.use(helmet());
app.use(cors({ origin: ORIGIN }));
app.use(express.json({ limit: '1mb' }));

// ---- api routes
app.use('/api', rateLimit({ windowMs: 60_000, max: 120 }));
app.use('/api/goats', goatsRouter);

// ---- static SPA
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ---- errors
//app.use(require('./middleware/errorHandler'));

module.exports = app;