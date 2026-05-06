export function getSortedIcon(sortDirection: "asc" | "desc" | null): string {
  return sortDirection
    ? sortDirection === "asc"
      ? "i-lucide-arrow-up-narrow-wide"
      : "i-lucide-arrow-down-wide-narrow"
    : "i-lucide-arrow-up-down";
}
