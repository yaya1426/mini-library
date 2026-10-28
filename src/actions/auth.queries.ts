import "server-only";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/routing";
import { getSessionUser, type SessionUser } from "@/lib/session";

async function getActiveLocale(): Promise<Locale> {
  try {
    const locale = await getLocale();
    if (isLocale(locale)) {
      return locale;
    }
  } catch {
    // Fallback
  }
  return DEFAULT_LOCALE;
}

export async function getCurrentUserQuery(): Promise<SessionUser | null> {
  return getSessionUser();
}

export async function requireAuthenticatedPageUser(
  callbackPathname: string,
): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const locale = await getActiveLocale();
    const normalizedCallback = callbackPathname.startsWith("/")
      ? callbackPathname
      : `/${locale}/${callbackPathname}`;
    redirect(
      `/${locale}/login?callbackUrl=${encodeURIComponent(normalizedCallback)}`,
    );
  }
  return user;
}

export async function requireLibrarianPageUser(
  callbackPathname = "/admin",
): Promise<SessionUser> {
  const locale = await getActiveLocale();
  const normalizedCallback = callbackPathname.startsWith("/")
    ? callbackPathname
    : `/${locale}${callbackPathname}`;
  const user = await requireAuthenticatedPageUser(normalizedCallback);
  if (user.role !== "LIBRARIAN") {
    redirect(`/${locale}/books`);
  }
  return user;
}
