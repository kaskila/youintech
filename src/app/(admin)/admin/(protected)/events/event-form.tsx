"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent, updateEvent } from "./actions";
import { eventFieldsSchema } from "@/lib/validations/event";
import type { ActionResult } from "@/lib/action-result";
import type { Event, Sector } from "@/generated/prisma/client";
import { CloudinaryImageUpload } from "@/components/admin/image-upload";

const inputClass =
  "rounded-md border border-border-strong px-3 py-2 text-ink-800 outline-none focus-visible:border-brand-700";

// Local datetime-local input value from a stored UTC DateTime — same
// shortcut used by opportunity-form.tsx's toDateTimeInputValue (a straight
// ISO slice, not adjusted for timezone).
function toDateTimeInputValue(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 16) : "";
}

export function EventForm({
  event,
  sectors,
  now,
}: {
  event?: Event;
  sectors: Sector[];
  // Passed down from the server page rather than read via Date.now() in
  // render — a component calling an impure "current time" function during
  // render is exactly what the React Compiler's purity rule (reactCompiler:
  // true) exists to catch. Same pattern as EventCard/OpportunityCard's `now`
  // prop.
  now: Date;
}) {
  const router = useRouter();
  const isEditing = Boolean(event);

  // Controlled only so the form can gate attendeeCount/recapBody on
  // "has this event actually started yet" — every other field stays
  // uncontrolled (defaultValue), matching the rest of this codebase's forms.
  const [startsAtValue, setStartsAtValue] = useState(toDateTimeInputValue(event?.startsAt));
  const hasStarted = startsAtValue !== "" && new Date(startsAtValue).getTime() <= now.getTime();

  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => {
      // Client-side pass, sharing the same schema as the server. A
      // courtesy — the Server Action re-validates authoritatively.
      const parsed = eventFieldsSchema.safeParse({
        slug: formData.get("slug"),
        title: formData.get("title"),
        summary: formData.get("summary"),
        description: formData.get("description"),
        coverImage: formData.get("coverImage") ?? "",
        coverAlt: formData.get("coverAlt") ?? "",
        startsAt: formData.get("startsAt"),
        endsAt: formData.get("endsAt") ?? "",
        venue: formData.get("venue") ?? "",
        isOnline: formData.get("isOnline") === "on",
        registrationUrl: formData.get("registrationUrl") ?? "",
        attendeeCount: formData.get("attendeeCount") ?? "",
        recapBody: formData.get("recapBody") ?? "",
        sectorId: formData.get("sectorId") ?? "",
        status: formData.get("status"),
      });
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
      }

      const result = isEditing ? await updateEvent(formData) : await createEvent(formData);
      if (result.ok && !isEditing) {
        router.push("/admin/events");
      }
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {event ? <input type="hidden" name="id" value={event.id} /> : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-ink-700">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={event?.title}
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
          defaultValue={event?.slug}
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
          defaultValue={event?.summary}
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
          defaultValue={event?.description}
          required
          maxLength={10000}
          rows={8}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="startsAt" className="text-sm font-medium text-ink-700">
            Starts
          </label>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            value={startsAtValue}
            onChange={(changeEvent) => setStartsAtValue(changeEvent.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="endsAt" className="text-sm font-medium text-ink-700">
            Ends <span className="font-normal text-ink-500">(optional)</span>
          </label>
          <input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            defaultValue={toDateTimeInputValue(event?.endsAt ?? null)}
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input id="isOnline" type="checkbox" name="isOnline" defaultChecked={event?.isOnline ?? false} />
        Online event
      </label>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="venue" className="text-sm font-medium text-ink-700">
          Venue{" "}
          <span className="font-normal text-ink-500">
            (required unless the event is marked Online above)
          </span>
        </label>
        <input
          id="venue"
          name="venue"
          defaultValue={event?.venue ?? ""}
          maxLength={200}
          placeholder="e.g. UNZA Great East Road Campus, Lusaka"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="registrationUrl" className="text-sm font-medium text-ink-700">
          Registration link <span className="font-normal text-ink-500">(optional)</span>
        </label>
        <input
          id="registrationUrl"
          name="registrationUrl"
          type="url"
          defaultValue={event?.registrationUrl ?? ""}
          maxLength={500}
          placeholder="https://…"
          className={inputClass}
        />
        <p className="text-xs text-ink-500">
          Shown as a &quot;Register&quot; button on upcoming events only. Leave blank and no button
          is shown.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sectorId" className="text-sm font-medium text-ink-700">
          Sector <span className="font-normal text-ink-500">(optional)</span>
        </label>
        <select
          id="sectorId"
          name="sectorId"
          defaultValue={event?.sectorId ?? ""}
          className={inputClass}
        >
          <option value="">— None —</option>
          {sectors.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-700">
          Cover image <span className="font-normal text-ink-500">(optional)</span>
        </span>
        <CloudinaryImageUpload
          folder="events"
          fieldName="coverImage"
          altFieldName="coverAlt"
          defaultValue={event?.coverImage}
          defaultAlt={event?.coverAlt}
          label="Cover image"
        />
      </div>

      <fieldset className="flex flex-col gap-3 rounded-card border border-border p-4">
        <legend className="px-1 text-sm font-medium text-ink-700">
          Post-event evidence <span className="font-normal text-ink-500">(this is what funders read)</span>
        </legend>

        {!hasStarted ? (
          <p className="text-xs text-ink-500">
            Set the start date and time above to a moment in the past to unlock these — they make
            no sense before the event has actually happened.
          </p>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="attendeeCount" className="text-sm font-medium text-ink-700">
            Attendee count <span className="font-normal text-ink-500">(optional)</span>
          </label>
          <input
            id="attendeeCount"
            name="attendeeCount"
            type="number"
            min={0}
            max={1000000}
            disabled={!hasStarted}
            defaultValue={event?.attendeeCount ?? ""}
            className={`${inputClass} disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-ink-400`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="recapBody" className="text-sm font-medium text-ink-700">
            Recap <span className="font-normal text-ink-500">(optional)</span>
          </label>
          <textarea
            id="recapBody"
            name="recapBody"
            disabled={!hasStarted}
            defaultValue={event?.recapBody ?? ""}
            maxLength={10000}
            rows={6}
            className={`${inputClass} disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-ink-400`}
          />
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="status" className="text-sm font-medium text-ink-700">
          Publish status
        </label>
        <select id="status" name="status" defaultValue={event?.status ?? "DRAFT"} className={inputClass}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
        {/* ARCHIVED isn't offered here on purpose — see events/actions.ts
            archiveEvent, an ADMIN-only action. */}
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
        {isPending ? "Saving…" : isEditing ? "Save" : "Create event"}
      </button>
    </form>
  );
}
