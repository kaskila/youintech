import { z } from "zod";
import { InquiryCategory, InquiryStatus } from "@/generated/prisma/enums";

// Shared between the client form (pre-submit validation, a courtesy) and the
// Server Action (the actual control). See CLAUDE.md §6/§7.

export const INQUIRY_CATEGORY_LABELS: Record<InquiryCategory, string> = {
  VOLUNTEER: "Volunteer as a Frontliner",
  PARTNER: "Partner with us",
  SUPPORT: "Support our work",
  GENERAL: "General enquiry",
};

// Query-param spelling used by the home page "Get Involved" cards
// (?category=volunteer) — lowercase, human-typeable, decoupled from the
// enum's on-the-wire casing.
export const INQUIRY_CATEGORY_PARAMS: Record<string, InquiryCategory> = {
  volunteer: InquiryCategory.VOLUNTEER,
  partner: InquiryCategory.PARTNER,
  support: InquiryCategory.SUPPORT,
  general: InquiryCategory.GENERAL,
};

// Bump when /privacy publishes a new version. Never overwrite a published
// version — see Inquiry.privacyPolicyVersion in schema.prisma. There is no
// /privacy page yet (see footer TODO), so this is a placeholder version tag
// until that page ships.
export const CURRENT_PRIVACY_POLICY_VERSION = "2026-08-25-draft";

export const inquiryFieldsSchema = z.object({
  category: z.enum(InquiryCategory, "Choose what this is about."),
  name: z.string().trim().min(1, "Name is required.").max(200),
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  phone: z.string().trim().max(30),
  organisation: z.string().trim().max(200),
  message: z.string().trim().min(1, "Message is required.").max(5000),
  consent: z
    .boolean()
    .refine((value) => value === true, "You must agree before we can process this."),
});

export type InquiryFields = z.infer<typeof inquiryFieldsSchema>;

export const inquiryStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(InquiryStatus, "Invalid status."),
});

export type InquiryStatusInput = z.infer<typeof inquiryStatusSchema>;
