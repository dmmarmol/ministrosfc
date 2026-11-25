<script setup lang="ts">
import { computed, ref, resolveComponent, watch } from "vue";
import { PositionDisplayName, type Position } from "@ministrosfc/shared";

/**
 * Player ficha (spec 023). Real data only: photo, dorsal, name, position and
 * career stats. No ratings, flags or abilities. Room for them later: the stat
 * strip takes any number of cells.
 */
interface FichaPlayer {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string | null;
  position?: Position | string | null;
  jerseyNumber?: number | null;
  photoUrl?: string | null;
}
interface FichaStats {
  gamesPlayed: number;
  goals: number;
  assists: number;
}

const props = withDefaults(
  defineProps<{
    player: FichaPlayer;
    stats?: FichaStats | null;
    size?: "grid" | "large";
    asLink?: boolean;
    showStats?: boolean;
    /** Optional status tag (e.g. Activo / Inactivo) shown with the position. */
    statusLabel?: string | null;
  }>(),
  { stats: null, size: "grid", asLink: true, showStats: true, statusLabel: null },
);

const NuxtLink = resolveComponent("NuxtLink");
const root = computed(() => (props.asLink ? NuxtLink : "div"));

// Seeded data uses a generic "dummy-user" avatar, sometimes wrapped in a
// search-proxy URL whose path carries the base64 of the real target.
const PLACEHOLDER = /dummy[-_]?user|placeholder|default[-_]avatar/i;
function isPlaceholder(url: string): boolean {
  if (PLACEHOLDER.test(url)) return true;
  try {
    const segs = new URL(url).pathname.split("/").filter(Boolean);
    const lastOpt = segs.reduce((n, s, i) => (s.includes(":") ? i : n), -1);
    const b64 = segs
      .slice(lastOpt + 1)
      .join("")
      .split(".")[0]!
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    return PLACEHOLDER.test(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)));
  } catch {
    return false;
  }
}
const photoFailed = ref(false);
watch(
  () => props.player.photoUrl,
  () => (photoFailed.value = false),
);
const photo = computed(() => {
  const u = props.player.photoUrl;
  return u && !photoFailed.value && !isPlaceholder(u) ? u : null;
});

const dorsal = computed(() =>
  props.player.jerseyNumber ? String(props.player.jerseyNumber) : null,
);
const initials = computed(
  () =>
    [props.player.firstName, props.player.lastName]
      .map((n) => n?.match(/\p{L}/u)?.[0])
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?",
);

const SHORT: Record<string, string> = {
  GK: "ARQ",
  CB: "DFC",
  RB: "LD",
  LB: "LI",
  RWB: "CAD",
  LWB: "CAI",
  DMF: "MCD",
  CMF: "MC",
  AMF: "MCO",
  RMF: "MD",
  LMF: "MI",
  SS: "SD",
  CF: "DC",
  RWF: "ED",
  LWF: "EI",
};
const positionName = computed(() =>
  props.player.position
    ? ((PositionDisplayName as Record<string, string>)[props.player.position] ??
      String(props.player.position))
    : null,
);
const positionShort = computed(() =>
  props.player.position
    ? (SHORT[props.player.position] ?? String(props.player.position))
    : null,
);
const label = computed(() =>
  [
    `${props.player.firstName} ${props.player.lastName}`,
    positionName.value,
    dorsal.value ? `camiseta ${dorsal.value}` : null,
  ]
    .filter(Boolean)
    .join(", "),
);
const cells = computed(() => [
  { key: "PJ", name: "Partidos jugados", value: props.stats?.gamesPlayed },
  { key: "G", name: "Goles", value: props.stats?.goals },
  { key: "A", name: "Asistencias", value: props.stats?.assists },
]);
const large = computed(() => props.size === "large");
const split = computed(() => large.value && !!photo.value && !!dorsal.value);
</script>

