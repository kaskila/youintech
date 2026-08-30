"use client";

import { useActionState } from "react";
import { archiveEvent } from "./actions";
import type { ActionResult } from "@/lib/action-result";

const initialState: ActionResult = { ok: true };

export function EventArchiveButton({ id, title }: { id: string; title: string }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => archiveEvent(formData),
    initialState
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!confirm(`Archive "${title}"? It will be hidden from the public site.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-pill border border-danger px-3 py-1 text-sm text-danger disabled:opacity-40"
      >
        {isPending ? "Archiving…" : "Archive"}
      </button>
      {!state.ok ? (
        <p role="alert" className="mt-1 text-xs text-danger">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
