export function formatDate(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
  locale: string = "es-AR",
): string {
  return new Date(dateString).toLocaleDateString(locale, options);
}
