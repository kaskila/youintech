import { randomInt, randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { createLocalAccountIssuer } from "@better-auth/core/db";
import { db } from "@/lib/db";

// Password handling for admin-managed accounts. Mirrors prisma/seed.ts: the
// credential Account row is written directly through Better Auth's own hasher.
// auth.api.signUpEmail / auth.api.setPassword are not usable here —
// disableSignUp (see lib/auth.ts) blocks them even server-side — and going
// through the same hashPassword the seed uses keeps one hashing path.

// Deliberately no 0/O/1/l/I: a temp password is read off a screen and typed
// or pasted once. Length 20 clears minPasswordLength (12) with margin.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const LENGTH = 20;

// Cryptographically secure — crypto.randomInt, never Math.random. Rejection
// sampling is handled by randomInt itself (it discards biased draws).
export function generateTemporaryPassword(): string {
  let out = "";
  for (let i = 0; i < LENGTH; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

const credentialIssuer = createLocalAccountIssuer("credential");

// Create or replace the user's credential Account row with a fresh hash.
// Used by admin create-user, admin reset-password, and the user's own
// change-password action.
export async function setUserPassword(userId: string, plainPassword: string): Promise<void> {
  const passwordHash = await hashPassword(plainPassword);

  const existing = await db.account.findFirst({
    where: { userId, providerId: "credential" },
    select: { id: true },
  });

  if (existing) {
    await db.account.update({
      where: { id: existing.id },
      data: { password: passwordHash },
    });
    return;
  }

  await db.account.create({
    data: {
      id: randomUUID(),
      userId,
      providerId: "credential",
      issuer: credentialIssuer,
      accountId: userId,
      password: passwordHash,
    },
  });
}

// True when `plainPassword` matches the user's current credential password.
// Used to enforce "the new password must differ from the current one".
// Returns false when the user has no credential account yet (nothing to
// collide with) rather than throwing.
export async function isCurrentPassword(userId: string, plainPassword: string): Promise<boolean> {
  const account = await db.account.findFirst({
    where: { userId, providerId: "credential" },
    select: { password: true },
  });
  if (!account?.password) return false;
  return verifyPassword({ hash: account.password, password: plainPassword });
}
