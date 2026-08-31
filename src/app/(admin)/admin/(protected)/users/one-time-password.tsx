"use client";

import { useState } from "react";

// Shows a system-generated password ONCE, right after it's created or reset.
// It is never persisted in plain text or re-fetchable — if it's lost here,
// the only recovery is another reset. Hence the warning and the copy button.
export function OneTimePassword({
  email,
  password,
  onDismiss,
}: {
  email: string;
  password: string;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-card border border-warning bg-warning/10 p-4"
    >
      <div>
        <p className="font-medium text-ink-800">Temporary password for {email}</p>
        <p className="text-sm text-ink-600">
          Copy it now and give it to the user over a secure channel. It will not
          be shown again &mdash; you&apos;ll have to reset the password to get a
          new one. The user must change it on first sign-in.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <code className="select-all rounded-md border border-border-strong bg-surface px-3 py-2 font-mono text-sm text-ink-800">
          {password}
        </code>
        <button
          type="button"
          onClick={copy}
          className="rounded-card border border-border-strong px-3 py-2 text-sm text-brand-700"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-card px-3 py-2 text-sm text-ink-500 underline"
        >
          Done
        </button>
      </div>
    </div>
  );
}
