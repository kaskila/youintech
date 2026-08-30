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
// version — see Inquiry.privacyPolicyVersion in schema.prisma. MUST match
// the "Version" heading on /privacy exactly — that page's whole point is
// to be the real document this field has, until now, only claimed to cite.
export const CURRENT_PRIVACY_POLICY_VERSION = "2026-08";

// Same fixed set as Application.ageBracket — a bracket, never a date of
// birth. "16-17" is the only bracket below 18 in this set, so it's what
// the guardian-consent check below keys off.
export const AGE_BRACKETS = ["16-17", "18-24", "25-35", "35+"] as const;
export const UNDER_18_BRACKET: (typeof AGE_BRACKETS)[number] = "16-17";

const emailPattern = z.string().trim().email();

export const inquiryFieldsSchema = z
  .object({
    category: z.enum(InquiryCategory, "Choose what this is about."),
    name: z.string().trim().min(1, "Name is required.").max(200),
    email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
    phone: z.string().trim().max(30),
    organisation: z.string().trim().max(200),
    message: z.string().trim().min(1, "Message is required.").max(5000),
    ageBracket: z.enum(AGE_BRACKETS, "Choose your age range."),
    guardianName: z.string().trim().max(200),
    guardianEmail: z.string().trim().max(320),
    guardianConsent: z.boolean(),
    consent: z
      .boolean()
      .refine((value) => value === true, "You must agree before we can process this."),
  })
  // Safeguarding: under-18 requires all three guardian fields. This is the
  // actual control (CLAUDE.md §7) — the contact form only shows/requires
  // these fields client-side as a courtesy; this check is what a raw POST
  // skipping the form's UI still has to pass.
  .superRefine((data, ctx) => {
    if (data.ageBracket !== UNDER_18_BRACKET) return;

    if (!data.guardianName) {
      ctx.addIssue({
        code: "custom",
        path: ["guardianName"],
        message: "Guardian name is required for under-18 submissions.",
      });
    }
    if (!data.guardianEmail) {
      ctx.addIssue({
        code: "custom",
        path: ["guardianEmail"],
        message: "Guardian email is required for under-18 submissions.",
      });
    } else if (!emailPattern.safeParse(data.guardianEmail).success) {
      ctx.addIssue({
        code: "custom",
        path: ["guardianEmail"],
        message: "Enter a valid guardian email address.",
      });
    }
    if (!data.guardianConsent) {
      ctx.addIssue({
        code: "custom",
        path: ["guardianConsent"],
        message: "Guardian consent is required for under-18 submissions.",
      });
    }
  });

export type InquiryFields = z.infer<typeof inquiryFieldsSchema>;

export const inquiryStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(InquiryStatus, "Invalid status."),
});

export type InquiryStatusInput = z.infer<typeof inquiryStatusSchema>;
