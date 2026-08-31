/**
 * Integration test for the admin user-management slice — exercises the SERVER
 * ACTIONS directly (not the UI), inside a faked Next request scope so
 * `headers()` / `revalidatePath()` resolve.
 *
 *   npx tsx scripts/test-user-mgmt.ts
 *
 * Needs the local Postgres up and .env loaded (both happen automatically).
 * Creates users under the @umgmt-test.local domain and deletes them at the end.
 */
import "dotenv/config";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { createLocalAccountIssuer } from "@better-auth/core/db";

// Next's app-render storage modules capture `globalThis.AsyncLocalStorage` at
// import time and throw a FakeAsyncLocalStorage otherwise. Must be set before
// any next/* or Server Action module is loaded — hence the dynamic imports
// below.
(globalThis as { AsyncLocalStorage?: unknown }).AsyncLocalStorage = AsyncLocalStorage;

const { workAsyncStorage } = await import(
  "next/dist/server/app-render/work-async-storage.external.js"
);
const { workUnitAsyncStorage } = await import(
  "next/dist/server/app-render/work-unit-async-storage.external.js"
);
const { db } = await import("../src/lib/db");
const { auth } = await import("../src/lib/auth");
const { createUser, deactivateUser, changeUserRole, resetUserPassword, reactivateUser } =
  await import("../src/app/(admin)/admin/(protected)/users/actions");
const { changeOwnPassword } = await import(
  "../src/app/(admin)/admin/change-password/actions"
);

const DOMAIN = "umgmt-test.local";
const PW = "seed-Password-123456";

