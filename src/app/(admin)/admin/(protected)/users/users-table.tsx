"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/generated/prisma/enums";
import type { ActionResult } from "@/lib/action-result";
import {
  changeUserRole,
  deactivateUser,
  reactivateUser,
  resetUserPassword,
  type GeneratedPasswordResult,
} from "./actions";
import { OneTimePassword } from "./one-time-password";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastSignIn: string | null;
};

const controlClass =
  "rounded-md border border-border-strong px-2 py-1 text-sm text-ink-800 outline-none focus-visible:border-brand-700";

function RoleForm({ user, disabled }: { user: UserRow; disabled: boolean }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(user.role);
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => {
      const result = await changeUserRole(formData);
      if (result.ok) router.refresh();
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={user.id} />
      <select
        name="role"
        value={role}
        disabled={disabled || isPending}
        onChange={(event) => setRole(event.target.value as Role)}
        className={controlClass}
        aria-label={`Role for ${user.name}`}
      >
        <option value={Role.EDITOR}>EDITOR</option>
        <option value={Role.ADMIN}>ADMIN</option>
      </select>
      <button
        type="submit"
        disabled={disabled || isPending || role === user.role}
        className="rounded-card border border-border-strong px-2 py-1 text-xs text-brand-700 disabled:opacity-40"
      >
        {isPending ? "Saving…" : "Save role"}
      </button>
      {state && !state.ok ? (
        <span role="alert" className="text-xs text-danger">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}

function ActiveToggle({ user, disabled }: { user: UserRow; disabled: boolean }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => {
      const result = user.isActive
        ? await deactivateUser(formData)
        : await reactivateUser(formData);
      if (result.ok) router.refresh();
      return result;
    },
    null
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          user.isActive &&
          !confirm(`Deactivate ${user.name}? They'll be signed out and can't sign back in.`)
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={user.id} />
      <button
        type="submit"
        disabled={disabled || isPending}
        className={`rounded-card border px-3 py-1 text-sm disabled:opacity-40 ${
          user.isActive
            ? "border-danger text-danger"
            : "border-border-strong text-brand-700"
        }`}
      >
        {isPending ? "Working…" : user.isActive ? "Deactivate" : "Reactivate"}
      </button>
      {state && !state.ok ? (
        <p role="alert" className="mt-1 text-xs text-danger">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

function ResetPasswordButton({
  user,
  onReveal,
}: {
  user: UserRow;
  onReveal: (value: { email: string; password: string }) => void;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<GeneratedPasswordResult | null, FormData>(
    async (_prev, formData) => {
      const result = await resetUserPassword(formData);
      if (result.ok) {
        onReveal({ email: result.email, password: result.password });
        router.refresh();
      }
      return result;
    },
    null
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!confirm(`Reset ${user.name}'s password? Their current password stops working.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={user.id} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-card border border-border-strong px-3 py-1 text-sm text-brand-700 disabled:opacity-40"
      >
        {isPending ? "Resetting…" : "Reset password"}
      </button>
      {state && !state.ok ? (
        <p role="alert" className="mt-1 text-xs text-danger">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const [revealed, setRevealed] = useState<{ email: string; password: string } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {revealed ? (
        <OneTimePassword
          email={revealed.email}
          password={revealed.password}
          onDismiss={() => setRevealed(null)}
        />
      ) : null}

      <ul className="flex flex-col gap-3">
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <li
              key={user.id}
              className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-(--shadow-card)"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-medium text-ink-800">
                    {user.name}
                    {isSelf ? (
                      <span className="rounded-pill border border-brand-700 px-2 py-0.5 text-xs font-medium text-brand-700">
                        You
                      </span>
                    ) : null}
                    {!user.isActive ? (
                      <span className="rounded-pill border border-danger px-2 py-0.5 text-xs font-medium text-danger">
                        Deactivated
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-ink-500">
                    {user.email} · last sign-in {user.lastSignIn ?? "never"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <RoleForm user={user} disabled={isSelf} />
                {isSelf ? (
                  <span className="text-xs text-ink-500">
                    You can&apos;t deactivate your own account or change your own
                    role.
                  </span>
                ) : (
                  <ActiveToggle user={user} disabled={false} />
                )}
                <ResetPasswordButton user={user} onReveal={setRevealed} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
