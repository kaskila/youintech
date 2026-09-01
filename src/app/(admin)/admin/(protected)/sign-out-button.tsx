"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await authClient.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="inline-flex min-h-11 items-center rounded-card border border-brand-100/40 px-3 text-sm text-brand-100 disabled:opacity-60"
    >
      {isSigningOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
