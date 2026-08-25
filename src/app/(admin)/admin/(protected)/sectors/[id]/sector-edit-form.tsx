"use client";

import { useActionState } from "react";
import { updateSector } from "../actions";
import { sectorFieldsSchema } from "@/lib/validations/sector";
import type { ActionResult } from "@/lib/action-result";
import type { Sector } from "@/generated/prisma/client";

const inputClass =
  "rounded-md border border-border-strong px-3 py-2 text-ink-800 outline-none focus-visible:border-brand-700";

export function SectorEditForm({ sector }: { sector: Sector }) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => {
      // Client-side pass, sharing the same schema as the server. A
      // courtesy — the Server Action re-validates authoritatively.
      const parsed = sectorFieldsSchema.safeParse({
        name: formData.get("name"),
        slug: formData.get("slug"),
        tagline: formData.get("tagline") ?? "",
        description: formData.get("description") ?? "",
        icon: formData.get("icon") ?? "",
        displayOrder: formData.get("displayOrder"),
        isActive: formData.get("isActive") === "on",
      });
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
      }
      return updateSector(formData);
    },
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={sector.id} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-ink-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={sector.name}
          required
          maxLength={200}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="slug" className="text-sm font-medium text-ink-700">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          defaultValue={sector.slug}
          required
          maxLength={100}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          title="Lowercase letters, numbers, and hyphens only."
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="tagline" className="text-sm font-medium text-ink-700">
          Tagline
        </label>
        <input
          id="tagline"
          name="tagline"
          defaultValue={sector.tagline ?? ""}
          maxLength={300}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-ink-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={sector.description ?? ""}
          maxLength={5000}
          rows={5}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="icon" className="text-sm font-medium text-ink-700">
          Icon
        </label>
        <input
          id="icon"
          name="icon"
          defaultValue={sector.icon ?? ""}
          maxLength={100}
          placeholder="lucide icon name"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="displayOrder" className="text-sm font-medium text-ink-700">
          Display order
        </label>
        <input
          id="displayOrder"
          name="displayOrder"
          type="number"
          min={0}
          max={999}
          defaultValue={sector.displayOrder}
          required
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" name="isActive" defaultChecked={sector.isActive} />
        Active
      </label>

      {state && !state.ok ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="text-sm text-success">
          Saved.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-pill bg-brand-900 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
