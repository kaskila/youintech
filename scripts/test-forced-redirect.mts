/**
 * HTTP-level check of the forced-password-change redirect and its loop safety.
 * Run against a running server:  npx next start -p 3111  then  npx tsx scripts/test-forced-redirect.mts
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { createLocalAccountIssuer } from "@better-auth/core/db";
import { db } from "../src/lib/db";
import { auth } from "../src/lib/auth";

const BASE = process.env.TEST_BASE ?? "http://localhost:3111";
const DOMAIN = "umgmt-test.local";
const PW = "seed-Password-123456";

let pass = 0,
  fail = 0;
const check = (l: string, c: boolean, d?: unknown) =>
  c ? (pass++, console.log(`  ✓ ${l}`)) : (fail++, console.error(`  ✗ ${l}`, d ?? ""));

async function loc(path: string, cookie: string): Promise<string | null> {
  const res = await fetch(`${BASE}${path}`, { headers: { cookie }, redirect: "manual" });
  return res.headers.get("location");
}

async function main() {
  const users = await db.user.findMany({ where: { email: { endsWith: `@${DOMAIN}` } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.account.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });

  const user = await db.user.create({
    data: {
      id: randomUUID(),
      name: "Forced User",
      email: `forced@${DOMAIN}`,
      emailVerified: true,
      role: "EDITOR",
      isActive: true,
      mustChangePassword: true,
    },
  });
  await db.account.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      providerId: "credential",
      issuer: createLocalAccountIssuer("credential"),
      accountId: user.id,
      password: await hashPassword(PW),
    },
  });

  const res = await auth.api.signInEmail({ body: { email: user.email, password: PW }, asResponse: true });
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  check("forced user signed in", Boolean(cookie));

  console.log("\nforced user (mustChangePassword=true):");
  check("/admin → /admin/change-password", (await loc("/admin", cookie)) === "/admin/change-password", await loc("/admin", cookie));
  check(
    "/admin/users → /admin/change-password",
    (await loc("/admin/users", cookie)) === "/admin/change-password",
    await loc("/admin/users", cookie)
  );
  const cpLoc = await loc("/admin/change-password", cookie);
  check("/admin/change-password does NOT redirect (no loop)", cpLoc === null, cpLoc);

  console.log("\nno cookie:");
  check("/admin/change-password → /admin/login", (await loc("/admin/change-password", "")) === "/admin/login", await loc("/admin/change-password", ""));

  await db.session.deleteMany({ where: { userId: user.id } });
  await db.account.deleteMany({ where: { userId: user.id } });
  await db.user.delete({ where: { id: user.id } });
  await db.$disconnect();
  console.log(`\n${fail === 0 ? "ALL PASS" : "FAILURES"}: ${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exitCode = 1;
});
