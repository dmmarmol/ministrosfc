export function formatDate(
  dateString: string,
  locale: string = "es-AR",
): string {
  return new Date(dateString).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
