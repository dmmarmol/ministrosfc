<script setup lang="ts">
import { computed } from "vue";
import {
  ConfirmationStatus,
  GameStatus,
  PlayerType,
  formatDate,
  formatTime,
  type Game,
  type GameParticipant,
} from "@ministrosfc/shared";
import HomeCtaSlot from "./HomeCtaSlot.vue";
import HomeArrow from "./HomeArrow.vue";

const props = defineProps<{
  game: Game;
  participants: GameParticipant[];
  /** Signup call to action. Off until the club adopts in-app signup (spec 023 FR-021). */
  ctaEnabled?: boolean;
  signupUrl?: string;
}>();

const isCancelled = computed(() => props.game.status === GameStatus.CANCELLED);
const isLive = computed(() => props.game.status === GameStatus.IN_PROGRESS);

const dateLabel = computed(() =>
  formatDate(props.game.date, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).replace(/[.,]/g, ""),
);
const timeLabel = computed(
  () => props.game.time?.slice(0, 5) || formatTime(props.game.date),
);
const stateLabel = computed(() =>
  isCancelled.value ? "Anulado" : isLive.value ? "En juego" : "Próximo",
);
const venue = computed(
  () => props.game.playground?.name ?? props.game.location ?? null,
);

const mapsUrl = computed(() => {
  const p = props.game.playground;
  if (!p) return null;
  const query =
    p.latitude != null && p.longitude != null
      ? `${p.latitude},${p.longitude}`
      : p.address;
  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : null;
});

const confirmed = computed(() =>
  props.participants.filter(
    (p) => p.confirmationStatus === ConfirmationStatus.CONFIRMED,
  ),
);
const registered = computed(() =>
  confirmed.value
    .filter((p) => p.player.playerType !== PlayerType.GUEST)
    .sort(
      (a, b) =>
        (a.player.jerseyNumber ?? 999) - (b.player.jerseyNumber ?? 999) ||
        a.player.lastName.localeCompare(b.player.lastName, "es"),
    ),
);
const guests = computed(() =>
  confirmed.value.filter((p) => p.player.playerType === PlayerType.GUEST),
);

const detailUrl = computed(() => `/games/${props.game.slug || props.game.id}`);
</script>

<template>
  <section class="sheet-paper" aria-labelledby="home-sheet-title">
    <div class="mx-auto max-w-3xl px-4 pb-8 pt-6">
      <h1
        id="home-sheet-title"
        class="sheet-display text-[clamp(3rem,15vw,6rem)]"
      >
        vs {{ game.opponentTeam?.name ?? "Rival a confirmar" }}
      </h1>

      <dl
        class="sheet-num mt-5 flex flex-wrap gap-x-5 gap-y-1 border-y-[3px] border-[var(--sheet-ink)] py-2.5 font-bold uppercase"
      >
        <div class="flex gap-2">
          <dt class="sr-only">Planilla</dt>
          <dd class="text-[var(--sheet-blue)]">
            {{ stateLabel }}
          </dd>
        </div>
        <div class="flex gap-2">
          <dt class="sr-only">Fecha</dt>
          <dd>{{ dateLabel }}</dd>
        </div>
        <div class="flex gap-2">
          <dt class="sr-only">Hora</dt>
          <dd>{{ timeLabel }} h</dd>
        </div>
        <div v-if="venue" class="flex gap-2">
          <dt class="sr-only">Cancha</dt>
          <dd>{{ venue }}</dd>
        </div>
      </dl>

      <a
        v-if="mapsUrl"
        :href="mapsUrl"
        target="_blank"
        rel="noopener"
        class="sheet-link mt-2 inline-flex min-h-11 items-center gap-2"
        >Cómo llegar <HomeArrow
      /></a>

      <div class="relative mt-6">
        <h2 class="sheet-display text-3xl">Convocados</h2>
        <p
          v-if="!registered.length && !guests.length"
          class="mt-3 border-t border-[var(--sheet-rule)] py-4"
        >
          El DT todavía no cargó los convocados.
        </p>
        <ol v-else class="mt-1">
          <li
            v-for="(p, i) in registered"
            :key="p.id"
            class="border-t border-[var(--sheet-rule)] first:border-t-0"
          >
            <NuxtLink
              :to="`/players/${p.playerId}`"
              class="flex min-h-12 items-center gap-3 py-2.5 no-underline hover:bg-[var(--sheet-ground)]"
            >
              <span
                class="sheet-num w-8 font-bold text-[var(--sheet-blue)]"
                :aria-label="
                  p.player.jerseyNumber != null
                    ? `Camiseta ${p.player.jerseyNumber}`
                    : 'Sin número'
                "
                >{{ p.player.jerseyNumber ?? "—" }}</span
              >
              <span
                class="min-w-0 flex-1 break-words text-lg font-bold"
                :class="
                  isCancelled &&
                  'line-through decoration-[var(--sheet-blue)] decoration-[3px]'
                "
              >
                {{ p.player.nickname || p.player.firstName }}
                {{ p.player.lastName }}
              </span>
              <span
                v-if="p.player.position"
                class="border border-[var(--sheet-blue)] px-1.5 text-xs font-bold text-[var(--sheet-blue)]"
                >{{ p.player.position }}</span
              >
            </NuxtLink>
          </li>
          <li
            v-for="g in guests"
            :key="g.id"
            class="flex min-h-12 items-center gap-3 border-t border-[var(--sheet-rule)] py-2.5"
          >
            <span
              class="sheet-num w-8 font-bold text-[var(--sheet-blue)]"
              aria-label="Invitado"
              >—</span
            >
            <span
              class="min-w-0 flex-1 break-words"
              :class="
                isCancelled &&
                'line-through decoration-[var(--sheet-blue)] decoration-[3px]'
              "
              >Invitado de
              {{ g.invitedByName || g.player.invitedByName || "un jugador" }}</span
            >
          </li>
        </ol>

        <div
          v-if="isCancelled"
          class="sheet-stamp pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-[6px] border-[var(--sheet-blue)] bg-[var(--sheet-paper)]/85 px-4 py-1 text-[clamp(2.25rem,12vw,4.5rem)] text-[var(--sheet-blue)] sheet-display"
          role="status"
        >
          Suspendido
        </div>
      </div>

      <HomeCtaSlot
        v-if="ctaEnabled && !isCancelled"
        :to="signupUrl ?? `${detailUrl}/signup`"
      />

      <NuxtLink
        :to="detailUrl"
        class="sheet-link mt-4 inline-flex min-h-11 items-center gap-2"
        >Ver ficha del partido <HomeArrow
      /></NuxtLink>
    </div>
  </section>
</template>
