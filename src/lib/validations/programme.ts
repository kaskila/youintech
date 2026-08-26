import { z } from "zod";
import { ProgrammeStatus, ContentStatus } from "@/generated/prisma/enums";

// Shared between the client form (pre-submit validation, a courtesy) and the
// Server Action (the actual control). See CLAUDE.md §6/§7.

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Archiving is its own ADMIN-only action (see programmeArchiveSchema) — the
// general create/edit form open to any staff member can only choose these
// two. ARCHIVED is reachable only through that dedicated action.
const EDITABLE_CONTENT_STATUS_VALUES = [ContentStatus.DRAFT, ContentStatus.PUBLISHED] as const;

export const programmeFieldsSchema = z.object({
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
  coverImage: z.string().trim().max(300),
  coverAlt: z.string().trim().max(300),
  icon: z.string().trim().min(1, "Icon is required.").max(100),
  status: z.enum(ProgrammeStatus, "Choose a status."),
  isFlagship: z.boolean(),
  applicationsOpen: z.boolean(),
  applicationUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) => value === "" || /^https?:\/\//i.test(value),
      "Must be a full http:// or https:// link."
    ),
  targetDate: z
    .string()
    .trim()
    .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), "Enter a valid date.")
    .transform((value) => (value === "" ? null : new Date(value))),
  displayOrder: z.coerce.number().int().min(0).max(999),
  contentStatus: z.enum(EDITABLE_CONTENT_STATUS_VALUES, "Choose a status."),
});

export const programmeUpdateSchema = programmeFieldsSchema.extend({
  id: z.string().min(1),
});

export type ProgrammeFields = z.infer<typeof programmeFieldsSchema>;
export type ProgrammeUpdateInput = z.infer<typeof programmeUpdateSchema>;

export const programmeArchiveSchema = z.object({
  id: z.string().min(1),
});

export type ProgrammeArchiveInput = z.infer<typeof programmeArchiveSchema>;
