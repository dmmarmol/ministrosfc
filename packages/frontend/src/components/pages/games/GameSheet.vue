<script setup lang="ts">
import { computed } from "vue";
import {
  ConfirmationStatus,
  GameStatus,
  PlayerType,
  formatDate,
  formatTime,
  competitionTypeItems,
  type Game,
  type GameParticipant,
} from "@ministrosfc/shared";
import PositionLabel from "~/components/ui/Position/Label.vue";
import HomeCtaSlot from "../home/HomeCtaSlot.vue";
import HomeArrow from "../home/HomeArrow.vue";


const { t } = useI18n();
const props = defineProps<{
  game: Game;
  participants: GameParticipant[];
  /** Signup call to action. Off until the club adopts in-app signup (spec 023 FR-021). */
  ctaEnabled?: boolean;
  signupUrl?: string;
  /** Detail page: score, per-player stats, competition and a back link. */
  detail?: boolean;
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
  () =>
    props.game.time?.slice(0, 5) ||
    formatTime(props.game.date, { hour: "2-digit", minute: "2-digit", hour12: false }),
);
const isCompleted = computed(() => props.game.status === GameStatus.COMPLETED);
const stateLabel = computed(() =>
  isCancelled.value
    ? t("common.anulado")
    : isLive.value
      ? t("common.enJuego")
      : isCompleted.value
        ? t("gamesGameSheet.jugado")
        : t("common.proximo"),
);
const competition = computed(
  () =>
    competitionTypeItems.find((c) => c.value === props.game.competitionType)
      ?.label ?? null,
);
const hasScore = computed(
  () => props.game.homeTeamScore != null && props.game.awayTeamScore != null,
);
const home = computed(() => props.game.homeTeamScore ?? 0);
const away = computed(() => props.game.awayTeamScore ?? 0);
const outcome = computed(() =>
  home.value > away.value ? t("common.victoria") : home.value === away.value ? t("common.empate") : t("common.derrota"),
);
const sectionTitle = computed(() => (isCompleted.value ? t("gamesGameSheet.jugaron") : t("gamesGameSheet.convocados")));
const scorers = computed(() =>
  registered.value
    .filter((p) => (p.goalsScored ?? 0) > 0)
    .sort((a, b) => b.goalsScored - a.goalsScored)
    .map((p) => ({
      name: `${p.player.nickname || p.player.firstName} ${p.player.lastName}`,
      n: p.goalsScored,
    })),
);
const hasTags = computed(
  () =>
    props.detail &&
    isCompleted.value &&
    registered.value.some((p) => statTags(p).length > 0),
);
const statTags = (p: GameParticipant) =>
  [
    { k: "G", n: p.goalsScored, name: t("common.goles"), card: null },
    { k: "A", n: p.assists, name: t("common.asistencias"), card: null },
    { k: "TA", n: p.yellowCards, name: t("common.tarjetasAmarillas"), card: "yellow" },
    { k: "TR", n: p.redCards, name: t("common.tarjetasRojas"), card: "red" },
  ].filter((t) => t.n > 0);
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

// "12" while open, "12 / 14" for a game that still has a cap
const participantCount = computed(() => {
  const total = registered.value.length + guests.value.length;
  if (!props.detail || !total) return undefined;
  return props.game.maxPlayers && !isCompleted.value
    ? `${total} / ${props.game.maxPlayers}`
    : total;
});

const detailUrl = computed(() => `/games/${props.game.slug || props.game.id}`);
</script>

