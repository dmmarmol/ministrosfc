export function formatDateTime(
  dateString: string,
  options: Intl.DateTimeFormatOptions,
  locale: string = "es-AR",
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
  locale: string = "es-AR",
): string {
  return formatDateTime(dateString, options, locale);
}

export function formatTime(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  },
  locale: string = "es-AR",
): string {
  return formatDateTime(dateString, options, locale);
}

/**
 * Returns an ISO 8601 datetime string with timezone offset from separate date/time fields.
 * Example: 2026-04-12 + 18:00 -> 2026-04-12T18:00:00-03:00
 */
export function toISOWithOffset(date: string, time: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const safeTime = time || "00:00";
  const dt = new Date(`${date}T${safeTime}:00`);
  const offset = -dt.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const hh = pad(Math.floor(Math.abs(offset) / 60));
  const mm = pad(Math.abs(offset) % 60);
  return `${date}T${safeTime}:00${sign}${hh}:${mm}`;
}
