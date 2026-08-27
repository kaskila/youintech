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

// Five flagship, cross-sector programmes — announced, none delivered yet.
// status stays PLANNED and targetDate stays null until there's an actual
// date to publish; don't backfill either just to make a card look busier.
// Description is left null on purpose, same reasoning as Sector — content
// lands via the admin UI, not a commit.
//
// coverImage/coverAlt: real photos live in /public/programmes, one per
// slug — not Cloudinary yet (that wiring is a later build-order slice, see
// CLAUDE.md §9 item 9), just a local path in the same field Cloudinary will
// eventually populate. Alt text describes what's actually in each photo,
// not the programme name — the name is already the card title right next
// to it, so a name-echoing alt would just be noise for a screen reader.
const PROGRAMMES = [
  {
    slug: "digital-skills-bootcamps",
    title: "Digital Skills Bootcamps",
    summary:
      "A 2–4 week intensive, cross-sector training programme in data literacy, AI tools, and digital entrepreneurship.",
    icon: "Rocket",
    displayOrder: 1,
    coverImage: "/programmes/digital-skills-bootcamps.jpg",
    coverAlt:
      "Five young Zambians sit in a row at laptops in a bright training room, focused on their screens, with a large monitor displaying lines of code behind them.",
  },
  {
    slug: "builders-program",
    title: "Builders Program",
    summary:
      "Cross-sector teams build working technology solutions to real Zambian problems together.",
    icon: "Hammer",
    displayOrder: 2,
    coverImage: "/programmes/builders-program.jpg",
    coverAlt:
      "Four young Zambians gather around a laptop, one pointing at the screen while another takes notes in a notebook, with colourful sticky notes on a whiteboard behind them.",
  },
  {
    slug: "national-innovation-challenge",
    title: "National Innovation Challenge",
    summary:
      "Zambia's first cross-sector youth technology competition, open to every field.",
    icon: "Trophy",
    displayOrder: 3,
    coverImage: "/programmes/national-innovation-challenge.jpg",
    coverAlt:
      "A young presenter speaks into a microphone beside two teammates and a small model house fitted with a solar panel, presenting on stage in front of a large screen.",
  },
  {
    slug: "national-youth-technology-expo",
    title: "National Youth Technology Expo",
    summary:
      "A national showcase of how young Zambians use technology to solve everyday problems.",
    icon: "Presentation",
    displayOrder: 4,
    coverImage: "/programmes/national-youth-technology-expo.jpg",
    coverAlt:
      "Two young Zambians talk beside a drone displayed on an exhibition table, surrounded by banners and other attendees in a technology expo hall.",
  },
  {
    slug: "zambia-youth-in-technology-summit",
    title: "Zambia Youth In Technology Summit",
    summary: "National conversations about technology and the youth.",
    icon: "Megaphone",
    displayOrder: 5,
    coverImage: "/programmes/zambia-youth-in-technology-summit.jpg",
    coverAlt:
      "A packed auditorium audience faces a lit stage where a panel of six people sit before a large screen, viewed from behind the seated crowd.",
  },
];

async function seedProgrammes() {
  for (const programme of PROGRAMMES) {
    await db.programme.upsert({
      where: { slug: programme.slug },
      update: {
        title: programme.title,
        summary: programme.summary,
        icon: programme.icon,
        displayOrder: programme.displayOrder,
        coverImage: programme.coverImage,
        coverAlt: programme.coverAlt,
        status: "PLANNED",
        isFlagship: true,
        applicationsOpen: false,
        targetDate: null,
        contentStatus: "PUBLISHED",
      },
      create: {
        ...programme,
        status: "PLANNED",
        isFlagship: true,
        applicationsOpen: false,
        targetDate: null,
        contentStatus: "PUBLISHED",
      },
    });
  }

  // Same self-cleaning pattern as seedSectors — drop anything not in the
  // current list rather than leave stale rows behind on re-run.
  const { count } = await db.programme.deleteMany({
    where: { slug: { notIn: PROGRAMMES.map((programme) => programme.slug) } },
  });
  if (count > 0) {
    console.log(`Removed ${count} stale programme row(s) not in the current seed list.`);
  }

  console.log(`Seeded ${PROGRAMMES.length} programmes.`);
}

// Honest, current, verifiable-today figures only — no projections, no
// targets. No frontliner headcount yet: that's tracked by Application,
// which doesn't exist until a later build-order slice (CLAUDE.md §9 item 7).
// No natural unique key on ImpactStat, so this upserts by label itself
// rather than adding a DB constraint this task didn't ask for.
const IMPACT_STATS = [
  { label: "Focus sectors", value: "8", note: null, displayOrder: 1 },
  { label: "Registered NGO", value: "1", note: null, displayOrder: 2 },
  { label: "University chapter", value: "1", note: "UNZA, Lusaka", displayOrder: 3 },
];

async function seedImpactStats() {
  for (const stat of IMPACT_STATS) {
    const existing = await db.impactStat.findFirst({ where: { label: stat.label } });
    if (existing) {
      await db.impactStat.update({
        where: { id: existing.id },
        data: { value: stat.value, note: stat.note, displayOrder: stat.displayOrder },
      });
    } else {
      await db.impactStat.create({ data: stat });
    }
  }
  console.log(`Seeded ${IMPACT_STATS.length} impact stats.`);
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
  await seedProgrammes();
  await seedImpactStats();
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
