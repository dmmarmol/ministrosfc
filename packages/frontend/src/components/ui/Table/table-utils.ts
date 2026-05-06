import { h, type VNode } from "vue";
import { NuxtLink } from "#components";

export function getSortedIcon(sortDirection: "asc" | "desc" | null): string {
  if (sortDirection === "asc") {
    return "i-lucide-arrow-up-narrow-wide";
  }
  if (sortDirection === "desc") {
    return "i-lucide-arrow-down-wide-narrow";
  }

  return "i-lucide-arrow-up-down";
}

// ── Shared cell render factories ──────────────────────────────────────────────

/** Wins: green text */
export function cellWins(value: number): VNode {
  return h("span", { class: "text-green-600" }, String(value));
}

/** Losses: red text */
export function cellLosses(value: number): VNode {
  return h("span", { class: "text-red-500" }, String(value));
}

/** Draws: yellow text */
export function cellDraws(value: number): VNode {
  return h("span", { class: "text-yellow-500" }, String(value));
}

/** Goal difference: coloured +/- prefix */
export function cellGoalDiff(value: number): VNode {
  const cls = value > 0 ? "text-green-600" : value < 0 ? "text-red-500" : "";
  const text = (value > 0 ? "+" : "") + value;
  return h("span", { class: cls }, text);
}

/** Percentage with one decimal and % suffix, e.g. winRate, participationRate */
export function cellPercent(value: number | null | undefined): VNode {
  return h("span", {}, value == null ? "—" : value.toFixed(1) + "%");
}

/** Rate with two decimals, e.g. goalRate, goalRateFor */
export function cellRate(value: number | null | undefined): VNode {
  return h("span", {}, value == null ? "—" : value.toFixed(2));
}

/** Cell with truncated text */
export function cellTruncated(
  value: string | null | undefined,
  maxLength: number = 10,
): VNode {
  const text =
    value == null
      ? "—"
      : value.length > maxLength
        ? value.slice(0, maxLength) + "…"
        : value;
  return h("span", {}, text);
}

export interface PlayerLinkRow {
  playerId: string;
  name: string;
  [key: string]: unknown;
}

/** Player name as a NuxtLink, with optional nickname. Row must have `playerId` and `name`. */
export function cellPlayerLink(
  row: PlayerLinkRow,
  opts?: { nicknameKey?: string },
): VNode {
  const nickname = opts?.nicknameKey
    ? (row[opts.nicknameKey] as string | null | undefined)
    : undefined;

  const link = row.playerId
    ? h(
        NuxtLink,
        {
          class: "font-medium hover:text-brand transition-colors",
          to: `/players/${row.playerId}`,
        },
        () => row.name,
      )
    : h("span", {}, row.name);

  if (!nickname) return link;

  return h("div", { class: "flex gap-x-2 items-baseline" }, [
    link,
    h("span", { class: "text-sm text-gray-400 italic" }, nickname),
  ]);
}

/** Generic link cell. */
export function cellLink(value: string, to: string): VNode {
  return h(
    NuxtLink,
    { class: "font-medium hover:text-brand transition-colors", to },
    () => value,
  );
}
