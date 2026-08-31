import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { ChangePasswordForm } from "./change-password-form";

// This route lives directly under admin/ — a SIBLING of (protected)/, not
// inside it. That is deliberate and load-bearing:
//
//   (protected)/layout.tsx redirects every route it wraps to
//   /admin/change-password whenever mustChangePassword is true. If this page
//   were under (protected)/, that redirect would fire ON this page too and
//   bounce it to itself forever — the exact bug CLAUDE.md §4 documents for a
//   layout on admin/ swallowing admin/login.
//
//   Keeping it out of (protected)/ means that layout never runs here, so the
//   forced-change redirect structurally cannot target the page it's trying to
//   send people to. This page does its own auth check instead (below), and
//   pointedly does NOT check mustChangePassword — it must stay reachable in
//   exactly the state that redirects everywhere else.
export default async function ChangePasswordPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/admin/login");
  }

  // Fresh read — a deactivated user (whose session cookie may still be warm
  // for up to 60s) has no business here either.
  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { isActive: true, mustChangePassword: true },
  });
  if (!user || !user.isActive) {
    redirect("/admin/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-subtle px-4 py-12">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-8 shadow-card">
        <h1 className="text-display-sm mb-2">Change your password</h1>
        {user.mustChangePassword ? (
          <p className="mb-6 rounded-md border border-warning bg-warning/10 p-3 text-sm text-ink-700">
            You&apos;re signed in with a temporary password. Set a new one to
            continue to the admin.
          </p>
        ) : (
          <p className="mb-6 text-sm text-ink-600">
            Choose a new password for your account.
          </p>
        )}
        <ChangePasswordForm />
      </div>
    </main>
  );
}
