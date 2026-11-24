/**
 * Development seed script.
 *
 * Creates (or idempotently updates) a single test/dev user account.
 * This script is ONLY intended for the development environment.
 * It will NOT run if NODE_ENV is "production".
 *
 * Usage:
 *   npm run db:seed          (from project root)
 *   npm run db:seed          (from server/)
 */

const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient, Role } = require('@prisma/client');

// Load .env from project root (same pattern as env.js)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

// ─── Guard: refuse to run in production ───────────────────────────────────────
const nodeEnv = process.env.NODE_ENV ?? 'development';
if (nodeEnv === 'production') {
  console.error('🚫  Seed script must not run in production. Aborting.');
  process.exit(1);
}

// ─── Admin account configuration ──────────────────────────────────────────────

const ADMIN_EMAIL = 'rkrevanth07@gmail.com';
const LEGACY_ADMIN_EMAIL = 'rkrevaanth07@gmail.com';
const ADMIN_NAME = 'Revanth (Admin)';

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.info('🌱  Running development seed...');
  console.info(`   Environment : ${nodeEnv}`);
  console.info(`   Target email: ${ADMIN_EMAIL}`);

  const rawPassword = process.env.ADMIN_PASSWORD || 'TestPass@123';
  const passwordHash = await bcrypt.hash(rawPassword, 12);

  // Check if admin account already exists under primary or legacy email
  let existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ email: ADMIN_EMAIL }, { email: LEGACY_ADMIN_EMAIL }],
    },
  });

  if (existingAdmin) {
    // Ensure email is set to rkrevanth07@gmail.com, role is MESS_ADMIN, and password is set to TestPass@123
    const updated = await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        email: ADMIN_EMAIL,
        name: existingAdmin.name || ADMIN_NAME,
        passwordHash,
        role: Role.MESS_ADMIN,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    console.info('✅  Admin account updated successfully:');
    console.table({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      isActive: updated.isActive,
    });
  } else {
    const created = await prisma.user.create({
      data: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash,
        role: Role.MESS_ADMIN,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    console.info('✅  New admin account provisioned successfully:');
    console.table({
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
      isActive: created.isActive,
    });
  }
}

main()
  .catch((e) => {
    console.error('❌  Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
