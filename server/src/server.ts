import http from 'http';
import app from './app';
import { env } from './config/env';
import prisma from './lib/prisma';

import { setupSocketIO } from './sockets';

const server = http.createServer(app);
setupSocketIO(server);

async function main() {
  // Connect to the database BEFORE accepting traffic so the first request
  // never hits a cold Prisma connection pool.
  try {
    await prisma.$connect();
    console.info(`✓ Database connected`);
  } catch (error) {
    console.warn(`⚠️  Database connection warning: ${(error as Error).message}`);
    console.warn(`   Ensure PostgreSQL is running and check DATABASE_URL in .env`);
    // Continue startup — Prisma will retry individual queries lazily
  }

  server.listen(env.SERVER_PORT, () => {
    console.info(`✓ Server running on http://localhost:${env.SERVER_PORT}`);
    console.info(`  Environment: ${env.NODE_ENV}`);
    console.info(`  Health check: http://localhost:${env.SERVER_PORT}/api/health`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.info('SIGTERM received. Shutting down...');
  server.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.info('SIGINT received. Shutting down...');
  server.close();
  await prisma.$disconnect();
  process.exit(0);
});

main();
