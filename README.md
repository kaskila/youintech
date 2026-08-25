This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Local setup

Prerequisites: Node.js and npm, and PostgreSQL 17 installed and running
locally. Local dev always uses local Postgres — Neon is production only (see
`CLAUDE.md` §3).

1. Create a local role and database. Run as a Postgres superuser, e.g. via
   `psql -U postgres`:

   ```sql
   CREATE ROLE youintech WITH LOGIN CREATEDB PASSWORD 'choose-a-password';
   CREATE DATABASE youintech_db OWNER youintech;
   ```

   `CREATEDB` is required even though the database already exists —
   `prisma migrate dev` creates and drops a throwaway shadow database on
   every run to detect drift, so the role needs permission to create one.

2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` / `DIRECT_URL` — both point at the database you just
     created, e.g. `postgresql://youintech:choose-a-password@localhost:5432/youintech_db`.
     There's no connection pooler locally, so the two vars are identical in
     dev (they differ only in production, against Neon).
   - `BETTER_AUTH_SECRET` — generate one with `openssl rand -base64 32`.
   - `BETTER_AUTH_URL` — `http://localhost:3000` for local dev.
   - `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — credentials for the one
     seeded admin account (see `prisma/seed.ts`).

3. Install dependencies, then run migrations and seed the database:

   ```bash
   npm install
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

4. Start the dev server (see below).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
