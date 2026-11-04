import http from 'http';
import app from './app';
import { env } from './config/env';
import prisma from './lib/prisma';

const server = http.createServer(app);

// Socket.IO will be attached here in the real-time implementation phase:
// import { setupSocketIO } from './sockets';
// setupSocketIO(server);

async function main() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.info(`✓ Database connected`);

    server.listen(env.SERVER_PORT, () => {
      console.info(`✓ Server running on http://localhost:${env.SERVER_PORT}`);
      console.info(`  Environment: ${env.NODE_ENV}`);
      console.info(`  Health check: http://localhost:${env.SERVER_PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
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
