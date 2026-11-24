const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { corsOptions } = require('./config/cors');
const { APP_CONSTANTS } = require('./config/constants');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler.middleware');

const app = express();

// ── Global Middleware ─────────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── API Routes ────────────────────────────────────────────────
app.use(APP_CONSTANTS.API_PREFIX, routes);

// ── Global Error Handler (must be last) ───────────────────────
app.use(errorHandler);

module.exports = app;
module.exports.default = app;
