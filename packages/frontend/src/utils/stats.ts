/**
 * Formats a date string as MM/YY for use in stats tables.
 * Mirrors the UTC-safe normalization from @ministrosfc/shared's formatDateTime.
 */
export function formatStatDate(dateString: string): string {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? `${dateString}T00:00:00`
    : dateString;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

// Shared tournament date formatter used across admin and card views to avoid duplicated component-local logic.
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start) return "";

  const s = new Date(start).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  if (!end) return `Since ${s}`;

  const e = new Date(end).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return `${s} – ${e}`;
}
