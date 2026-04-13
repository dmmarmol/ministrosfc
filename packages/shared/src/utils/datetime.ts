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
