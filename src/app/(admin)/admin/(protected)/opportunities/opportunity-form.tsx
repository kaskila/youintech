"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createOpportunity, updateOpportunity } from "./actions";
import { opportunityFieldsSchema, opportunityCreateSchema } from "@/lib/validations/opportunity";
import type { ActionResult } from "@/lib/action-result";
import type { Opportunity, Sector } from "@/generated/prisma/client";
import { OpportunityType } from "@/generated/prisma/enums";
import { CloudinaryImageUpload } from "@/components/admin/image-upload";

const inputClass =
  "rounded-md border border-border-strong px-3 py-2 text-ink-800 outline-none focus-visible:border-brand-700";

// Local datetime-local input value from a stored UTC DateTime — same
// shortcut as toDateInputValue in programme-form.tsx (a straight ISO
// slice, not adjusted for timezone). Consistent with how targetDate
// already works in this codebase; not introducing a new precision problem.
function toDateTimeInputValue(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 16) : "";
}

export function OpportunityForm({
  opportunity,
  sectors,
}: {
  opportunity?: Opportunity;
  sectors: Sector[];
}) {
  const router = useRouter();
  const isEditing = Boolean(opportunity);

  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => {
      // Client-side pass, sharing the same schema as the server. A
      // courtesy — the Server Action re-validates authoritatively. Uses
      // the create-only schema (rejects a past deadline) when creating,
      // so that feedback shows up instantly rather than after a round trip.
      const fields = {
        slug: formData.get("slug"),
        title: formData.get("title"),
        summary: formData.get("summary"),
        description: formData.get("description") ?? "",
        organisation: formData.get("organisation"),
        type: formData.get("type"),
        location: formData.get("location") ?? "",
        isRemote: formData.get("isRemote") === "on",
        deadline: formData.get("deadline"),
        applyUrl: formData.get("applyUrl"),
        eligibility: formData.get("eligibility") ?? "",
        sectorId: formData.get("sectorId") ?? "",
        coverImage: formData.get("coverImage") ?? "",
        coverAlt: formData.get("coverAlt") ?? "",
        contentStatus: formData.get("contentStatus"),
      };
      const parsed = isEditing
        ? opportunityFieldsSchema.safeParse(fields)
        : opportunityCreateSchema.safeParse(fields);
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
      }

      const result = isEditing ? await updateOpportunity(formData) : await createOpportunity(formData);
      if (result.ok && !isEditing) {
        router.push("/admin/opportunities");
      }
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {opportunity ? <input type="hidden" name="id" value={opportunity.id} /> : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-ink-700">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={opportunity?.title}
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
          defaultValue={opportunity?.slug}
          required
          maxLength={100}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          title="Lowercase letters, numbers, and hyphens only."
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="organisation" className="text-sm font-medium text-ink-700">
          Organisation <span className="font-normal text-ink-500">(who is offering it)</span>
        </label>
        <input
          id="organisation"
          name="organisation"
          defaultValue={opportunity?.organisation}
          required
          maxLength={200}
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
          defaultValue={opportunity?.summary}
          required
          maxLength={200}
          rows={2}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-ink-700">
          Description <span className="font-normal text-ink-500">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={opportunity?.description ?? ""}
          maxLength={10000}
          rows={8}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="type" className="text-sm font-medium text-ink-700">
          Type
        </label>
        <select
          id="type"
          name="type"
          defaultValue={opportunity?.type ?? OpportunityType.SCHOLARSHIP}
          className={inputClass}
        >
          {Object.values(OpportunityType).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sectorId" className="text-sm font-medium text-ink-700">
          Sector <span className="font-normal text-ink-500">(optional — leave blank if cross-sector)</span>
        </label>
        <select
          id="sectorId"
          name="sectorId"
          defaultValue={opportunity?.sectorId ?? ""}
          className={inputClass}
        >
          <option value="">— Cross-sector / none —</option>
          {sectors.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="location" className="text-sm font-medium text-ink-700">
          Location <span className="font-normal text-ink-500">(optional)</span>
        </label>
        <input
          id="location"
          name="location"
          defaultValue={opportunity?.location ?? ""}
          maxLength={200}
          placeholder="e.g. Lusaka, Zambia"
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" name="isRemote" defaultChecked={opportunity?.isRemote ?? false} />
        Remote
      </label>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="deadline" className="text-sm font-medium text-ink-700">
          Deadline
        </label>
        <input
          id="deadline"
          name="deadline"
          type="datetime-local"
          defaultValue={toDateTimeInputValue(opportunity?.deadline)}
          required
          className={inputClass}
        />
        <p className="text-xs text-ink-500">
          This listing disappears from the public page automatically once this passes — see
          CLAUDE.md §5.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="applyUrl" className="text-sm font-medium text-ink-700">
          Apply link
        </label>
        <input
          id="applyUrl"
          name="applyUrl"
          type="url"
          defaultValue={opportunity?.applyUrl}
          required
          maxLength={500}
          placeholder="https://…"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="eligibility" className="text-sm font-medium text-ink-700">
          Eligibility <span className="font-normal text-ink-500">(optional)</span>
        </label>
        <textarea
          id="eligibility"
          name="eligibility"
          defaultValue={opportunity?.eligibility ?? ""}
          maxLength={2000}
          rows={3}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-700">
          Cover image <span className="font-normal text-ink-500">(optional)</span>
        </span>
        <CloudinaryImageUpload
          folder="opportunities"
          fieldName="coverImage"
          altFieldName="coverAlt"
          defaultValue={opportunity?.coverImage}
          defaultAlt={opportunity?.coverAlt}
          label="Cover image"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contentStatus" className="text-sm font-medium text-ink-700">
          Publish status
        </label>
        <select
          id="contentStatus"
          name="contentStatus"
          defaultValue={opportunity?.contentStatus ?? "DRAFT"}
          className={inputClass}
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
        {/* ARCHIVED isn't offered here on purpose — see
            opportunities/actions.ts archiveOpportunity, an ADMIN-only
            action. */}
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
        {isPending ? "Saving…" : isEditing ? "Save" : "Create opportunity"}
      </button>
    </form>
  );
}
