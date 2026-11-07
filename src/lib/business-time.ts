/**
 * SunTech POS — Business Time & Dhaka Calendar Utilities (R1, R2)
 *
 * All business operations, calendar dates, shift boundaries, and receipts
 * are anchored in Asia/Dhaka (+06:00), independent of host/browser timezone.
 */

export const BUSINESS_TIME_ZONE = "Asia/Dhaka";
export const DHAKA_OFFSET_HOURS = 6;
export const DHAKA_OFFSET_MS = DHAKA_OFFSET_HOURS * 60 * 60 * 1000;

const ISO_WITH_OFFSET_REGEX =
  /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Validates whether year, month, and day (or a YYYY-MM-DD string) represent a real calendar date (handles leap years, etc.).
 */
export function isValidCalendarDate(
  yearOrStr: number | string,
  month?: number,
  day?: number,
): boolean {
  if (typeof yearOrStr === "string") {
    const trimmed = yearOrStr.trim();
    const match = DATE_ONLY_REGEX.exec(trimmed);
    if (!match) return false;
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const d = parseInt(match[3], 10);
    return isValidCalendarDate(y, m, d);
  }
  if (month === undefined || day === undefined) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const daysInMonth = new Date(Date.UTC(yearOrStr, month, 0)).getUTCDate();
  return day <= daysInMonth;
}

/**
 * Parses an ISO 8601 string requiring an explicit timezone offset (Z or ±HH:MM).
 * Rejects timezone-free naive datetime strings to prevent host-timezone leakage.
 */
export function parseStrictEventInstant(value: unknown): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || !ISO_WITH_OFFSET_REGEX.test(trimmed)) return null;

  // Extract date components before Date parse to check strict calendar validity
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const d = parseInt(match[3], 10);
    if (!isValidCalendarDate(y, m, d)) return null;
  }

  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Parses a YYYY-MM-DD date string with strict calendar validation.
 */
export function parseDhakaDateString(dateStr: unknown): { year: number; month: number; day: number } | null {
  if (typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();
  const match = DATE_ONLY_REGEX.exec(trimmed);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (!isValidCalendarDate(year, month, day)) return null;
  return { year, month, day };
}

/**
 * Returns the calendar parts of an instant in the Asia/Dhaka timezone.
 */
export function getBusinessDateParts(value?: string | Date | null): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const date = value ? parseStrictEventInstant(value) : null;
  const target = date ?? new Date();

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(target);
  let year = 1970;
  let month = 1;
  let day = 1;
  let hour = 0;
  let minute = 0;
  let second = 0;

  for (const part of parts) {
    switch (part.type) {
      case "year":
        year = parseInt(part.value, 10);
        break;
      case "month":
        month = parseInt(part.value, 10);
        break;
      case "day":
        day = parseInt(part.value, 10);
        break;
      case "hour":
        hour = parseInt(part.value, 10);
        break;
      case "minute":
        minute = parseInt(part.value, 10);
        break;
      case "second":
        second = parseInt(part.value, 10);
        break;
    }
  }

  return { year, month, day, hour, minute, second };
}

/**
 * Returns the current or target business date key in YYYY-MM-DD format (Asia/Dhaka).
 */
export function formatBusinessDateKey(value?: string | Date | null): string {
  const parts = getBusinessDateParts(value);
  const y = String(parts.year).padStart(4, "0");
  const m = String(parts.month).padStart(2, "0");
  const d = String(parts.day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Formats a timestamp into a full date and time string in Asia/Dhaka.
 * e.g. "Nov 7, 2026, 04:30 PM"
 */
export function formatBusinessDateTime(
  value: string | Date | null | undefined,
  options: {
    includeSeconds?: boolean;
    dateStyle?: "short" | "medium" | "long";
    timeStyle?: "short" | "medium";
    fallback?: string;
  } = {},
): string {
  const date = parseStrictEventInstant(value);
  if (!date) return options.fallback ?? "—";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: options.dateStyle === "short" ? "numeric" : "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: options.includeSeconds ? "2-digit" : undefined,
    hour12: true,
  }).format(date);
}

