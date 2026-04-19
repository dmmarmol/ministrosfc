<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useHead } from "nuxt/app";
import { CheckCircleIcon } from "@heroicons/vue/24/solid";
import {
  GameStatus,
  UserRole,
  formatDate,
  getInitials,
} from "@ministrosfc/shared";
import { useAuthStore } from "~/stores/auth";
import { useGameBySlug } from "~/composables/useGameBySlug";
import { useGameSignup } from "~/composables/useGameSignup";

definePageMeta({ public: true });
const route = useRoute();
const slug = route.params.slug as string;

// T027: resolve slug → UUID, then fetch full game + participants
const { gameId, game, participants, pending } = useGameBySlug(slug);
const { isUserSignedUp } = useGameSignup(gameId);

useHead(() => ({
  title: game.value
    ? `vs ${game.value.opponentTeam?.name} – Ministros FC`
    : "Game",
}));

const statusLabel = computed(() => {
  const map: Record<GameStatus, string> = {
    SCHEDULED: "Upcoming",
    IN_PROGRESS: "Live",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return map[game.value?.status as GameStatus] ?? game.value?.status ?? "";
});
const statusClass = computed(() => {
  const map: Record<GameStatus, string> = {
    SCHEDULED: "bg-blue-500/20 text-blue-300",
    IN_PROGRESS: "bg-green-500/20 text-green-300",
    COMPLETED: "bg-gray-500/20 text-gray-300",
    CANCELLED: "bg-red-500/20 text-red-300",
  };
  return map[game.value?.status as GameStatus] ?? "";
});

const authStore = useAuthStore();
const showSignupLink = computed(
  () =>
    authStore.isAuthenticated &&
    isUserSignedUp.value &&
    authStore.user?.role === UserRole.PLAYER &&
    game.value?.status === GameStatus.SCHEDULED,
);

const isTeamFull = computed(
  () =>
    game.value?.maxPlayers != null &&
    participants.value.length >= game.value.maxPlayers,
);
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
              <span v-else>{{ getInitials(game.opponentTeam?.name) }}</span>
            </div>
            <span class="text-xl font-bold">{{ game.opponentTeam?.name }}</span>
          </div>
        </div>
      </div>

      <!-- Signup CTA for authenticated players (FR-042) -->
      <NuxtLink
        v-if="showSignupLink"
        :to="`/games/${slug}/signup`"
        class="flex items-center justify-center gap-2 w-full mb-6 py-3 rounded-xl bg-brand text-gray-900 font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        Anotarse a este partido
      </NuxtLink>
      <span v-else>Ya estás anotado a este partido</span>

      <!-- Participants -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-gray-800">
          Confirmados ({{ participants.length
          }}<span v-if="game.maxPlayers"> / {{ game.maxPlayers }}</span
          >)
        </h2>
        <div
          v-if="isTeamFull"
          class="flex items-center gap-1.5 text-green-600 text-sm font-medium"
        >
          <CheckCircleIcon class="w-5 h-5" />
          Equipo completo
        </div>
      </div>
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
          <UiPositionLabel
            v-if="p.player?.position"
            :position="p.player.position"
          />
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
          <div
            class="text-xs text-gray-500 flex-shrink-0 flex items-center gap-4"
          >
            <div
              class="flex gap-x-2"
              v-if="game.status === GameStatus.COMPLETED && p.goalsScored"
            >
              <span v-for="n in p.goalsScored" :key="n" aria-hidden="true"
                >⚽</span
              >
            </div>
            <span
              v-if="game.status !== GameStatus.COMPLETED"
              class="capitalize"
              >{{
                p.confirmationStatus === "CONFIRMED"
                  ? "Confirmado"
                  : p.confirmationStatus?.toLowerCase().replace(/_/g, " ")
              }}</span
            >
          </div>
        </div>
      </div>
      <p v-else class="text-gray-500 text-sm">No hay jugadores confirmados.</p>
    </template>
    <div v-else class="text-center py-16 text-gray-500">Game not found.</div>
  </div>
</template>
