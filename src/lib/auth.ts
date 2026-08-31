import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";

// Admin/editor auth only. Public pages are unauthenticated — see CLAUDE.md §3.
// No public signup: accounts are created by prisma/seed.ts or by an ADMIN from
// the admin UI. disableSignUp blocks /sign-up/email at the handler level, so
// it also blocks server-side auth.api.signUpEmail() calls — seeding goes
// through Better Auth's own password hasher directly instead (see seed.ts).
const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;

if (!secret) {
  throw new Error("BETTER_AUTH_SECRET is not set.");
}
if (!baseURL) {
  throw new Error("BETTER_AUTH_URL is not set.");
}

export const auth = betterAuth({
  secret,
  baseURL,
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
        defaultValue: "EDITOR",
      },
      isActive: {
        type: "boolean",
        input: false,
        defaultValue: true,
      },
    },
  },
  session: {
    // Guards (proxy.ts, Server Actions) read role/isActive off the signed
    // session cookie instead of hitting the DB on every request. A change to
    // either field takes up to maxAge to propagate to an existing session.
    cookieCache: {
      enabled: true,
      maxAge: 60,
    },
  },
  databaseHooks: {
    session: {
      create: {
        // Deactivated users must not be able to sign in. The email/password
        // sign-in route does NOT run user.validateUserInfo (verified against
        // node_modules/better-auth/dist/api/routes/sign-in.mjs — it's only
        // wired into the OAuth callback), so the check goes here: every
        // sign-in creates a session, and returning false makes createSession
        // return null, which the route surfaces as FAILED_TO_CREATE_SESSION.
        // This is a fresh DB read, not the cached cookie — see
        // require-staff.ts for the same freshness reasoning. Existing
        // sessions are additionally killed outright by deactivateUser.
        before: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { isActive: true },
          });
          if (!user || !user.isActive) return false;
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
