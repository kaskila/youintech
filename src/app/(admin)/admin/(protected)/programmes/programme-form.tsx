"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createProgramme, updateProgramme } from "./actions";
import { programmeFieldsSchema } from "@/lib/validations/programme";
import type { ActionResult } from "@/lib/action-result";
import type { Programme } from "@/generated/prisma/client";
import { ProgrammeStatus } from "@/generated/prisma/enums";
import { CloudinaryImageUpload } from "@/components/admin/image-upload";

const inputClass =
  "rounded-md border border-border-strong px-3 py-2 text-ink-800 outline-none focus-visible:border-brand-700";

// Local-date input (YYYY-MM-DD) from a stored UTC DateTime — see
// format-date.ts for the human-facing (Africa/Lusaka) equivalent. This one
// feeds an <input type="date">, which wants the ISO date substring, not a
// localised string.
function toDateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function ProgrammeForm({ programme }: { programme?: Programme }) {
  const router = useRouter();
  const isEditing = Boolean(programme);

  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => {
      // Client-side pass, sharing the same schema as the server. A
      // courtesy — the Server Action re-validates authoritatively.
      const parsed = programmeFieldsSchema.safeParse({
        slug: formData.get("slug"),
        title: formData.get("title"),
        summary: formData.get("summary"),
        description: formData.get("description") ?? "",
        coverImage: formData.get("coverImage") ?? "",
        coverAlt: formData.get("coverAlt") ?? "",
        icon: formData.get("icon"),
        status: formData.get("status"),
        isFlagship: formData.get("isFlagship") === "on",
        applicationsOpen: formData.get("applicationsOpen") === "on",
        applicationUrl: formData.get("applicationUrl") ?? "",
        targetDate: formData.get("targetDate") ?? "",
        displayOrder: formData.get("displayOrder"),
        contentStatus: formData.get("contentStatus"),
      });
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
      }

      const result = isEditing ? await updateProgramme(formData) : await createProgramme(formData);
      if (result.ok && !isEditing) {
        router.push("/admin/programmes");
      }
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {programme ? <input type="hidden" name="id" value={programme.id} /> : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-ink-700">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={programme?.title}
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
          defaultValue={programme?.slug}
          required
          maxLength={100}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          title="Lowercase letters, numbers, and hyphens only."
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="summary" className="text-sm font-medium text-ink-700">
          Summary <span className="font-normal text-ink-500">(one-line pitch, ~200 chars)</span>
        </label>
        <textarea
          id="summary"
          name="summary"
          defaultValue={programme?.summary}
          required
          maxLength={200}
          rows={2}
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
          defaultValue={programme?.description ?? ""}
          maxLength={10000}
          rows={8}
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
          defaultValue={programme?.icon}
          required
          maxLength={100}
          placeholder="lucide icon name"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-700">
          Cover image <span className="font-normal text-ink-500">(optional)</span>
        </span>
        {/* Existing values may be a Cloudinary URL or a plain /public path
            from before this widget existed (e.g. the seeded programmes) —
            the preview and the public pages render either one unchanged,
            see next.config.ts remotePatterns + programme-card.tsx. */}
        <CloudinaryImageUpload
          folder="programmes"
          fieldName="coverImage"
          altFieldName="coverAlt"
          defaultValue={programme?.coverImage}
          defaultAlt={programme?.coverAlt}
          label="Cover image"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="status" className="text-sm font-medium text-ink-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={programme?.status ?? ProgrammeStatus.PLANNED}
          className={inputClass}
        >
          {Object.values(ProgrammeStatus).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="targetDate" className="text-sm font-medium text-ink-700">
          Target date <span className="font-normal text-ink-500">(optional — leave blank if nothing is scheduled)</span>
        </label>
        <input
          id="targetDate"
          name="targetDate"
          type="date"
          defaultValue={toDateInputValue(programme?.targetDate ?? null)}
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
          defaultValue={programme?.displayOrder ?? 0}
          required
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" name="isFlagship" defaultChecked={programme?.isFlagship ?? false} />
        Flagship programme
      </label>

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          name="applicationsOpen"
          defaultChecked={programme?.applicationsOpen ?? false}
        />
        Applications open
      </label>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="applicationUrl" className="text-sm font-medium text-ink-700">
          Application link{" "}
          <span className="font-normal text-ink-500">
            (required before turning applications on)
          </span>
        </label>
        <input
          id="applicationUrl"
          name="applicationUrl"
          type="url"
          defaultValue={programme?.applicationUrl ?? ""}
          maxLength={500}
          placeholder="https://…"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contentStatus" className="text-sm font-medium text-ink-700">
          Publish status
        </label>
        <select
          id="contentStatus"
          name="contentStatus"
          defaultValue={programme?.contentStatus ?? "DRAFT"}
          className={inputClass}
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
        {/* ARCHIVED isn't offered here on purpose — see programmes/actions.ts
            archiveProgramme, an ADMIN-only action. */}
      </div>

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
        className="self-start rounded-card bg-brand-600 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Saving…" : isEditing ? "Save" : "Create programme"}
      </button>
    </form>
  );
}
