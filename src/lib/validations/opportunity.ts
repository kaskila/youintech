import { z } from "zod";
import { OpportunityType, ContentStatus } from "@/generated/prisma/enums";

// Shared between the client form (pre-submit validation, a courtesy) and the
// Server Action (the actual control). See CLAUDE.md §6/§7.

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Archiving is its own ADMIN-only action (see opportunityArchiveSchema) —
// the general create/edit form open to any staff member can only choose
// these two. Same pattern as programme.ts.
const EDITABLE_CONTENT_STATUS_VALUES = [ContentStatus.DRAFT, ContentStatus.PUBLISHED] as const;

// Base rule: a real, parseable date. NOT "must be in the future" — that
// only applies on create (see futureDeadlineSchema below). Editing a
// listing after its deadline has passed — to fix a typo before archiving
// it, say — must still be possible.
const deadlineSchema = z
  .string()
  .trim()
  .min(1, "Deadline is required.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date.")
  .transform((value) => new Date(value));

// The create-only rule the task was approved on: Zod rejects a past
// deadline on create. See prisma/schema.prisma Opportunity model comment.
const futureDeadlineSchema = deadlineSchema.refine(
  (date) => date.getTime() > Date.now(),
  "Deadline must be in the future."
);

export const opportunityFieldsSchema = z.object({
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
  description: z.string().trim().max(10000),
  organisation: z.string().trim().min(1, "Organisation is required.").max(200),
  type: z.enum(OpportunityType, "Choose a type."),
  location: z.string().trim().max(200),
  isRemote: z.boolean(),
  deadline: deadlineSchema,
  applyUrl: z
    .string()
    .trim()
    .min(1, "Apply link is required.")
    .refine((value) => /^https?:\/\//i.test(value), "Must be a full http:// or https:// link."),
  eligibility: z.string().trim().max(2000),
  sectorId: z.string().trim().max(100),
  coverImage: z.string().trim().max(500),
  coverAlt: z.string().trim().max(300),
  contentStatus: z.enum(EDITABLE_CONTENT_STATUS_VALUES, "Choose a status."),
});

export const opportunityCreateSchema = opportunityFieldsSchema.extend({
  deadline: futureDeadlineSchema,
});

export const opportunityUpdateSchema = opportunityFieldsSchema.extend({
  id: z.string().min(1),
});

export type OpportunityFields = z.infer<typeof opportunityFieldsSchema>;
export type OpportunityCreateInput = z.infer<typeof opportunityCreateSchema>;
export type OpportunityUpdateInput = z.infer<typeof opportunityUpdateSchema>;

export const opportunityArchiveSchema = z.object({
  id: z.string().min(1),
});

export type OpportunityArchiveInput = z.infer<typeof opportunityArchiveSchema>;
