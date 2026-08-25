import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db } from "../src/lib/db";

// Idempotent. Safe to re-run: upserts sectors, creates the seed admin only
// if missing. Never resets an existing admin's password on re-run.

const SECTORS = [
  { slug: "sector-one", name: "Sector One", displayOrder: 1 },
  { slug: "sector-two", name: "Sector Two", displayOrder: 2 },
  { slug: "sector-three", name: "Sector Three", displayOrder: 3 },
  { slug: "sector-four", name: "Sector Four", displayOrder: 4 },
  { slug: "sector-five", name: "Sector Five", displayOrder: 5 },
  { slug: "sector-six", name: "Sector Six", displayOrder: 6 },
  { slug: "sector-seven", name: "Sector Seven", displayOrder: 7 },
  { slug: "sector-eight", name: "Sector Eight", displayOrder: 8 },
];

async function seedSectors() {
  for (const sector of SECTORS) {
    await db.sector.upsert({
      where: { slug: sector.slug },
      update: { name: sector.name, displayOrder: sector.displayOrder },
      create: sector,
    });
  }
  console.log(`Seeded ${SECTORS.length} sectors.`);
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must both be set to seed the admin account."
    );
  }

  const user = await db.user.upsert({
    where: { email },
    update: { role: "ADMIN", isActive: true },
    create: {
      id: randomUUID(),
      name: "Admin",
      email,
      emailVerified: true,
      role: "ADMIN",
      isActive: true,
    },
  });

  // Better Auth stores email+password credentials as an Account row with
  // providerId "credential" and accountId set to the user's own id.
  const existingAccount = await db.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });

  if (existingAccount) {
    console.log(`Admin account already exists for ${email} — password left untouched.`);
    return;
  }

  const passwordHash = await hashPassword(password);

  await db.account.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: passwordHash,
    },
  });

  console.log(`Created admin account for ${email}.`);
}

async function main() {
  await seedSectors();
  await seedAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
