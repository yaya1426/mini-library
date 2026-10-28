export const CAIRO_TIME_ZONE = "Africa/Cairo";
export const LOAN_PERIOD_DAYS = 14;
export const DAILY_FINE_RATE_EGP = 5;

const MS_PER_DAY = 86_400_000;
const ISO_DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

const cairoDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CAIRO_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

interface CalendarDateParts {
  year: number;
  month: number;
  day: number;
}

function extractCairoDateParts(input: Date | string): CalendarDateParts {
  if (typeof input === "string") {
    const match = ISO_DATE_ONLY_REGEX.exec(input.trim());
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const probe = new Date(Date.UTC(year, month - 1, day));
      if (
        probe.getUTCFullYear() === year &&
        probe.getUTCMonth() === month - 1 &&
        probe.getUTCDate() === day
      ) {
        return { year, month, day };
      }
      throw new RangeError(`Invalid calendar date string: "${input}"`);
    }

    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
      throw new RangeError(`Invalid date string: "${input}"`);
    }
    return extractCairoDateParts(parsed);
  }

  if (Number.isNaN(input.getTime())) {
    throw new RangeError("Invalid Date instance");
  }

  const parts = cairoDateFormatter.formatToParts(input);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  return { year, month, day };
}

function toUtcMidnightDate({ year, month, day }: CalendarDateParts): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Formats a Date or date string as YYYY-MM-DD in the Africa/Cairo time zone.
 */
export function formatCairoDate(date: Date | string): string {
  const { year, month, day } = extractCairoDateParts(date);
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Returns today's calendar date in Africa/Cairo normalized to 00:00:00.000Z.
 */
export function getCairoToday(now: Date = new Date()): Date {
  return toUtcMidnightDate(extractCairoDateParts(now));
}

/**
 * Computes the loan due date as borrow date (in Africa/Cairo) + 14 calendar days (P007).
 * Returned as a UTC midnight Date corresponding to the Cairo calendar date (for @db.Date).
 */
export function calculateDueDate(borrowedAt: Date | string): Date {
  const { year, month, day } = extractCairoDateParts(borrowedAt);
  return new Date(Date.UTC(year, month - 1, day + LOAN_PERIOD_DAYS));
}

/**
 * Computes whole calendar days late in Africa/Cairo: max(0, referenceDate - dueDate) (P009).
 */
export function calculateDaysLate(
  dueDate: Date | string,
  referenceDate: Date | string = new Date(),
): number {
  const dueUtc = toUtcMidnightDate(extractCairoDateParts(dueDate)).getTime();
  const refUtc = toUtcMidnightDate(
    extractCairoDateParts(referenceDate),
  ).getTime();
  const diffDays = Math.round((refUtc - dueUtc) / MS_PER_DAY);
  return Math.max(0, diffDays);
}

/**
 * Computes signed calendar days remaining until dueDate in Africa/Cairo:
 * dueDate - referenceDate (positive = days left, 0 = due today, negative = days overdue) (P007, P011).
 */
export function calculateDaysRemaining(
  dueDate: Date | string,
  referenceDate: Date | string = new Date(),
): number {
  const dueUtc = toUtcMidnightDate(extractCairoDateParts(dueDate)).getTime();
  const refUtc = toUtcMidnightDate(
    extractCairoDateParts(referenceDate),
  ).getTime();
  return Math.round((dueUtc - refUtc) / MS_PER_DAY);
}

/**
 * Calculates the late fine in whole Egyptian Pounds (daysLate * dailyRateEgp) (P009, T002).
 */
export function calculateFineEgp(
  daysLate: number,
  dailyRateEgp: number = DAILY_FINE_RATE_EGP,
): number {
  if (!Number.isInteger(daysLate) || daysLate < 0) {
    throw new RangeError("daysLate must be a non-negative integer");
  }
  if (!Number.isInteger(dailyRateEgp) || dailyRateEgp <= 0) {
    throw new RangeError("dailyRateEgp must be a positive integer");
  }
  if (daysLate === 0) {
    return 0;
  }
  return daysLate * dailyRateEgp;
}
