"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { changePasswordSchema } from "@/lib/validations/user";
import type { ActionResult } from "@/lib/action-result";
import { changeOwnPassword } from "./actions";

const inputClass =
  "rounded-md border border-border-strong px-3 py-2 text-ink-800 outline-none focus-visible:border-brand-700";

export function ChangePasswordForm() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => {
      // Client-side courtesy pass with the shared schema — server re-validates.
      const parsed = changePasswordSchema.safeParse({
        newPassword: formData.get("newPassword"),
        confirmPassword: formData.get("confirmPassword"),
      });
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
      }

      const result = await changeOwnPassword(formData);
      if (result.ok) {
        // Flag is cleared server-side; go to the admin the forced flow was
        // blocking.
        router.push("/admin");
        router.refresh();
      }
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="newPassword" className="text-sm font-medium text-ink-700">
          New password <span className="font-normal text-ink-500">(at least 12 characters)</span>
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-ink-700">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          className={inputClass}
        />
      </div>

      {state && !state.ok ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-card bg-brand-600 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