/**
 * Formats a timestamp as a date-only string in Asia/Dhaka.
 * e.g. "Nov 7, 2026"
 */
export function formatBusinessDate(
  value: string | Date | null | undefined,
  options: {
    format?: "short" | "medium" | "long";
    fallback?: string;
  } = {},
): string {
  const date = parseStrictEventInstant(value);
  if (!date) return options.fallback ?? "—";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: options.format === "short" ? "numeric" : options.format === "long" ? "long" : "short",
    day: "numeric",
  }).format(date);
}

/**
 * Formats a timestamp as time-only in Asia/Dhaka.
 * e.g. "04:30 PM" or "04:30:15 PM"
 */
export function formatBusinessTime(
  value: string | Date | null | undefined,
  options: {
    includeSeconds?: boolean;
    fallback?: string;
  } = {},
): string {
  const date = parseStrictEventInstant(value);
  if (!date) return options.fallback ?? "—";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    second: options.includeSeconds ? "2-digit" : undefined,
    hour12: true,
  }).format(date);
}

/**
 * Formats integer year and month into human-readable salary period (e.g. "November 2026").
 */
export function formatSalaryPeriod(year: number, month: number): string {
  if (!isValidCalendarDate(year, month, 1)) return "—";
  // Anchor to month midpoint in UTC
  const d = new Date(Date.UTC(year, month - 1, 15));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/**
 * Converts a YYYY-MM-DD date range to UTC half-open boundary ISO strings for API queries.
 * [startInclusive, endExclusive) where day begins at 00:00:00+06:00 and next day begins at 00:00:00+06:00.
 *
 * Example: 2026-11-07 to 2026-11-07
 * startInclusive: 2026-11-06T18:00:00.000Z
 * endExclusive:   2026-11-07T18:00:00.000Z
 */
export function businessDateRangeToUtc(
  fromDateStr: string,
  toDateStr: string,
): { startInclusive: string; endExclusive: string } {
  const startParts = parseDhakaDateString(fromDateStr);
  const endParts = parseDhakaDateString(toDateStr);

  if (!startParts || !endParts) {
    throw new Error(`Invalid business date range: from="${fromDateStr}", to="${toDateStr}"`);
  }

  // start = fromDate 00:00:00 in Dhaka (subtract 6 hours for UTC)
  const startUtc = new Date(
    Date.UTC(startParts.year, startParts.month - 1, startParts.day, 0, 0, 0) - DHAKA_OFFSET_MS,
  );

  // end = toDate + 1 day 00:00:00 in Dhaka (subtract 6 hours for UTC)
  const endUtc = new Date(
    Date.UTC(endParts.year, endParts.month - 1, endParts.day + 1, 0, 0, 0) - DHAKA_OFFSET_MS,
  );

  if (startUtc.getTime() >= endUtc.getTime()) {
    throw new Error(`Invalid date range: from="${fromDateStr}" must be on or before to="${toDateStr}"`);
  }

  return {
    startInclusive: startUtc.toISOString(),
    endExclusive: endUtc.toISOString(),
  };
}

/**
 * Converts a YYYY-MM-DD range to inclusive UTC timestamps for the current Audit Logs API contract.
 * Audit API contract uses `to` inclusive (endExclusive - 1 millisecond = 17:59:59.999Z).
 */
export function businessDateRangeToAuditUtc(
  fromDateStr: string,
  toDateStr: string,
): { from: string; to: string } {
  const { startInclusive, endExclusive } = businessDateRangeToUtc(fromDateStr, toDateStr);
  const endInclusive = new Date(new Date(endExclusive).getTime() - 1);
  return {
    from: startInclusive,
    to: endInclusive.toISOString(),
  };
}
