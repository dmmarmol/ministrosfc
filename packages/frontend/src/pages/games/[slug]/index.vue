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
import GameParticipantsTable from "../../../components/pages/games/GameParticipantsTable.vue";
// import { useAuthStore } from "~/stores/auth";
// import { useGameBySlug } from "~/composables/useGameBySlug";
// import { useGameSignup } from "~/composables/useGameSignup";

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
const isUserAParticipant = computed(() => {
  if (authStore.user?.onboardingCompletedAt === null) {
    return false;
  }
  debugger;
  return participants.value.some(
    (participant) => participant.playerId === authStore.user?.playerId,
  );
});

const isTeamFull = computed(
  () =>
    game.value?.maxPlayers != null &&
    participants.value.length >= game.value.maxPlayers,
);

const showSignupLink = computed(
  () =>
    authStore.isAuthenticated &&
    !isUserAParticipant.value &&
    !isTeamFull.value &&
    isUserSignedUp.value &&
    authStore.user?.role === UserRole.PLAYER &&
    game.value?.status === GameStatus.SCHEDULED,
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
        <div class="grid lg:grid-cols-3 gap-4">
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

      <!-- Participants -->
      <div class="mb-4 grid lg:grid-cols-3">
        <div>
          <h2 class="text-lg font-bold text-gray-800">
            Confirmados ({{ participants.length
            }}<span v-if="game.maxPlayers"> / {{ game.maxPlayers }}</span
            >)
          </h2>
        </div>
        <div class="lg:text-center">
          <!-- Signup CTA for authenticated players (FR-042) -->
          <UButton
            v-if="showSignupLink"
            :to="`/games/${slug}/signup`"
            class="flex items-center justify-center w-full"
            variant="solid"
            color="primary"
          >
            Anotarse a este partido
          </UButton>
        </div>
        <div class="text-lg font-bold">
          <p
            v-if="isTeamFull"
            class="flex items-center gap-1.5 justify-end text-green-600"
          >
            <CheckCircleIcon class="w-5 h-5" /> El equipo ya está completo
          </p>
          <p v-else-if="isUserAParticipant">Ya estás anotado a este partido</p>
          <p v-else>Puedes anotarte a este partido</p>
        </div>
      </div>
      <!-- UTable -->
      <GameParticipantsTable
        v-if="participants.length"
        :participants="participants"
      />
      <p v-else class="text-gray-500 text-sm">
        Aun no hay jugadores confirmados.
      </p>
    </template>
    <div v-else class="text-center py-16 text-gray-500">Game not found.</div>
  </div>
</template>
