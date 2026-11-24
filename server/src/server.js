const http = require('http');
const bcrypt = require('bcryptjs');
const app = require('./app');
const { env } = require('./config/env');
const prisma = require('./lib/prisma');
const { setupSocketIO } = require('./sockets');

const server = http.createServer(app);
setupSocketIO(server);

async function ensureDefaultAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'rkrevanth07@gmail.com';
    const rawPassword = process.env.ADMIN_PASSWORD || 'TestPass@123';
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: adminEmail }, { role: 'MESS_ADMIN' }],
      },
    });

    if (!existing) {
      const passwordHash = await bcrypt.hash(rawPassword, 12);
      await prisma.user.create({
        data: {
          name: 'Revanth (Admin)',
          email: adminEmail,
          passwordHash,
          role: 'MESS_ADMIN',
          isActive: true,
        },
      });
      console.info(`✓ Default admin account provisioned (${adminEmail})`);
    } else {
      console.info(`✓ Admin account exists (${existing.email})`);
    }
  } catch (err) {
    console.warn(`⚠️ Could not auto-provision admin: ${err.message}`);
  }
}

async function main() {
  // Connect to the database BEFORE accepting traffic so the first request
  // never hits a cold Prisma connection pool.
  try {
    await prisma.$connect();
    console.info(`✓ Database connected`);
    await ensureDefaultAdmin();
  } catch (error) {
    console.warn(`⚠️  Database connection warning: ${error.message}`);
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
