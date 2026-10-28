"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { ZodIssue } from "zod";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/routing";
import {
  type ActionFailure,
  type FieldErrors,
  isDomainError,
} from "@/lib/errors";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import { loginSchema, signUpSchema } from "@/schemas/auth.schema";
import * as authService from "@/services/auth.service";

export type AuthActionState = ActionFailure | null;

function mapZodIssuesToFieldErrors(issues: ZodIssue[]): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of issues) {
    const fieldName = issue.path[0];
    if (typeof fieldName === "string") {
      if (!fieldErrors[fieldName]) {
        fieldErrors[fieldName] = [];
      }
      fieldErrors[fieldName].push(issue.message);
    }
  }
  return fieldErrors;
}

async function resolveCurrentLocale(formData?: FormData): Promise<Locale> {
  const rawFormLocale = formData?.get("locale");
  if (typeof rawFormLocale === "string" && isLocale(rawFormLocale)) {
    return rawFormLocale;
  }

  try {
    const locale = await getLocale();
    if (isLocale(locale)) {
      return locale;
    }
  } catch {
    // Fallback to default locale if called outside request locale context
  }

  return DEFAULT_LOCALE;
}

export async function sanitizeCallbackUrl(
  rawCallbackUrl: string | null | undefined,
  locale: Locale,
): Promise<string> {
  const fallback = `/${locale}/books`;
  if (!rawCallbackUrl || typeof rawCallbackUrl !== "string") {
    return fallback;
  }

  const trimmed = rawCallbackUrl.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  // Avoid redirecting back to login/signup after authentication
  if (
    /^\/(ar|en)\/(login|signup)(\/|$|\?)/.test(trimmed) ||
    /^\/(login|signup)(\/|$|\?)/.test(trimmed)
  ) {
    return fallback;
  }

  if (/^\/(ar|en)(\/|$|\?)/.test(trimmed)) {
    return trimmed;
  }

  return `/${locale}${trimmed}`;
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const locale = await resolveCurrentLocale(formData);

  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "VALIDATION_ERROR",
      fieldErrors: mapZodIssuesToFieldErrors(parsed.error.issues),
    };
  }

  try {
    const user = await authService.registerMember(parsed.data);
    await setSessionCookie(user);
  } catch (error) {
    if (isDomainError(error)) {
      return {
        ok: false,
        error: error.code,
      };
    }
    throw error;
  }

  redirect(`/${locale}/books`);
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const locale = await resolveCurrentLocale(formData);
  const rawCallbackUrl = formData.get("callbackUrl");

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "VALIDATION_ERROR",
      fieldErrors: mapZodIssuesToFieldErrors(parsed.error.issues),
    };
  }

  try {
    const user = await authService.authenticateUser(parsed.data);
    await setSessionCookie(user);
  } catch (error) {
    if (isDomainError(error)) {
      return {
        ok: false,
        error: error.code,
      };
    }
    throw error;
  }

  const targetUrl = await sanitizeCallbackUrl(
    typeof rawCallbackUrl === "string" ? rawCallbackUrl : null,
    locale,
  );
  redirect(targetUrl);
}

export async function logoutAction(formData?: FormData): Promise<never> {
  const locale = await resolveCurrentLocale(formData);
  await clearSessionCookie();
  redirect(`/${locale}/login`);
}
