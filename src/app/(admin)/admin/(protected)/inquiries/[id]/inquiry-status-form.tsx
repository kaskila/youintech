"use client";

import { useActionState } from "react";
import { updateInquiryStatus } from "../actions";
import { InquiryStatus } from "@/generated/prisma/enums";
import type { ActionResult } from "@/lib/action-result";

export function InquiryStatusForm({ id, status }: { id: string; status: InquiryStatus }) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => updateInquiryStatus(formData),
    null
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={id} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="status" className="text-sm font-medium text-ink-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="rounded-md border border-border-strong px-3 py-2 text-sm text-ink-800 outline-none focus-visible:border-brand-700"
        >
          {Object.values(InquiryStatus).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-pill bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Update status"}
      </button>

      {state && !state.ok ? (
        <p role="alert" className="w-full text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="w-full text-sm text-success">
          Saved.
        </p>
      ) : null}
    </form>
  );
}