<template>
  <component
    :is="root"
    v-bind="asLink ? { to: `/players/${player.id}` } : {}"
    :aria-label="asLink ? label : undefined"
    class="ficha group flex h-full flex-col border-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)] no-underline"
  >
    <!-- Large + photo + dorsal: split picture, photo and the number plate side by side -->
    <div
      v-if="split"
      class="flex aspect-[4/3] border-b-[3px] border-[var(--sheet-ink)]"
    >
      <img
        :src="photo!"
        :alt="`${player.firstName} ${player.lastName}`"
        class="min-w-0 grow basis-0 object-cover grayscale contrast-110 transition-[filter] duration-300 group-hover:grayscale-0"
        @error="photoFailed = true"
      />
      <div
        class="sheet-display sheet-num relative grid w-[36%] shrink-0 place-items-center border-l-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-ink)] text-[5.5rem] leading-none text-[var(--sheet-paper)]"
      >
        <span
          class="absolute left-2 top-1.5 font-[var(--sheet-type)] text-xs font-bold tracking-[0.12em] text-[var(--sheet-blue-on-ink)]"
          aria-hidden="true"
          >Nº</span
        >
        <span :aria-label="`Camiseta ${dorsal}`">{{ dorsal }}</span>
      </div>
    </div>
    <div
      v-else
      class="relative overflow-hidden border-b-[3px] border-[var(--sheet-ink)]"
      :class="large ? 'aspect-[4/3]' : 'aspect-[4/3.2]'"
    >
      <img
        v-if="photo"
        :src="photo"
        :alt="asLink ? '' : `${player.firstName} ${player.lastName}`"
        loading="lazy"
        class="size-full object-cover grayscale contrast-110 transition-[filter] duration-300 group-hover:grayscale-0 group-focus-visible:grayscale-0"
        @error="photoFailed = true"
      />
      <!-- No photo, with dorsal: ink plate with the number in paper -->
      <div
        v-else-if="dorsal"
        class="sheet-display sheet-num relative grid size-full place-items-center bg-[var(--sheet-ink)] text-[var(--sheet-paper)]"
        :class="large ? 'text-[8rem]' : 'text-[4.5rem]'"
        aria-hidden="true"
      >
        <span
          class="absolute left-2 top-1.5 font-[var(--sheet-type)] text-xs font-bold tracking-[0.12em] text-[var(--sheet-blue-on-ink)]"
          >Nº</span
        >
        {{ dorsal }}
      </div>
      <!-- No photo, no dorsal: outlined initials, clearly not a number -->
      <div
        v-else
        class="grid size-full place-items-center bg-[var(--sheet-paper)] p-2"
        aria-hidden="true"
      >
        <span
          class="sheet-display grid size-full place-items-center border-2 border-dashed border-[var(--sheet-ink)] text-[var(--sheet-ink-soft)]"
          :class="large ? 'text-6xl' : 'text-4xl'"
          >{{ initials }}</span
        >
      </div>
      <!-- Grid + photo: the dorsal rides on a paper tab -->
      <span
        v-if="dorsal && photo"
        class="sheet-display sheet-num absolute left-0 top-0 border-b-[3px] border-r-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)] px-2.5 pt-1 leading-none text-[var(--sheet-blue)]"
        :class="large ? 'text-5xl' : 'text-3xl'"
        >{{ dorsal }}</span
      >
    </div>

    <div class="px-2.5 pb-2.5 pt-2" :class="large && 'px-4 pb-4 pt-3'">
      <p
        class="sheet-display break-words"
        :class="large ? 'text-4xl' : 'text-[1.625rem]'"
      >
        {{ player.lastName }}
      </p>
      <p class="mt-0.5 break-words text-sm" :class="large && 'text-base'">
        {{ player.firstName }}
      </p>
      <p v-if="statusLabel" class="sheet-label mt-2">{{ statusLabel }}</p>
      <p
        v-if="positionShort || player.nickname"
        class="mt-2 flex items-center justify-between gap-2"
      >
        <span
          v-if="positionShort"
          class="inline-block shrink-0 border border-[var(--sheet-blue)] px-1.5 text-xs font-bold text-[var(--sheet-blue)]"
          :title="positionName ?? undefined"
          >{{ positionShort }}<span class="sr-only"> ({{ positionName }})</span></span
        >
        <span
          v-if="player.nickname"
          class="min-w-0 truncate text-sm font-bold text-[var(--sheet-ink-soft)]"
          >“{{ player.nickname }}”</span
        >
      </p>
    </div>

    <dl
      v-if="showStats"
      class="mt-auto grid grid-cols-3 border-t-[3px] border-[var(--sheet-ink)] text-center"
    >
      <div
        v-for="c in cells"
        :key="c.key"
        class="border-r border-[var(--sheet-ink)] py-1.5 last:border-r-0"
      >
        <dt class="text-[0.6875rem] font-bold" :title="c.name">
          <span aria-hidden="true">{{ c.key }}</span
          ><span class="sr-only">{{ c.name }}</span>
        </dt>
        <dd
          class="sheet-display sheet-num leading-none"
          :class="large ? 'text-4xl' : 'text-2xl'"
        >
          {{ c.value ?? "—" }}
        </dd>
      </div>
    </dl>
  </component>
</template>
