import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// For Server Components: display/redirect only, backed by the session
// cookie (cache). NOT authorization for a mutation — Server Actions must
// re-check role/isActive against the database themselves. See
// require-admin.ts and CLAUDE.md §7.
export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}
