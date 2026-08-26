# CLAUDE.md — YouthInTech Platform

Authoritative context for this repository. Read this before proposing changes.
If a request conflicts with this file, say so and ask before proceeding.

This is the only instruction file. `AGENTS.md` is deliberately untracked and
gitignored — `next dev` regenerates it with Next.js's own breaking-changes notice,
content this repo doesn't control, so it can't reliably hold anything of ours.

---

## 1. What this is

The public web platform for **YouthInTech (Zambia Youths in Technology Network)**, a
registered NGO headquartered at UNZA, Lusaka. Mantra: *"Technology is for everyone —
especially YOUth."*

The site serves **three audiences, in this priority order**:

1. **Partners & funders** — need proof the organization is real, active, and governed.
2. **The public / press** — need current content, events, and programme information.
3. **Prospective Frontliners** (volunteers) — need a clear, low-friction way to apply.

Everything in this repo exists to serve one of those three. If a proposed feature
doesn't, it does not belong in v1.

---

## 2. Non-negotiable constraints

These are product decisions, already made. Do not relitigate them in code.

- **One maintainer.** Every dependency, abstraction, and service is a maintenance tax
  paid by one person who also has a full-time job. Prefer boring and obvious.
- **Non-technical people must be able to publish.** Posts and events are created through
  an admin UI, never through a git commit. This is the highest-priority constraint in
  the entire project.
- **Zambian network conditions.** Assume 3G, expensive data, mid-range Android. Ship
  small pages. Optimise images aggressively. No heavy client-side JS on public pages.
- **No member dashboard in v1.** Frontliners submit a form. They do not get accounts.
- **No partner portal in v1.** Credibility is design and content, not a login.

---

