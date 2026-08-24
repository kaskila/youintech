# CLAUDE.md — YouthInTech Platform

Authoritative context for this repository. Read this before proposing changes.
If a request conflicts with this file, say so and ask before proceeding.

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
| Database | PostgreSQL (Neon) | |
| ORM | Prisma | Migrations committed. Never `db push` against production |
| Auth | Better Auth | Admin/editor only. Public pages are unauthenticated |
| Media | Cloudinary | Signed uploads from the admin UI. Never expose the API secret client-side |
| Email | Resend | Transactional only — application confirmations, admin notifications |
| Validation | Zod | One schema per form, shared between client and server action |
| Hosting | Vercel | |

**Do not add** a state management library, a component library, an ORM alternative, a
headless CMS, or an analytics SDK without explicit approval. React state and URL state
are sufficient for everything in v1.

---

## 4. Architecture

```
app/
  (public)/              # Unauthenticated. Static or ISR wherever possible.
    page.tsx             # Home
    about/               # Story, team, governance docs
    programmes/          # The eight sectors + programme tracks
    events/              # List + [slug] detail
    news/                # List + [slug] detail
    partners/            # Logos, partnership case, contact CTA
    join/                # Frontliner application form
    contact/
  (admin)/admin/         # Better Auth protected. Role-gated.
    posts/
    events/
    applications/        # Review queue for Frontliner applications
    partners/
    media/
  api/                   # Only for webhooks and Cloudinary signing. Prefer Server Actions.
lib/
  db.ts                  # Prisma singleton
  auth.ts                # Better Auth config
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

---

## 5. Data model (v1)

Keep it this small. Adding a model requires justification.

- **User** — admin/editor accounts only. `role: ADMIN | EDITOR`.
- **Post** — news and articles. `slug`, `title`, `excerpt`, `body`, `coverImage`,
  `status: DRAFT | PUBLISHED`, `publishedAt`, `authorId`.
- **Event** — `slug`, `title`, `description`, `startsAt`, `endsAt`, `venue`, `isOnline`,
  `registrationUrl`, `coverImage`, `status`. Past events are **not** deleted — they are
  the credibility evidence.
- **Programme** — the sector/track definitions. Mostly static, but editable.
- **Application** — Frontliner submissions. `fullName`, `email`, `phone`, `institution`,
  `sectorInterest`, `skills`, `motivation`, `status: NEW | REVIEWING | ACCEPTED |
  DECLINED`, `submittedAt`, `reviewNotes`.
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

---

## 9. Build order

1. **Foundation** — Next.js + TS + Tailwind v4 tokens, Prisma schema, Neon connection,
   Better Auth with a seeded admin user.
2. **Admin shell** — login, protected layout, role guard.
3. **Content engine** — Post and Event CRUD in admin, Cloudinary upload, publish flow.
4. **Public site** — home, about, programmes, events, news. Real content, real design.
5. **Applications** — public form, Zod validation, Resend confirmation, admin queue.
6. **Credibility layer** — partners, impact stats, downloadable governance documents.
7. **Polish** — SEO metadata, OG images, sitemap, Lighthouse pass, 404/500 pages.

Ship each phase to production before starting the next. No long-lived branches.

---

## 10. How to work with me on this

- Propose the approach before writing more than ~50 lines of code.
- When something in this file is wrong or has become wrong, say so and propose an edit
  to this file. Don't silently work around it.
- Prefer deleting code to adding configuration.
