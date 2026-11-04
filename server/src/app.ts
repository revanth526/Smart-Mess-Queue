import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors';
import { APP_CONSTANTS } from './config/constants';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler.middleware';

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

export default app;
