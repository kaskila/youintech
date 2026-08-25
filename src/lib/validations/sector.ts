import { z } from "zod";

// Shared between the client form (pre-submit validation, a courtesy) and the
// Server Action (the actual control). See CLAUDE.md §6/§7.

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const sectorFieldsSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(100)
    .regex(slugPattern, "Lowercase letters, numbers, and hyphens only."),
  tagline: z.string().trim().max(300, "Keep it to one line."),
  description: z.string().trim().max(5000),
  icon: z.string().trim().max(100),
  displayOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});

export const sectorUpdateSchema = sectorFieldsSchema.extend({
  id: z.string().min(1),
});

export type SectorFields = z.infer<typeof sectorFieldsSchema>;
export type SectorUpdateInput = z.infer<typeof sectorUpdateSchema>;

export const sectorMoveSchema = z.object({
  id: z.string().min(1),
  direction: z.enum(["up", "down"]),
});

export type SectorMoveInput = z.infer<typeof sectorMoveSchema>;