## 3. Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) | Server Components by default |
| Language | TypeScript, `strict: true` | No `any`. No `@ts-ignore` without a comment explaining why |
| Styling | Tailwind CSS v4 | CSS-first config via `@theme` in `app/globals.css`. No `tailwind.config.js` |
| Database | PostgreSQL | Local dev uses a native local Postgres 17 instance — no Docker. Production uses Neon. Neon is never used for local development (this has been tried; a corporate DNS suffix plus a dead IPv6 route make Neon unreachable from at least one contributor's machine). See `README.md` "Local setup" |
| ORM | Prisma (v7) | Migrations committed. Never `db push` against production. Connection strings live in `prisma.config.ts` / `src/lib/db.ts`, never in `schema.prisma`'s `datasource` block — v7 deprecated `url`/`directUrl` there. CLI (migrations) uses `DIRECT_URL`; runtime client uses `DATABASE_URL` via `@prisma/adapter-pg`. In production these are the unpooled/pooled Neon hosts respectively; locally, with no pooler, both point at the same local database |
| Auth | Better Auth | Admin/editor only. Public pages are unauthenticated |
| Media | Cloudinary | Signed uploads from the admin UI. Never expose the API secret client-side |
| Email | Resend | Transactional only — application confirmations, admin notifications |
| Validation | Zod | One schema per form, shared between client and server action |
| Hosting | Vercel | |

**The Vercel build command is `prisma migrate deploy && next build`** (see
`package.json` `"build"`), not just `next build`. Committed there, not set as a Vercel
dashboard override — the two steps must run in this exact order every time, and that
shouldn't depend on someone remembering to configure a project setting correctly.

- **Always `migrate deploy`, never `migrate dev`, against production.** `migrate dev`
  diffs the schema against a shadow database it creates and drops on every run (see
  README "Local setup" for why the local role needs `CREATEDB`) — the production Neon
  role deliberately does **not** have `CREATEDB`, which makes running `migrate dev`
  against it fail outright rather than silently. `migrate deploy` only applies
  already-committed migration files in order: no diffing, no shadow database, safe to
  run unattended.
- **Migrations must complete before `next build` runs, not after.** `/our-sectors/[slug]`
  and `/programmes/[slug]` use `generateStaticParams`, which queries the live database
  during the build's "Collecting page data" phase — confirmed by deliberately building
  against an unreachable database and watching it fail there, not gracefully. A build
  against an unmigrated database fails the same way. The `&&` chain is what guarantees
  the database is ready before that query runs.
- **`DATABASE_URL` / `DIRECT_URL` are set in Vercel for the Production environment
  only, never Preview.** There is one database. If Preview had them too, a build
  triggered from a branch would run `migrate deploy` against production before that
  branch is even merged. Preview builds are expected to fail at the same
  `generateStaticParams` step above until a separate database exists for them —
  that's the correct failure, not a bug to work around.

**Do not add** a state management library, a component library, an ORM alternative, a
headless CMS, or an analytics SDK without explicit approval. React state and URL state
are sufficient for everything in v1.

**Better Auth's expected table/column shape must be verified against the installed
source** — `node_modules/@better-auth/core/src/db/schema/*.ts` — never against docs or
recall. Docs lag; training data is stale by definition. `Account.issuer` was missing
from `schema.prisma` for exactly this reason: nothing surfaced it until a real sign-in
failed with a generic "Invalid email or password", because Better Auth matches
`providerId` + `issuer` + `accountId` together before it ever compares a password. When
a schema mismatch is suspected, read the zod schema in that package directly.

`@better-auth/core` is a **direct** dependency, not just a transitive one via
`better-auth` — `prisma/seed.ts` imports `createLocalAccountIssuer` from it. Pin it to
an exact version, no `^`. It's Better Auth's internal package, not a stable public API
(see their own GitHub issue #4900), and a minor bump could change behavior silently
underneath us.

---

## 4. Architecture

```
app/
  (public)/              # Unauthenticated. Static or ISR wherever possible.
    page.tsx             # Home
    about/               # Story, team, governance docs
    our-sectors/         # The eight permanent focus areas (Sector model).
                          # NOT "programmes" — see §5, Programme is a
                          # separate, time-bound model.
    programmes/          # Flagship cross-sector initiatives (Programme
                          # model). No sector relation — see §5.
    events/              # List + [slug] detail
    news/                # List + [slug] detail
    partners/            # Logos, partnership case, contact CTA
    join/                # Frontliner application form
    contact/
  (admin)/admin/
    login/               # Unauthenticated — the sign-in page itself.
    (protected)/         # Route group, not a URL segment. /admin/sectors is
                          # still /admin/sectors. Everything in here requires
                          # a session — see the layout rule below.
      layout.tsx
      sectors/
      programmes/        # Create/edit open to EDITOR; archive is ADMIN-only.
      posts/
      events/
      applications/      # Review queue for Frontliner applications
      partners/
      media/
  api/                   # Only for webhooks and Cloudinary signing. Prefer Server Actions.
lib/
  db.ts                  # Prisma singleton
  auth.ts                # Better Auth config
  session.ts             # getSessionUser() — cookie-cache read, for display only
  require-admin.ts       # requireAdmin() — fresh DB read, for authorization
  cloudinary.ts
  email/                 # Resend templates + send functions
  validations/           # Zod schemas, one file per domain
components/
  ui/                    # Primitives — button, input, card. Hand-rolled, not a library.
  public/                # Public-page components
  admin/                 # Admin-only components
prisma/
  schema.prisma
```

**Rules:**

- Server Components are the default. Add `"use client"` only for genuine interactivity,
  and push it as far down the tree as possible.
- Mutations use **Server Actions**, not API routes. API routes are for webhooks only.
- Every Server Action must: validate input with Zod → check auth/role → mutate →
  `revalidatePath` → return a typed result. No exceptions.
- Public pages use ISR (`revalidate`) rather than dynamic rendering. Content changes
  rarely; revalidate on publish from the admin action.
- Never import Prisma into a Client Component.
- Protected admin routes live under `(admin)/admin/(protected)/`, not directly under
  `admin/`. A layout on `admin/` itself would also wrap `admin/login/` — an
  unauthenticated visitor to the login page would be redirected to the login page,
  forever. The route group exists purely to scope the auth-checking layout away from
  the one admin route that must stay reachable without a session.
- Two different session reads, for two different purposes — do not use one for the
  other. `session.ts` (`getSessionUser`) reads the session cookie: cheap, cache-backed,
  fine for display (nav, "signed in as") and for redirect-if-signed-out in Server
  Components. `require-admin.ts` (`requireAdmin`) is what every mutating Server Action
  calls: it re-reads `role`/`isActive` from the database, not the session, because the
  session cookie is cached for up to 60s (see `auth.ts`) — a just-deactivated user would
  otherwise go on acting with stale claims for up to a minute.

---

## 5. Data model (v1)

Keep it this small. Adding a model requires justification.

- **User** — admin/editor accounts only. `role: ADMIN | EDITOR`.
- **Post** — news and articles. `slug`, `title`, `excerpt`, `body`, `coverImage`,
  `status: DRAFT | PUBLISHED`, `publishedAt`, `authorId`.
- **Event** — `slug`, `title`, `description`, `startsAt`, `endsAt`, `venue`, `isOnline`,
  `registrationUrl`, `coverImage`, `status`. Past events are **not** deleted — they are
  the credibility evidence.
- **Sector** — the eight permanent focus areas (Agriculture, Healthcare, etc). `slug`,
  `name`, `tagline`, `description`, `icon`, `displayOrder`, `isActive`. Mostly static,
  but editable. Public route: `/our-sectors`.
- **Programme** — flagship, cross-sector initiatives. `slug`, `title`, `summary`,
  `description` (markdown, rendered as plain text until a renderer is added), `icon`,
  `status: PLANNED | UPCOMING | RUNNING | COMPLETED`, `isFlagship`, `applicationsOpen`,
  `applicationUrl` (external — no in-house application flow), `targetDate` (nullable —
  NULL means nothing is scheduled), `displayOrder`, `contentStatus`. Public route:
  `/programmes`. Deliberately **no** `Sector` relation — every programme is
  cross-sector by design; don't add one to "make filtering easier." `EDITOR` can
  create/edit; archiving (`contentStatus → ARCHIVED`) is `ADMIN`-only, same soft-delete
  rule as everything else in this table.

  **Not the same thing as `Sector`.** Sectors are permanent; Programmes are time-bound
  and can be applied to. Don't conflate the two models or their routes.
- **Application** — Frontliner submissions. `fullName`, `email`, `phone`, `institution`,
  `sectorInterest`, `skills`, `motivation`, `status: NEW | REVIEWING | ACCEPTED |
  DECLINED`, `submittedAt`, `reviewNotes`.
- **Inquiry** — public `/contact` submissions. `category: VOLUNTEER | PARTNER | SUPPORT |
  GENERAL`, `name`, `email`, `phone`, `organisation`, `message`,
  `status: NEW | REVIEWING | RESPONDED | CLOSED`, `createdAt`. Same consent/retention
  pattern as `Application` — personal data, `EDITOR` can't see it either.
- **Partner** — `name`, `logo`, `url`, `tier`, `displayOrder`.
- **ImpactStat** — editable headline numbers for the homepage (`label`, `value`,
  `displayOrder`). Funders read these first. They must never be hardcoded in JSX.

Rules: every user-facing record has a `slug`. Soft-delete via `status`, never hard
delete published content. All timestamps stored UTC, rendered in Africa/Lusaka.

---

## 6. Conventions

- Files: `kebab-case.tsx`. Components: `PascalCase`. Functions/vars: `camelCase`.
- Server Actions live in `actions.ts` colocated with the route that uses them.
- No barrel (`index.ts`) re-export files. They break tree-shaking and hide dependencies.
- Errors: return `{ ok: false, error: string }` from actions. Never throw to the client.
  Log the real error server-side.
- Loading and empty states are required, not optional. Every list renders something
  sensible when it has zero rows.
- Accessibility is not a phase-two task: semantic HTML, labelled inputs, visible focus
  rings, alt text on every image, colour contrast ≥ 4.5:1.

---

## 7. Definition of done

A feature is not done until all of these are true:

1. Works on a 375px viewport.
2. Loading, empty, and error states exist.
3. All inputs validated server-side with Zod (client validation is a courtesy, not a
   control).
4. Auth and role checked inside the Server Action itself, not only in middleware.
5. No secrets, keys, or connection strings in client bundles.
6. `npx tsc --noEmit` and `next build` both pass clean.

---

## 8. Explicit non-goals for v1

Do not build these. Do not scaffold "for later." Do not add schema fields for them.

- Member accounts, profiles, or directories
- Forums, chat, comments, or messaging
- Donations or payments
- Multi-language / i18n
- Gamification, badges, points
- Mobile app or PWA offline mode
- The TechTok platform (separate scope, later phase)
- **Opportunities/jobs board — DEFERRED, not cancelled.** A curated feed left stale is
  worse than no feed at all; this needs a maintainer who isn't me before it starts.
  Revisit if that changes.

---

## 9. Build order

Vertical slices, not horizontal layers: each item below is admin CRUD (where it
applies) plus the public page that reads it, shipped together.

1. **Public layout** — header, footer, nav, design tokens applied site-wide. No content
   yet.
2. **Sectors page** — the public `/our-sectors` page, reading the `Sector` rows the admin
   CRUD (already built) manages.
3. **Deploy.** — the full loop, admin auth → admin CRUD → public read, proven in
   production before adding another content type.
4. **Stories** — `Post` admin CRUD + public `/news` list and `[slug]` detail.
5. **Events** — `Event` admin CRUD + public `/events` list and `[slug]` detail.
6. **Inquiries** — public `/contact` form + Resend notification.
7. **Applications** — Frontliner application form, Zod validation, Resend confirmation,
   admin review queue.
8. **Home/credibility** — home page, `ImpactStat`, `Partner` logos, downloadable
   governance documents.
9. **Cloudinary** — signed uploads wired into Post/Event/Partner media fields. Deferred
   until here on purpose — everything before it ships without images rather than wait.
10. **Playwright smoke tests** — golden-path coverage across public + admin before
    calling v1 done.

Each slice deploys to production before the next begins. No long-lived branches.

---

## 10. How to work with me on this

- Propose the approach before writing more than ~50 lines of code.
- When something in this file is wrong or has become wrong, say so and propose an edit
  to this file. Don't silently work around it.
- Prefer deleting code to adding configuration.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
