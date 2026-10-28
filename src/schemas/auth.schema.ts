import { z } from "zod";

export const AUTH_VALIDATION_KEYS = {
  fullNameRequired: "auth.validation.fullNameRequired",
  emailInvalid: "auth.validation.emailInvalid",
  passwordMin: "auth.validation.passwordMin",
  passwordRequired: "auth.validation.passwordRequired",
} as const;

export const signUpSchema = z.object({
  fullName: z
    .string({ error: AUTH_VALIDATION_KEYS.fullNameRequired })
    .trim()
    .min(1, AUTH_VALIDATION_KEYS.fullNameRequired),
  email: z
    .string({ error: AUTH_VALIDATION_KEYS.emailInvalid })
    .trim()
    .toLowerCase()
    .email(AUTH_VALIDATION_KEYS.emailInvalid),
  password: z
    .string({ error: AUTH_VALIDATION_KEYS.passwordMin })
    .min(8, AUTH_VALIDATION_KEYS.passwordMin),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z
    .string({ error: AUTH_VALIDATION_KEYS.emailInvalid })
    .trim()
    .toLowerCase()
    .email(AUTH_VALIDATION_KEYS.emailInvalid),
  password: z
    .string({ error: AUTH_VALIDATION_KEYS.passwordRequired })
    .min(1, AUTH_VALIDATION_KEYS.passwordRequired),
});

export type LoginInput = z.infer<typeof loginSchema>;
