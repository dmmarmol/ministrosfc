import { DEFAULT_DATE_LOCALE } from "../constants";

export function formatDateTime(
  dateString: string,
  options: Intl.DateTimeFormatOptions,
  locale: string = DEFAULT_DATE_LOCALE,
): string {
  // Date-only strings (YYYY-MM-DD) are parsed as UTC midnight by the Date constructor.
  // Appending T00:00:00 makes them local-midnight instead, preventing an off-by-one day
  // in UTC-negative timezones (e.g. Argentina UTC-3).
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? dateString + "T00:00:00"
    : dateString;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(locale, options);
}

export function formatDate(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
  locale: string = DEFAULT_DATE_LOCALE,
): string {
  return formatDateTime(dateString, options, locale);
}

export function formatTime(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  },
  locale: string = DEFAULT_DATE_LOCALE,
): string {
  return formatDateTime(dateString, options, locale);
}

const HAS_TIMEZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Splits an ISO datetime into the local calendar date and clock time that
 * date/time inputs should display. Values carrying a timezone (e.g. the API's
 * "...Z") are converted to the browser's local time so that re-submitting the
 * form through `toISOWithOffset` round-trips without shifting the instant.
 * Naive values ("2026-03-28T14:00:00") are returned as written.
 */
function toLocalInputParts(
  value?: string | null,
): { date: string; time: string } {
  if (!value) return { date: "", time: "" };
  if (value.includes("T") && HAS_TIMEZONE.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return {
        date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
        time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
      };
    }
  }
  const [date = "", time = ""] = value.split("T");
  return { date, time: time.slice(0, 5) };
}

export const formatDateInput = (value?: string | null) =>
  toLocalInputParts(value).date;

export const formatTimeInput = (value?: string | null) =>
  toLocalInputParts(value).time;

/**
 * Merges a date picker value (YYYY-MM-DD) and a time picker value (HH:mm)
 * into a full ISO 8601 datetime string with the browser's local UTC offset
 * (e.g. "2026-03-28T14:00:00-03:00"). This format is required by the API's
 * z.string().datetime({ offset: true }) validation. If no time is provided,
 * midnight (00:00) is used as the default.
 *
 * Returns an ISO 8601 datetime string with timezone offset from separate date/time fields.
 * Example: 2026-04-12 + 18:00 -> 2026-04-12T18:00:00-03:00
 */
export function toISOWithOffset(date: string, time?: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const safeTime = time || "00:00";
  const dt = new Date(`${date}T${safeTime}:00`);
  const offset = -dt.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const hh = pad(Math.floor(Math.abs(offset) / 60));
  const mm = pad(Math.abs(offset) % 60);
  return `${date}T${safeTime}:00${sign}${hh}:${mm}`;
}
