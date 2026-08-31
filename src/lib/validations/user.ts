import { z } from "zod";
import { Role } from "@/generated/prisma/enums";

// Shared between the client forms (pre-submit courtesy) and the Server
// Actions (the actual control). See CLAUDE.md §6/§7.

// Only ADMIN and EDITOR are assignable. Role is a two-value enum today, but
// spelling the choices out means a future third role isn't silently grantable
// through this form before anyone's decided it should be.
const ASSIGNABLE_ROLES = [Role.ADMIN, Role.EDITOR] as const;

export const userCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .max(200)
    .pipe(z.email("Enter a valid email address."))
    .transform((value) => value.toLowerCase()),
  role: z.enum(ASSIGNABLE_ROLES, "Choose a role."),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userIdSchema = z.object({
  id: z.string().min(1),
});

export const userRoleChangeSchema = z.object({
  id: z.string().min(1),
  role: z.enum(ASSIGNABLE_ROLES, "Choose a role."),
});

export type UserRoleChangeInput = z.infer<typeof userRoleChangeSchema>;

// Minimum 12 matches Better Auth's minPasswordLength (lib/auth.ts). The
// "must differ from the current password" rule needs the stored hash, so it
// lives in the action (see isCurrentPassword), not here.
export const changePasswordSchema = z
  .object({
    newPassword: z.string().min(12, "Use at least 12 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "The two passwords don't match.",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
