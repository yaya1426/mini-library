import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { DEFAULT_LOCALE, isLocale, type Locale, routing } from "@/i18n/routing";
import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

const handleI18nRouting = createMiddleware(routing);

const PROTECTED_SEGMENTS = ["books", "loans", "admin"] as const;

function parseLocaleAndSegment(pathname: string): {
  locale: Locale;
  firstSegment: string | null;
} {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length > 0 && isLocale(parts[0])) {
    return {
      locale: parts[0],
      firstSegment: parts[1] ?? null,
    };
  }
  return {
    locale: DEFAULT_LOCALE,
    firstSegment: parts[0] ?? null,
  };
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { locale, firstSegment } = parseLocaleAndSegment(pathname);

  const isProtectedRoute =
    firstSegment !== null &&
    (PROTECTED_SEGMENTS as readonly string[]).includes(firstSegment);

  if (isProtectedRoute) {
    const hasSessionCookie = Boolean(
      request.cookies.get(SESSION_COOKIE_NAME)?.value,
    );

    if (!hasSessionCookie) {
      const localizedPath = pathname.startsWith(`/${locale}`)
        ? `${pathname}${search}`
        : `/${locale}${pathname}${search}`;
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("callbackUrl", localizedPath);
      return NextResponse.redirect(loginUrl);
    }
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