let pass = 0;
let fail = 0;
function check(label: string, cond: boolean, detail?: unknown) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ ${label}`, detail ?? "");
  }
}

// --- fake Next request scope -------------------------------------------------
async function withRequest<T>(cookie: string, fn: () => Promise<T>): Promise<T> {
  const workStore = {
    route: "/admin/(protected)/users",
    incrementalCache: {},
    cacheLifeProfiles: {},
    pendingRevalidatedTags: [],
  };
  const headers = new Headers({ cookie });
  const workUnitStore = { type: "request", phase: "action", headers };
  // Minimal partial stores — `as never` because we only populate the handful
  // of fields headers()/revalidatePath() actually read (verified against the
  // Next source), not the full WorkStore/WorkUnitStore shape.
  return workAsyncStorage.run(workStore as never, () =>
    workUnitAsyncStorage.run(workUnitStore as never, fn)
  );
}

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

async function makeUser(name: string, role: "ADMIN" | "EDITOR") {
  const email = `${name}@${DOMAIN}`;
  const user = await db.user.create({
    data: { id: randomUUID(), name, email, emailVerified: true, role, isActive: true },
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
  return user;
}

async function signIn(email: string, password = PW): Promise<string | null> {
  const res = await auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  });
  const setCookies = res.headers.getSetCookie();
  if (!setCookies.length) return null;
  return setCookies.map((c) => c.split(";")[0]).join("; ");
}

async function cleanup() {
  const users = await db.user.findMany({ where: { email: { endsWith: `@${DOMAIN}` } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (ids.length) {
    await db.auditLog.deleteMany({ where: { OR: [{ actorId: { in: ids } }, { entityId: { in: ids } }] } });
    await db.session.deleteMany({ where: { userId: { in: ids } } });
    await db.account.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
  }
}

async function main() {
  await cleanup();

  const adminA = await makeUser("admin-a", "ADMIN");
  const editorE = await makeUser("editor-e", "EDITOR");
  const victimV = await makeUser("victim-v", "EDITOR");

  const adminCookie = await signIn(adminA.email);
  const editorCookie = await signIn(editorE.email);
  const victimCookie = await signIn(victimV.email);
  check("all three test users signed in", Boolean(adminCookie && editorCookie && victimCookie));
  if (!adminCookie || !editorCookie || !victimCookie) throw new Error("sign-in setup failed");

  // 1. EDITOR attempting user creation ------------------------------------------------
  console.log("\n1. EDITOR attempting user creation");
  const editorCreate = await withRequest(editorCookie, () =>
    createUser(fd({ name: "Nope", email: `nope@${DOMAIN}`, role: "EDITOR" }))
  );
  check("returns ok:false", editorCreate.ok === false, editorCreate);
  check(
    "error is a permission message",
    !editorCreate.ok && /permission/i.test(editorCreate.error),
    editorCreate
  );
  const leaked = await db.user.findUnique({ where: { email: `nope@${DOMAIN}` } });
  check("no user row was created", leaked === null);

  // 2. ADMIN attempting to deactivate themselves -------------------------------------
  console.log("\n2. ADMIN attempting to deactivate themselves");
  const selfDeact = await withRequest(adminCookie, () => deactivateUser(fd({ id: adminA.id })));
  check("returns ok:false", selfDeact.ok === false, selfDeact);
  check(
    "error names the self-deactivation rule",
    !selfDeact.ok && /your own account/i.test(selfDeact.error),
    selfDeact
  );
  const adminStill = await db.user.findUnique({ where: { id: adminA.id } });
  check("admin is still active", adminStill?.isActive === true);

  // 3. ADMIN attempting to change their own role ------------------------------------
  console.log("\n3. ADMIN attempting to change their own role");
  const selfRole = await withRequest(adminCookie, () =>
    changeUserRole(fd({ id: adminA.id, role: "EDITOR" }))
  );
  check("returns ok:false", selfRole.ok === false, selfRole);
  check(
    "error names the self-role rule",
    !selfRole.ok && /your own role/i.test(selfRole.error),
    selfRole
  );
  const adminRole = await db.user.findUnique({ where: { id: adminA.id } });
  check("admin is still ADMIN", adminRole?.role === "ADMIN");

  // 4. user with mustChangePassword=true reaching another admin route ---------------
  //    (the redirect itself is layout-level and covered by the HTTP test; here we
  //     verify the DB flag the layout reads, and that a forced user can still run
  //     the change-password action to clear it.)
  console.log("\n4. mustChangePassword flow");
  await db.user.update({ where: { id: victimV.id }, data: { mustChangePassword: true } });
  const flagged = await db.user.findUnique({ where: { id: victimV.id } });
  check("mustChangePassword persisted true", flagged?.mustChangePassword === true);
  const newVictimPw = "brand-New-Passw0rd-9x";
  const changed = await withRequest(victimCookie, () =>
    changeOwnPassword(fd({ newPassword: newVictimPw, confirmPassword: newVictimPw }))
  );
  check("change-password action succeeds for a forced user", changed.ok === true, changed);
  const cleared = await db.user.findUnique({ where: { id: victimV.id } });
  check("mustChangePassword cleared to false", cleared?.mustChangePassword === false);
  // must differ from current
  const sameAgain = await withRequest(victimCookie, () =>
    changeOwnPassword(fd({ newPassword: newVictimPw, confirmPassword: newVictimPw }))
  );
  check(
    "rejects reusing the current password",
    sameAgain.ok === false && /different/i.test((sameAgain as { error: string }).error),
    sameAgain
  );

  // 5. a deactivated user's existing session attempting a mutation -----------------
  //    Deactivate the ROW only (no session delete) to prove requireStaff's fresh
  //    DB read is what blocks the still-valid cookie.
  console.log("\n5. deactivated user's existing session attempting a mutation");
  const freshVictimCookie = await signIn(victimV.email, newVictimPw);
  check("victim can sign in again (still active)", Boolean(freshVictimCookie));
  await db.user.update({ where: { id: victimV.id }, data: { isActive: false } });
  const sessionsStillThere = await db.session.count({ where: { userId: victimV.id } });
  check("session row still present (not deleted in this path)", sessionsStillThere > 0);
  const deadMutation = await withRequest(freshVictimCookie!, () =>
    changeOwnPassword(fd({ newPassword: "another-Passw0rd-42", confirmPassword: "another-Passw0rd-42" }))
  );
  check(
    "mutation rejected via fresh isActive read",
    deadMutation.ok === false && /permission/i.test((deadMutation as { error: string }).error),
    deadMutation
  );
  // and the sign-in hook blocks a new sign-in
  const blockedSignIn = await signIn(victimV.email, newVictimPw).catch(() => "THREW");
  check("deactivated user cannot obtain a new session", blockedSignIn === null || blockedSignIn === "THREW", blockedSignIn);
  await db.user.update({ where: { id: victimV.id }, data: { isActive: true } });

  // 6. happy path: ADMIN creates a user ------------------------------------------------
  console.log("\n6. happy path — ADMIN creates a user");
  const created = await withRequest(adminCookie, () =>
    createUser(fd({ name: "Fresh Hire", email: `fresh@${DOMAIN}`, role: "EDITOR" }))
  );
  check("createUser returns ok:true with a password", created.ok === true && "password" in created && created.password.length >= 12, created);
  if (created.ok) {
    const row = await db.user.findUnique({ where: { email: `fresh@${DOMAIN}` }, include: { accounts: true } });
    check("new user has mustChangePassword=true", row?.mustChangePassword === true);
    check("new user has a credential account", row?.accounts.some((a) => a.providerId === "credential") === true);
    const signedInFresh = await signIn(`fresh@${DOMAIN}`, created.password);
    check("generated password actually works for sign-in", Boolean(signedInFresh));
  }

  // 7. bonus: EDITOR blocked from the other admin actions --------------------------
  console.log("\n7. EDITOR blocked from deactivate / role / reset");
  const e1 = await withRequest(editorCookie, () => deactivateUser(fd({ id: victimV.id })));
  const e2 = await withRequest(editorCookie, () => changeUserRole(fd({ id: victimV.id, role: "ADMIN" })));
  const e3 = await withRequest(editorCookie, () => resetUserPassword(fd({ id: victimV.id })));
  check("EDITOR deactivateUser blocked", e1.ok === false);
  check("EDITOR changeUserRole blocked", e2.ok === false);
  check("EDITOR resetUserPassword blocked", e3.ok === false);

  // 8. ADMIN deactivates someone else — sessions are killed -----------------------
  console.log("\n8. ADMIN deactivates another user");
  await signIn(victimV.email, newVictimPw); // ensure a live session exists
  const beforeCount = await db.session.count({ where: { userId: victimV.id } });
  const deact = await withRequest(adminCookie, () => deactivateUser(fd({ id: victimV.id })));
  check("deactivate succeeds", deact.ok === true, deact);
  const afterCount = await db.session.count({ where: { userId: victimV.id } });
  check("existing sessions deleted", beforeCount > 0 && afterCount === 0, { beforeCount, afterCount });
  const react = await withRequest(adminCookie, () => reactivateUser(fd({ id: victimV.id })));
  check("reactivate succeeds", react.ok === true, react);

  // 9. audit log written for every action ----------------------------------------
  console.log("\n9. audit trail");
  const actions = await db.auditLog.findMany({
    where: { entityType: "User", actorId: { in: [adminA.id, victimV.id] } },
    select: { action: true },
  });
  const seen = new Set(actions.map((a) => a.action));
  for (const a of ["user.create", "user.deactivate", "user.reactivate", "user.password_change"]) {
    check(`audit has ${a}`, seen.has(a), [...seen]);
  }

  console.log(`\n${fail === 0 ? "ALL PASS" : "FAILURES"}: ${pass} passed, ${fail} failed`);
  await cleanup();
  await db.$disconnect();
  process.exitCode = fail === 0 ? 0 : 1;
}

main().catch(async (e) => {
  console.error(e);
  await cleanup();
  await db.$disconnect();
  process.exitCode = 1;
});
