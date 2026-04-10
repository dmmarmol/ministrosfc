<script setup lang="ts">
import { computed } from "vue";
import {
  useNuxtApp,
  useRoute,
  useAsyncData,
  createError,
  useHead,
} from "nuxt/app";
import { GameStatus } from "@ministrosfc/shared";
import { formatDate } from "~/utils/formatDate";

definePageMeta({ public: true });
const { $api } = useNuxtApp();
const route = useRoute();
const slug = route.params.slug as string;

// T027: resolve slug → UUID, then fetch full game
const { data: slugData, error: slugError } = await useAsyncData(
  `game-slug-${slug}`,
  () =>
    $api<{ data: { id: string; slug: string } }>(`/api/v1/games/slug/${slug}`),
);

if (slugError.value || !slugData.value?.data?.id) {
  throw createError({ statusCode: 404, statusMessage: "Game not found" });
}

const gameId = slugData.value.data.id;

const [{ data: gameData, pending }, { data: partData }] = await Promise.all([
  useAsyncData(`game-${gameId}`, () =>
    $api<{ data: any }>(`/api/v1/games/${gameId}`),
  ),
  useAsyncData(`game-participants-${gameId}`, () =>
    $api<{ data: any[] }>(`/api/v1/games/${gameId}/participants`),
  ),
]);

const game = computed(() => gameData.value?.data ?? null);
// T030: sort by confirmedAt ASC, guests intermixed
const participants = computed(() =>
  [...(partData.value?.data ?? [])].sort(
    (a, b) =>
      new Date(a.confirmedAt ?? 0).getTime() -
      new Date(b.confirmedAt ?? 0).getTime(),
  ),
);

useHead(() => ({
  title: game.value
    ? `vs ${game.value.opponentTeam?.name} – Ministros FC`
    : "Game",
}));

function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    SCHEDULED: "Upcoming",
    IN_PROGRESS: "Live",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return map[game.value?.status] ?? game.value?.status ?? "";
});
const statusClass = computed(() => {
  const map: Record<string, string> = {
    SCHEDULED: "bg-blue-500/20 text-blue-300",
    IN_PROGRESS: "bg-green-500/20 text-green-300",
    COMPLETED: "bg-gray-500/20 text-gray-300",
    CANCELLED: "bg-red-500/20 text-red-300",
  };
  return map[game.value?.status] ?? "";
});
</script>

<template>
  <div>
    <div v-if="pending" class="space-y-4">
      <div class="h-48 bg-gray-200 animate-pulse rounded-2xl" />
    </div>
    <template v-else-if="game">
      <!-- Game header -->
      <div class="bg-gray-900 text-white rounded-2xl p-6 mb-8">
        <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">
          {{
            formatDate(
              game.date,
              { month: "long", day: "numeric", year: "numeric" },
              "en-US",
            )
          }}
          ·
          {{ game.playground?.name ?? game.location ?? "TBD" }}
        </p>
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg"
            >
              M
            </div>
            <span class="text-xl font-bold">Ministros FC</span>
          </div>
          <div class="text-center">
            <p
              v-if="game.status === GameStatus.COMPLETED"
              class="text-4xl font-bold"
            >
              {{ game.homeTeamScore }} – {{ game.awayTeamScore }}
            </p>
            <p v-else class="text-lg text-gray-400">vs</p>
            <span
              :class="statusClass"
              class="text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
              >{{ statusLabel }}</span
            >
          </div>
          <div class="flex items-center gap-3 flex-row-reverse">
            <div
              class="w-12 h-12 rounded-full bg-white/20 overflow-hidden flex items-center justify-center font-bold text-lg"
            >
              <img
                v-if="game.opponentTeam?.logoUrl"
                :src="game.opponentTeam.logoUrl"
                class="w-full h-full object-cover"
              />
              <span v-else>{{ initials(game.opponentTeam?.name) }}</span>
            </div>
            <span class="text-xl font-bold">{{ game.opponentTeam?.name }}</span>
          </div>
        </div>
      </div>

      <!-- Participants -->
      <h2 class="text-lg font-bold text-gray-800 mb-4">
        Jugadores ({{ participants.length }})
      </h2>
      <div
        v-if="participants.length"
        class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div
          v-for="p in participants"
          :key="p.id"
          class="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0"
        >
          <span class="text-gray-400 text-xs w-5 text-right">
            {{ p.player?.jerseyNumber ?? "—" }}
          </span>
          <span
            class="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
            :class="
              p.player?.playerType === 'GUEST'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
            "
          >
            {{ p.player?.playerType === "GUEST" ? "Inv." : "Reg." }}
          </span>
          <span class="text-xs text-gray-500 w-8 flex-shrink-0">
            {{ p.player?.position ?? "—" }}
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800 truncate">
              <!-- T030: guest lastName hidden on public page -->
              {{
                p.player?.playerType === "GUEST"
                  ? p.player.firstName
                  : `${p.player?.firstName} ${p.player?.lastName}`
              }}
            </p>
            <!-- T030: "Invitado por" label for guests -->
            <p
              v-if="p.player?.playerType === 'GUEST'"
              class="text-xs text-gray-400 truncate"
            >
              Invitado por
              {{
                p.confirmedBy
                  ? `${p.confirmedBy.firstName} ${p.confirmedBy.lastName}`
                  : "—"
              }}
            </p>
          </div>
          <span class="text-xs text-gray-500 capitalize flex-shrink-0">{{
            p.confirmationStatus?.toLowerCase().replace(/_/g, " ")
          }}</span>
        </div>
      </div>
      <p v-else class="text-gray-500 text-sm">No hay jugadores confirmados.</p>
    </template>
    <div v-else class="text-center py-16 text-gray-500">Game not found.</div>
  </div>
</template>
