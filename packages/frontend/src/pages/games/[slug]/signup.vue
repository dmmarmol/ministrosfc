<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  useNuxtApp,
  useRoute,
  useAsyncData,
  createError,
  useHead,
  navigateTo,
} from "nuxt/app";
import { GameStatus } from "@ministrosfc/shared";
import { useGameSignup } from "~/composables/useGameSignup";
import { useAuthStore } from "~/stores/auth";
import GameLineupField from "~/components/game/GameLineupField.vue";
import SignupGameHeader from "~/components/pages/games/signup/SignupGameHeader.vue";
import SignupPlayerTable from "~/components/pages/games/signup/SignupPlayerTable.vue";
import SignupRegistrationRow from "~/components/pages/games/signup/SignupRegistrationRow.vue";

// T022: auth guard — redirect unauthenticated to /login?redirect=...
definePageMeta({ middleware: "auth", requiresAuth: true });

// T022: noindex,nofollow (FR-015)
useHead({
  meta: [{ name: "robots", content: "noindex,nofollow" }],
});

const { $api } = useNuxtApp();
const route = useRoute();
const authStore = useAuthStore();
const slug = route.params.slug as string;

// Resolve slug → gameId
const { data: slugData, error: slugError } = await useAsyncData(
  `signup-slug-${slug}`,
  () =>
    $api<{ data: { id: string; slug: string } }>(`/api/v1/games/slug/${slug}`),
);
if (slugError.value || !slugData.value?.data?.id) {
  throw createError({ statusCode: 404, statusMessage: "Game not found" });
}
const gameId = ref(slugData.value.data.id);

// T023: composable
const {
  loading,
  error,
  roster,
  confirmedCount,
  isFull,
  currentPlayerStatus,
  currentPlayerId,
  game,
  load,
  signupSelf,
  signupGuest,
  signupProxy,
  removeParticipant,
} = useGameSignup(gameId);

// T069: ADMIN/EDITOR/DT can remove any row; PLAYER sees button only on their own row
const canManageRoster = computed(() =>
  ["ADMIN", "EDITOR", "DT"].includes(authStore.user?.role ?? ""),
);

useHead(() => ({
  title: game.value
    ? `Convocatoria vs ${game.value.opponentTeam?.name} – Ministros FC`
    : "Convocatoria",
}));

// T038: hover highlight state for field/table correlation
const hoveredParticipantId = ref<string | null>(null);

// Auth check + load on client mount — token is available here, not during SSR
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await navigateTo(`/login?redirect=${encodeURIComponent(route.fullPath)}`);
    return;
  }
  await load();
});

async function handleSignupSelf() {
  try {
    await signupSelf();
  } catch {
    // error handled by composable
  }
}

async function handleSignupGuest(
  firstName: string,
  lastName: string,
  position: string | null,
) {
  await signupGuest(firstName, lastName, position);
}

async function handleSignupProxy(targetPlayerId: string) {
  await signupProxy(targetPlayerId);
}

async function handleRemoveParticipant(participantId: string) {
  try {
    await removeParticipant(participantId);
  } catch {
    // error handled by composable
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <!-- T051: Game header sub-component -->
    <SignupGameHeader
      v-if="game"
      :game="game"
      :confirmed-count="confirmedCount"
      :max-players="game.maxPlayers ?? null"
    />

    <!-- Error banner -->
    <div
      v-if="error"
      class="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg"
    >
      {{ error }}
    </div>

    <!-- T053: Registration row (self + guest + proxy + isFull) -->
    <SignupRegistrationRow
      v-if="game?.status === GameStatus.SCHEDULED"
      :current-player-status="currentPlayerStatus"
      :is-full="isFull"
      :confirmed-player-ids="roster.map((r) => r.player.id)"
      @signup-self="handleSignupSelf"
      @signup-guest="handleSignupGuest"
      @signup-proxy="handleSignupProxy"
      @dismiss="() => {}"
    />

    <!-- T037: responsive layout — field + table side by side ≥768px, stacked on mobile -->
    <div
      v-if="roster.length"
      class="mt-6"
      :class="game?.lineup ? 'md:grid md:grid-cols-12 md:gap-6' : ''"
    >
      <!-- T037: Field (8/12 cols on md+, full-width on mobile) -->
      <div v-if="game?.lineup" class="md:col-span-8 mb-6 md:mb-0">
        <GameLineupField
          :lineup="game.lineup"
          :roster="roster"
          @circle-hover="hoveredParticipantId = $event"
          @circle-unhover="hoveredParticipantId = null"
        />
      </div>

      <!-- T026+T052: Player table (4/12 cols with field, full-width without) -->
      <div :class="game?.lineup ? 'md:col-span-4' : ''">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">
          Confirmados ({{ confirmedCount
          }}<span v-if="game?.maxPlayers"> / {{ game.maxPlayers }}</span
          >)
        </h3>
        <SignupPlayerTable
          :roster="roster"
          :highlighted-participant-id="hoveredParticipantId"
          :can-manage-roster="canManageRoster"
          :current-player-id="currentPlayerId"
          @row-highlight="hoveredParticipantId = $event"
          @row-unhighlight="hoveredParticipantId = null"
          @row-removePlayer="handleRemoveParticipant"
        />
      </div>
    </div>
    <p v-else class="mt-6 text-sm text-gray-500">Sin confirmados aún.</p>

    <div v-if="loading" class="mt-4 text-center text-sm text-gray-400">
      Cargando…
    </div>
  </div>
</template>
