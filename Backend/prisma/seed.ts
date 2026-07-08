import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seeds (or updates) the platform admin account.
 *
 * Public sign-up is disabled, so this is the only way to create an admin on a
 * fresh database. Configure these env vars (e.g. in Backend/.env) before running
 * `npm run seed`:
 *   ADMIN_EMAIL=you@example.com
 *   ADMIN_PASSWORD=a-strong-password
 *   ADMIN_NAME=Your Name        (optional)
 */
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME?.trim() || 'Musicarth Admin';

  if (!email || !password) {
    throw new Error(
      'Missing ADMIN_EMAIL and/or ADMIN_PASSWORD. Set them in your environment before seeding.',
    );
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: UserRole.ADMIN, passwordHash, fullName, deletedAt: null },
    create: { email, fullName, role: UserRole.ADMIN, passwordHash },
  });

  console.log(`✓ Admin account ready: ${admin.email} (role: ${admin.role})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error('Seed failed:', error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
