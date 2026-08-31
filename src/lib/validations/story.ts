import { z } from "zod";
import { ContentStatus } from "@/generated/prisma/enums";

// Shared between the client form (pre-submit validation, a courtesy) and the
// Server Action (the actual control). See CLAUDE.md §6/§7.
//
// "Story" is the product name for a Post — people-focused pieces about young
// Zambians using technology. The model is still `Post` (schema.prisma §5).

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Archiving is its own ADMIN-only action (see storyArchiveSchema) — the
// general create/edit form open to any staff member can only choose these
// two. Same pattern as programme.ts / event.ts.
const EDITABLE_STATUS_VALUES = [ContentStatus.DRAFT, ContentStatus.PUBLISHED] as const;

// 200 exactly — the form shows a live counter against this same number, and
// the excerpt feeds cards, SEO descriptions, and OG tags where anything
// longer is truncated anyway.
export const EXCERPT_MAX = 200;

const storyFieldsShape = {
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(100)
    .regex(slugPattern, "Lowercase letters, numbers, and hyphens only."),
  title: z.string().trim().min(1, "Title is required.").max(200),
  excerpt: z
    .string()
    .trim()
    .min(1, "Excerpt is required.")
    .max(EXCERPT_MAX, `Keep the excerpt to ${EXCERPT_MAX} characters or fewer.`),
  body: z.string().trim().min(1, "Body is required.").max(50_000),
  coverImage: z.string().trim().max(500),
  coverAlt: z.string().trim().max(300),
  sectorId: z.string().trim().max(100),
  status: z.enum(EDITABLE_STATUS_VALUES, "Choose a status."),
};

export const storyFieldsSchema = z.object(storyFieldsShape);

export const storyUpdateSchema = z.object({
  ...storyFieldsShape,
  id: z.string().min(1),
});

export type StoryFields = z.infer<typeof storyFieldsSchema>;
export type StoryUpdateInput = z.infer<typeof storyUpdateSchema>;

export const storyArchiveSchema = z.object({
  id: z.string().min(1),
});

export type StoryArchiveInput = z.infer<typeof storyArchiveSchema>;
