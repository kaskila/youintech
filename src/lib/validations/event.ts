import { z } from "zod";
import { ContentStatus } from "@/generated/prisma/enums";

// Shared between the client form (pre-submit validation, a courtesy) and the
// Server Action (the actual control). See CLAUDE.md §6/§7.

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Archiving is its own ADMIN-only action (see eventArchiveSchema) — the
// general create/edit form open to any staff member can only choose these
// two. Same pattern as programme.ts / opportunity.ts.
const EDITABLE_STATUS_VALUES = [ContentStatus.DRAFT, ContentStatus.PUBLISHED] as const;

const requiredDateTimeSchema = z
  .string()
  .trim()
  .min(1, "Date and time are required.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date and time.")
  .transform((value) => new Date(value));

const optionalDateTimeSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), "Enter a valid date and time.")
  .transform((value) => (value === "" ? null : new Date(value)));

// Blank input → null (not yet counted), never 0 — a 0 is a real, reported
// figure ("nobody showed"), not the same thing as "not entered yet."
const attendeeCountSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || (/^\d+$/.test(value) && Number(value) <= 1_000_000),
    "Enter a whole number."
  )
  .transform((value) => (value === "" ? null : Number(value)));

const eventFieldsShape = {
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(100)
    .regex(slugPattern, "Lowercase letters, numbers, and hyphens only."),
  title: z.string().trim().min(1, "Title is required.").max(200),
  summary: z
    .string()
    .trim()
    .min(1, "Summary is required.")
    .max(200, "Keep it to about 200 characters — it's the one-line pitch."),
  description: z.string().trim().min(1, "Description is required.").max(10000),
  coverImage: z.string().trim().max(500),
  coverAlt: z.string().trim().max(300),
  startsAt: requiredDateTimeSchema,
  endsAt: optionalDateTimeSchema,
  venue: z.string().trim().max(200),
  isOnline: z.boolean(),
  registrationUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) => value === "" || /^https?:\/\//i.test(value),
      "Must be a full http:// or https:// link."
    ),
  // Post-event evidence — see the Event model comment in schema.prisma.
  // Structurally optional here; WHEN they may be set (only once the event
  // has started) is a business rule enforced in the Server Action, not
  // expressible as a check on this field alone. See events/actions.ts.
  attendeeCount: attendeeCountSchema,
  recapBody: z.string().trim().max(10000),
  sectorId: z.string().trim().max(100),
  status: z.enum(EDITABLE_STATUS_VALUES, "Choose a status."),
};

function endsAtAfterStartsAt(data: { startsAt: Date; endsAt: Date | null }) {
  return data.endsAt === null || data.endsAt.getTime() > data.startsAt.getTime();
}

function venueRequiredUnlessOnline(data: { isOnline: boolean; venue: string }) {
  return data.isOnline || data.venue.trim().length > 0;
}

export const eventFieldsSchema = z
  .object(eventFieldsShape)
  .refine(endsAtAfterStartsAt, { message: "End time must be after the start time.", path: ["endsAt"] })
  .refine(venueRequiredUnlessOnline, {
    message: "Venue is required for in-person events — set Online instead if there isn't one.",
    path: ["venue"],
  });

export const eventUpdateSchema = z
  .object({ ...eventFieldsShape, id: z.string().min(1) })
  .refine(endsAtAfterStartsAt, { message: "End time must be after the start time.", path: ["endsAt"] })
  .refine(venueRequiredUnlessOnline, {
    message: "Venue is required for in-person events — set Online instead if there isn't one.",
    path: ["venue"],
  });

export type EventFields = z.infer<typeof eventFieldsSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;

export const eventArchiveSchema = z.object({
  id: z.string().min(1),
});

export type EventArchiveInput = z.infer<typeof eventArchiveSchema>;