<template>
  <section class="sheet-paper" aria-labelledby="home-sheet-title">
    <div class="mx-auto max-w-3xl px-4 pb-8 pt-6">
      <UiBackButton v-if="detail" to="/schedule" :label="t('common.calendario')" class="mb-2" />
      <h1
        id="home-sheet-title"
        class="sheet-display text-[clamp(3rem,15vw,6rem)]"
      >
        {{ t("common.vs", { name: game.opponentTeam?.name ?? t("common.rivalAConfirmar") }) }}
      </h1>

      <dl
        class="sheet-num mt-5 flex flex-wrap gap-x-5 gap-y-1 border-y-[3px] border-[var(--sheet-ink)] py-2.5 font-bold uppercase"
      >
        <div class="flex gap-2">
          <dt class="sr-only">{{ t("gamesGameSheet.planilla") }}</dt>
          <dd class="text-[var(--sheet-blue)]">
            {{ stateLabel }}
          </dd>
        </div>
        <div class="flex gap-2">
          <dt class="sr-only">{{ t("gamesGameSheet.fecha") }}</dt>
          <dd>{{ dateLabel }}</dd>
        </div>
        <div class="flex gap-2">
          <dt class="sr-only">{{ t("gamesGameSheet.hora") }}</dt>
          <dd>{{ timeLabel }} h</dd>
        </div>
        <div v-if="venue" class="flex gap-2">
          <dt class="sr-only">{{ t("common.cancha") }}</dt>
          <dd>{{ venue }}</dd>
        </div>
        <div v-if="detail && competition" class="flex gap-2">
          <dt class="sr-only">{{ t("gamesGameSheet.competencia") }}</dt>
          <dd>{{ competition }}</dd>
        </div>
      </dl>

      <p v-if="detail && isCompleted && !hasScore" class="mt-4 font-bold">
        {{ t("gamesGameSheet.elResultadoDeEste") }}
      </p>
      <div v-else-if="detail && hasScore && (isCompleted || isLive)" class="mt-4">
        <p
          :aria-label="`${isLive ? 'Resultado parcial' : 'Resultado'}: ${home} a ${away}${isCompleted ? ', ' + outcome : ''}`"
        >
          <span
            class="sheet-display sheet-num block text-[clamp(4.5rem,24vw,6rem)] leading-[0.85]"
            >{{ home }} – {{ away }}</span
          >
          <span class="sheet-label mt-1 block text-sm">{{
            isLive ? t("common.enJuego") : outcome
          }}</span>
        </p>
        <p v-if="scorers.length" class="mt-3">
          <span class="sheet-label mr-2">{{ t("common.goles") }}</span>
          <span class="font-bold">
            {{ scorers.map((s) => `${s.name} ${s.n}`).join(" · ") }}</span
          >
        </p>
      </div>

      <a
        v-if="mapsUrl && !(detail && isCompleted)"
        :href="mapsUrl"
        target="_blank"
        rel="noopener"
        class="sheet-link mt-2 inline-flex min-h-11 items-center gap-2"
        >{{ t("gamesGameSheet.comoLlegar") }} <HomeArrow
      /></a>

      <div class="relative mt-6">
        <UiSheetHeading
          :count="participantCount"
          >{{ sectionTitle }}</UiSheetHeading
        >
        <p
          v-if="!registered.length && !guests.length"
          class="mt-3 border-t border-[var(--sheet-rule)] py-4"
        >
          {{
            isCompleted
              ? t("gamesGameSheet.noSeCargaronLos")
              : t("gamesGameSheet.elDtTodaviaNo")
          }}
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
                    : t('gamesGameSheet.sinNumero')
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
                v-if="detail && isCompleted"
                class="flex flex-wrap justify-end gap-1"
              >
                <span
                  v-for="t in statTags(p)"
                  :key="t.k"
                  class="sheet-num inline-flex items-center gap-1.5 border-2 border-[var(--sheet-ink)] px-1.5 text-xs font-bold"
                  :title="t.name"
                >
                  <span
                    v-if="t.card"
                    class="inline-block size-3 border border-[var(--sheet-ink)]"
                    :class="t.card === 'yellow' ? 'bg-[var(--sheet-card-yellow)]' : 'bg-[var(--sheet-card-red)]'"
                    aria-hidden="true"
                  />
                  <span v-else aria-hidden="true">{{ t.k }}</span>
                  {{ t.n }}<span class="sr-only"> {{ t.name }}</span>
                </span>
              </span>
              <PositionLabel v-if="p.player.position" :position="p.player.position" size="sm" />
            </NuxtLink>
          </li>
          <li
            v-for="g in guests"
            :key="g.id"
            class="flex min-h-12 items-center gap-3 border-t border-[var(--sheet-rule)] py-2.5"
          >
            <span
              class="sheet-num w-8 font-bold text-[var(--sheet-blue)]"
              :aria-label="t('common.invitado')"
              >—</span
            >
            <span
              class="min-w-0 flex-1 break-words"
              :class="
                isCancelled &&
                'line-through decoration-[var(--sheet-blue)] decoration-[3px]'
              "
              >{{
                t("gameSheet.guestOf", {
                  name: g.invitedByName || g.player.invitedByName || t("gameSheet.aPlayer"),
                })
              }}</span
            >
          </li>
        </ol>

        <div
          v-if="isCancelled"
          class="sheet-stamp pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-[6px] border-[var(--sheet-blue)] bg-[var(--sheet-paper)]/85 px-4 py-1 text-[clamp(2.25rem,12vw,4.5rem)] text-[var(--sheet-blue)] sheet-display"
          role="status"
        >
          {{ t("gamesGameSheet.suspendido") }}
        </div>
      </div>

      <p v-if="hasTags" class="mt-3 flex flex-wrap gap-x-4 text-sm text-[var(--sheet-ink-soft)]">
        <span class="whitespace-nowrap">{{ t("gamesGameSheet.gGoles") }}</span>
        <span class="whitespace-nowrap">{{ t("gamesGameSheet.aAsistencias") }}</span>
        <span class="inline-flex items-center gap-1.5 whitespace-nowrap"><span class="inline-block size-3 border border-[var(--sheet-ink)] bg-[var(--sheet-card-yellow)]" aria-hidden="true" />{{ t("gamesGameSheet.amarillas") }}</span>
        <span class="inline-flex items-center gap-1.5 whitespace-nowrap"><span class="inline-block size-3 border border-[var(--sheet-ink)] bg-[var(--sheet-card-red)]" aria-hidden="true" />{{ t("gamesGameSheet.rojas") }}</span>
      </p>

      <a
        v-if="mapsUrl && detail && isCompleted"
        :href="mapsUrl"
        target="_blank"
        rel="noopener"
        class="sheet-link mt-3 inline-flex min-h-11 items-center gap-2"
        >{{ t("gamesGameSheet.comoLlegar") }} <HomeArrow
      /></a>

      <HomeCtaSlot
        v-if="ctaEnabled && !isCancelled"
        :to="signupUrl ?? `${detailUrl}/signup`"
      />

      <NuxtLink
        v-if="!detail"
        :to="detailUrl"
        class="sheet-link mt-4 inline-flex min-h-11 items-center gap-2"
        >{{ t("gamesGameSheet.verFichaDelPartido") }} <HomeArrow
      /></NuxtLink>
    </div>
  </section>
</template>
