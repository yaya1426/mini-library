import { CAIRO_TIME_ZONE, getCairoToday } from "@/lib/dates";
import type { Locale } from "./routing";

const ISO_DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

function toDateInstance(input: Date | string): Date {
  if (typeof input === "string") {
    const match = ISO_DATE_ONLY_REGEX.exec(input.trim());
    if (match) {
      return new Date(
        Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12),
      );
    }
    return new Date(input);
  }
  return input;
}

/**
 * Formats an integer using Western digits (0–9, `latn`) in both Arabic and English (P013, T010).
 */
export function formatInteger(value: number, locale: Locale): string {
  return new Intl.NumberFormat(`${locale}-u-nu-latn`, {
    maximumFractionDigits: 0,
  }).format(Math.trunc(value));
}

/**
 * Formats whole Egyptian Pounds as `25 ج.م` in Arabic and `25 EGP` in English
 * using Western digits (0–9, `latn`) (P009, P012, P013, T010).
 */
export function formatMoneyEgp(amountEgp: number, locale: Locale): string {
  const formattedNumber = formatInteger(amountEgp, locale);
  return locale === "ar" ? `${formattedNumber} ج.م` : `${formattedNumber} EGP`;
}

/**
 * Formats a calendar date in `Africa/Cairo` as `30 أكتوبر` in Arabic and `Oct 30` in English
 * using Western digits (`latn`), adding the year when it differs from the reference year (P013, usage.md).
 */
export function formatShortDate(
  date: Date | string,
  locale: Locale,
  referenceDate: Date = getCairoToday(),
): string {
  const target = toDateInstance(date);
  const yearFormatter = new Intl.DateTimeFormat("en-US-u-nu-latn", {
    timeZone: CAIRO_TIME_ZONE,
    year: "numeric",
  });

  const targetYear = yearFormatter.format(target);
  const currentYear = yearFormatter.format(referenceDate);
  const includeYear = targetYear !== currentYear;

  const localeTag =
    locale === "ar" ? "ar-EG-u-nu-latn" : "en-US-u-nu-latn";

  const formatter = new Intl.DateTimeFormat(localeTag, {
    timeZone: CAIRO_TIME_ZONE,
    month: locale === "ar" ? "long" : "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  });

  return formatter.format(target);
}
