import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { createLocalAccountIssuer } from "@better-auth/core/db";
import { db } from "../src/lib/db";

// Idempotent. Safe to re-run: upserts sectors, creates the seed admin only
// if missing. Never resets an existing admin's password on re-run.

// Tagline and description are left null on purpose — content lands via the
// admin UI, not a commit. See CLAUDE.md §2 "Non-technical people must be
// able to publish." Icon names are lucide-react component names.
const SECTORS = [
  { slug: "agriculture", name: "Agriculture", icon: "Sprout", displayOrder: 1 },
  { slug: "healthcare", name: "Healthcare", icon: "HeartPulse", displayOrder: 2 },
  { slug: "education", name: "Education", icon: "GraduationCap", displayOrder: 3 },
  { slug: "business-finance", name: "Business & Finance", icon: "Briefcase", displayOrder: 4 },
  { slug: "law-governance", name: "Law & Governance", icon: "Scale", displayOrder: 5 },
  {
    slug: "engineering-environment",
    name: "Engineering & Environment",
    icon: "HardHat",
    displayOrder: 6,
  },
  { slug: "creative-industries", name: "Creative Industries", icon: "Palette", displayOrder: 7 },
  { slug: "ict-computer-science", name: "ICT & Computer Science", icon: "Cpu", displayOrder: 8 },
];

async function seedSectors() {
  for (const sector of SECTORS) {
    await db.sector.upsert({
      where: { slug: sector.slug },
      update: { name: sector.name, icon: sector.icon, displayOrder: sector.displayOrder },
      create: sector,
    });
  }

  // Drop anything left over from an earlier seed list (e.g. the original
  // "sector-one".."sector-eight" placeholders) so re-running never leaves
  // stale rows behind. Content relations (Post/Event) SetNull on delete;
  // nothing real is ever expected to point at a placeholder row.
  const { count } = await db.sector.deleteMany({
    where: { slug: { notIn: SECTORS.map((sector) => sector.slug) } },
  });
  if (count > 0) {
    console.log(`Removed ${count} stale sector row(s) not in the current seed list.`);
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
      issuer: createLocalAccountIssuer("credential"),
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
