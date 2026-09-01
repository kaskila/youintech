/**
 * Drives headless Chrome over CDP (Node's built-in WebSocket, no deps) to
 * screenshot the authenticated admin dashboard at 375 and 1280, as both an
 * ADMIN and an EDITOR. Seeds a handful of throwaway fixtures so the
 * needs-attention sections aren't all empty, then deletes them.
 *
 *   1. npx next build && npx next start -p 3200
 *   2. npx tsx scripts/screenshot-admin.mts
 *
 * Writes PNGs to scripts/shots/.
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { createLocalAccountIssuer } from "@better-auth/core/db";
import { db } from "../src/lib/db";
import { auth } from "../src/lib/auth";

const BASE = process.env.SHOT_BASE ?? "http://localhost:3200";
const CHROME =
  process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9333;
const OUT = "scripts/shots";
const TAG = "dash-shot"; // fixture marker

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000);

async function cdp(ws: WebSocket) {
  let id = 0;
  const pending = new Map<number, (v: unknown) => void>();
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(typeof ev.data === "string" ? ev.data : "");
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)!(msg.result);
      pending.delete(msg.id);
    }
  });
  return (method: string, params: Record<string, unknown> = {}) =>
    new Promise<Record<string, unknown>>((resolve) => {
      const myId = ++id;
      pending.set(myId, resolve as (v: unknown) => void);
      ws.send(JSON.stringify({ id: myId, method, params }));
    });
}

async function cookiesFor(email: string, password: string) {
  const res = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
  return res.headers.getSetCookie().map((c) => {
    const [pair] = c.split(";");
    const eq = pair.indexOf("=");
    return { name: pair.slice(0, eq), value: pair.slice(eq + 1) };
  });
}

async function seed() {
  const editor = await db.user.create({
    data: {
      id: randomUUID(),
      name: "Chanda Mwale",
      email: `editor@${TAG}.local`,
      emailVerified: true,
      role: "EDITOR",
      isActive: true,
    },
  });
  await db.account.create({
    data: {
      id: randomUUID(),
      userId: editor.id,
      providerId: "credential",
      issuer: createLocalAccountIssuer("credential"),
      accountId: editor.id,
      password: await hashPassword("seed-Password-123456"),
    },
  });

  await db.post.create({
    data: {
      slug: `${TAG}-draft-story`,
      title: `[${TAG}] The student who mapped every clinic in Kabwe`,
      excerpt: "A draft that has been sitting.",
      body: "Draft body.",
      status: "DRAFT",
      createdAt: daysAgo(23),
      authorId: editor.id,
    },
  });
  await db.programme.create({
    data: {
      slug: `${TAG}-draft-prog`,
      title: `[${TAG}] Rural Connectivity Fellowship`,
      summary: "Draft programme.",
      icon: "Rocket",
      contentStatus: "DRAFT",
      createdAt: daysAgo(4),
    },
  });
  await db.opportunity.create({
    data: {
      slug: `${TAG}-closing`,
      title: `[${TAG}] MTN Zambia Data Science Scholarship`,
      summary: "Closing very soon.",
      organisation: "MTN Zambia Foundation",
      type: "SCHOLARSHIP",
      deadline: daysAhead(3),
      applyUrl: "https://example.com/apply",
      contentStatus: "PUBLISHED",
    },
  });

  // A couple of audit rows for the editor so "Your recent edits" isn't empty.
  await db.auditLog.createMany({
    data: [
      {
        action: "post.update",
        entityType: "Post",
        entityId: null,
        actorId: editor.id,
        createdAt: daysAgo(0),
      },
      {
        action: "opportunity.created",
        entityType: "Opportunity",
        entityId: null,
        actorId: editor.id,
        createdAt: daysAgo(1),
      },
    ],
  });

  return editor;
}

async function cleanup() {
  const editors = await db.user.findMany({
    where: { email: { endsWith: `@${TAG}.local` } },
    select: { id: true },
  });
  const ids = editors.map((e) => e.id);
  await db.auditLog.deleteMany({
    where: { OR: [{ actorId: { in: ids } }, { entityId: { in: ids } }] },
  });
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.account.deleteMany({ where: { userId: { in: ids } } });
  await db.post.deleteMany({ where: { slug: { startsWith: TAG } } });
  await db.programme.deleteMany({ where: { slug: { startsWith: TAG } } });
  await db.opportunity.deleteMany({ where: { slug: { startsWith: TAG } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  await cleanup();
  await seed();

  const roles = {
    admin: await cookiesFor(
      process.env.SEED_ADMIN_EMAIL!,
      process.env.SEED_ADMIN_PASSWORD!
    ),
    editor: await cookiesFor(`editor@${TAG}.local`, "seed-Password-123456"),
  };

  const chrome = spawn(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${process.cwd()}/scripts/shots/.chrome`,
    "about:blank",
  ]);
  chrome.on("error", (e) => console.error("chrome spawn error", e));

  let target: { webSocketDebuggerUrl: string } | null = null;
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://localhost:${PORT}/json/new?about:blank`, { method: "PUT" });
      target = await r.json();
      break;
    } catch {
      await sleep(250);
    }
  }
  if (!target) throw new Error("Chrome CDP endpoint never came up");

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  const send = await cdp(ws);
  await send("Page.enable");
  await send("Network.enable");

  const shoot = async (
    name: string,
    width: number,
    mobile: boolean,
    cookies: { name: string; value: string }[],
    afterLoad?: () => Promise<void>
  ) => {
    await send("Network.clearBrowserCookies");
    for (const c of cookies) {
      await send("Network.setCookie", {
        name: c.name,
        value: c.value,
        domain: "localhost",
        path: "/",
      });
    }
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: mobile ? 812 : 900,
      deviceScaleFactor: mobile ? 2 : 1,
      mobile,
    });
    await send("Page.navigate", { url: `${BASE}/admin` });
    await sleep(1800);
    if (afterLoad) await afterLoad();
    const result = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    });
    writeFileSync(`${OUT}/${name}.png`, Buffer.from(String(result.data), "base64"));
    console.log(`  wrote ${name}.png`);
  };

  const openMenu = async () => {
    await send("Runtime.evaluate", {
      expression:
        "document.querySelector('button[aria-controls=\\'admin-mobile-nav\\']')?.click()",
    });
    await sleep(400);
  };

  console.log("shooting…");
  await shoot("dash-admin-375", 375, true, roles.admin);
  await shoot("dash-admin-375-menu", 375, true, roles.admin, openMenu);
  await shoot("dash-admin-1280", 1280, false, roles.admin);
  await shoot("dash-editor-375", 375, true, roles.editor);
  await shoot("dash-editor-1280", 1280, false, roles.editor);

  ws.close();
  chrome.kill();
  await sleep(300);
  await cleanup();
  await db.$disconnect();
  console.log("done");
}

main().catch(async (e) => {
  console.error(e);
  await cleanup().catch(() => {});
  await db.$disconnect();
  process.exitCode = 1;
});
