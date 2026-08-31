"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/generated/prisma/enums";
import { userCreateSchema } from "@/lib/validations/user";
import { createUser, type GeneratedPasswordResult } from "./actions";
import { OneTimePassword } from "./one-time-password";

const inputClass =
  "rounded-md border border-border-strong px-3 py-2 text-ink-800 outline-none focus-visible:border-brand-700";

export function UserCreateForm() {
  const router = useRouter();
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const [state, formAction, isPending] = useActionState<GeneratedPasswordResult | null, FormData>(
    async (_prev, formData) => {
      const parsed = userCreateSchema.safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        role: formData.get("role"),
      });
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
      }

      const result = await createUser(formData);
      if (result.ok) {
        setCreated({ email: result.email, password: result.password });
        router.refresh();
      }
      return result;
    },
    null
  );

  if (created) {
    return (
      <div className="flex flex-col gap-4">
        <OneTimePassword
          email={created.email}
          password={created.password}
          onDismiss={() => router.push("/admin/users")}
        />
        <button
          type="button"
          onClick={() => setCreated(null)}
          className="self-start rounded-card border border-border-strong px-4 py-2 text-sm text-brand-700"
        >
          Create another user
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-ink-700">
          Name
        </label>
        <input id="name" name="name" required maxLength={120} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="off"
          required
          maxLength={200}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="role" className="text-sm font-medium text-ink-700">
          Role
        </label>
        <select id="role" name="role" defaultValue={Role.EDITOR} className={inputClass}>
          <option value={Role.EDITOR}>EDITOR — content only</option>
          <option value={Role.ADMIN}>ADMIN — full access, incl. user management</option>
        </select>
      </div>

      <p className="text-sm text-ink-500">
        A temporary password is generated automatically and shown once after you
        create the account. The user is required to change it on first sign-in.
      </p>

      {state && !state.ok ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-card bg-brand-600 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}
