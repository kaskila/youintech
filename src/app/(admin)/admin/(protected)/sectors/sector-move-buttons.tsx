"use client";

import { useActionState } from "react";
import { moveSector } from "./actions";
import type { ActionResult } from "@/lib/action-result";

const initialState: ActionResult = { ok: true };

export function SectorMoveButtons({
  id,
  name,
  disableUp,
  disableDown,
}: {
  id: string;
  name: string;
  disableUp: boolean;
  disableDown: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => moveSector(formData),
    initialState
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <form action={formAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="direction" value="up" />
          <button
            type="submit"
            aria-label={`Move ${name} up`}
            disabled={disableUp || isPending}
            className="rounded-md border border-border-strong px-2 py-1 text-ink-700 disabled:opacity-40"
          >
            ↑
          </button>
        </form>
        <form action={formAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="direction" value="down" />
          <button
            type="submit"
            aria-label={`Move ${name} down`}
            disabled={disableDown || isPending}
            className="rounded-md border border-border-strong px-2 py-1 text-ink-700 disabled:opacity-40"
          >
            ↓
          </button>
        </form>
      </div>
      {!state.ok ? (
        <p role="alert" className="text-xs text-danger">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
