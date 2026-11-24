const { env } = require('./env');

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, '');
    const cleanClientUrl = env.CLIENT_URL ? env.CLIENT_URL.replace(/\/$/, '') : '';

    // Allow configured CLIENT_URL, any vercel deployment, or localhost
    if (
      cleanOrigin === cleanClientUrl ||
      cleanOrigin.endsWith('.vercel.app') ||
      cleanOrigin.includes('localhost')
    ) {
      return callback(null, true);
    }

    // Permissive fallback so CORS never blocks valid frontends
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = {
  corsOptions,
};

