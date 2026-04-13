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
