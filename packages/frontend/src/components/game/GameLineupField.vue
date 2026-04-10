<script setup lang="ts">
import { computed } from "vue";
import { FORMATION_SLOTS, assignPlayersToSlots } from "~/utils/formations";

const props = defineProps<{
  lineup: string;
  roster: any[];
}>();

const emit = defineEmits<{
  (e: "circle-hover", participantId: string): void;
  (e: "circle-unhover"): void;
}>();

const W = 300; // SVG viewport width
const H = 420; // SVG viewport height
const R = 18; // circle radius

const slots = computed(() => FORMATION_SLOTS[props.lineup] ?? []);

/** T036: assigned entries per slot index */
const assigned = computed(() =>
  assignPlayersToSlots(props.lineup, props.roster),
);

/** Guest counter for Iñ labels */
const guestCounters = computed(() => {
  const map = new Map<string, number>();
  let n = 1;
  for (const entry of assigned.value) {
    if (entry && entry.player.playerType === "GUEST") {
      map.set(entry.participantId, n++);
    }
  }
  return map;
});

function slotX(i: number) {
  return slots.value[i].x * W;
}
function slotY(i: number) {
  return slots.value[i].y * H;
}

function circleLabel(entry: any | null, idx: number): string {
  if (!entry) return "TBD";
  if (entry.player.playerType === "GUEST") {
    return `I${guestCounters.value.get(entry.participantId) ?? "?"}`;
  }
  if (entry.player.jerseyNumber != null)
    return String(entry.player.jerseyNumber);
  // Initials fallback
  const f = entry.player.firstName?.[0] ?? "";
  const l = entry.player.lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

function circleFill(entry: any | null): string {
  if (!entry) return "#e5e7eb"; // gray-200
  if (entry.player.playerType === "GUEST") return "#fef3c7"; // amber-100
  return "#d1fae5"; // green-100
}

function circleStroke(entry: any | null): string {
  if (!entry) return "#9ca3af";
  if (entry.player.playerType === "GUEST") return "#d97706";
  return "#059669";
}

function circleTextFill(entry: any | null): string {
  if (!entry) return "#6b7280";
  if (entry.player.playerType === "GUEST") return "#92400e";
  return "#065f46";
}
</script>

<template>
  <div class="relative w-full select-none">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full rounded-xl overflow-hidden"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Field background -->
      <rect width="100%" height="100%" fill="#16a34a" rx="8" />
      <!-- Center circle -->
      <circle
        :cx="W / 2"
        :cy="H / 2"
        r="42"
        fill="none"
        stroke="#15803d"
        stroke-width="1.5"
      />
      <!-- Halfway line -->
      <line
        x1="10"
        :y1="H / 2"
        :x2="W - 10"
        :y2="H / 2"
        stroke="#15803d"
        stroke-width="1.5"
      />
      <!-- Penalty areas -->
      <rect
        x="75"
        y="10"
        width="150"
        height="70"
        fill="none"
        stroke="#15803d"
        stroke-width="1.5"
        rx="2"
      />
      <rect
        x="75"
        :y="H - 80"
        width="150"
        height="70"
        fill="none"
        stroke="#15803d"
        stroke-width="1.5"
        rx="2"
      />
      <!-- Goal areas -->
      <rect
        x="110"
        y="10"
        width="80"
        height="28"
        fill="none"
        stroke="#15803d"
        stroke-width="1.5"
        rx="2"
      />
      <rect
        x="110"
        :y="H - 38"
        width="80"
        height="28"
        fill="none"
        stroke="#15803d"
        stroke-width="1.5"
        rx="2"
      />

      <!-- Outer pitch boundary -->
      <rect
        x="10"
        y="10"
        width="280"
        height="400"
        fill="none"
        stroke="#15803d"
        stroke-width="1.5"
      />

      <!-- Corner arcs (r=8, center at each corner of the boundary) -->
      <!-- Top-left -->
      <path
        d="M 18,10 A 8,8 0 0,1 10,18"
        fill="none"
        stroke="#15803d"
        stroke-width="1.5"
      />
      <!-- Top-right -->
      <path
        d="M 282,10 A 8,8 0 0,0 290,18"
        fill="none"
        stroke="#15803d"
        stroke-width="1.5"
      />
      <!-- Bottom-right -->
      <path
        d="M 290,402 A 8,8 0 0,0 282,410"
        fill="none"
        stroke="#15803d"
        stroke-width="1.5"
      />
      <!-- Bottom-left -->
      <path
        d="M 10,402 A 8,8 0 0,1 18,410"
        fill="none"
        stroke="#15803d"
        stroke-width="1.5"
      />

      <!-- Center spot -->
      <circle :cx="W / 2" :cy="H / 2" r="2.5" fill="#15803d" />

      <!-- Penalty spots -->
      <circle :cx="W / 2" cy="60" r="2.5" fill="#15803d" />
      <circle :cx="W / 2" :cy="H - 60" r="2.5" fill="#15803d" />

      <!-- Penalty arcs (D) — only the portion outside the penalty area shown -->
      <!-- Top arc: center (150,60) r=42, arc below y=80 between x≈114.9 and x≈185.1 -->
      <path
        d="M 114.9,80 A 42,42 0 0,1 185.1,80"
        fill="none"
        stroke="#15803d"
        stroke-width="1.5"
      />
      <!-- Bottom arc: center (150,H-60) r=42, arc above y=H-80 -->
      <path
        :d="`M 114.9,${H - 80} A 42,42 0 0,0 185.1,${H - 80}`"
        fill="none"
        stroke="#15803d"
        stroke-width="1.5"
      />

      <!-- Player circles -->
      <g
        v-for="(entry, idx) in assigned"
        :key="idx"
        class="cursor-pointer"
        @mouseenter="entry && emit('circle-hover', entry.participantId)"
        @mouseleave="emit('circle-unhover')"
        @touchstart.prevent="entry && emit('circle-hover', entry.participantId)"
      >
        <circle
          :cx="slotX(idx)"
          :cy="slotY(idx)"
          :r="R"
          :fill="circleFill(entry)"
          :stroke="circleStroke(entry)"
          stroke-width="2"
        />
        <text
          :x="slotX(idx)"
          :y="slotY(idx) + 4"
          text-anchor="middle"
          font-size="10"
          font-weight="600"
          :fill="circleTextFill(entry)"
        >
          {{ circleLabel(entry, idx) }}
        </text>
      </g>
    </svg>
  </div>
</template>
