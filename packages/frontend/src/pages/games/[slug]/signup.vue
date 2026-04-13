<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  useNuxtApp,
  useRoute,
  useAsyncData,
  createError,
  useHead,
  navigateTo,
  useRuntimeConfig,
} from "nuxt/app";
import { GameStatus, UserRole, DEFAULT_MAX_PLAYERS } from "@ministrosfc/shared";
import { useGameSignup } from "~/composables/useGameSignup";
import { useAuthStore } from "~/stores/auth";
import GameLineupField from "~/components/game/GameLineupField.vue";
import SignupGameHeader from "~/components/pages/games/signup/SignupGameHeader.vue";
import SignupPlayerTable from "~/components/pages/games/signup/SignupPlayerTable.vue";
import SignupRegistrationRow from "~/components/pages/games/signup/SignupRegistrationRow.vue";
import SignupAddPlayer from "~/components/pages/games/signup/SignupAddPlayer.vue";

// T022: auth guard — redirect unauthenticated to /login?redirect=...
definePageMeta({ middleware: "auth", requiresAuth: true });

// T022: noindex,nofollow (FR-015)
useHead({
  meta: [{ name: "robots", content: "noindex,nofollow" }],
});

const { $api } = useNuxtApp();
const route = useRoute();
const authStore = useAuthStore();
const config = useRuntimeConfig();
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
  unregisterSelf,
} = useGameSignup(gameId);

// T063: lineup always has a value now; fall back to default if somehow missing
const effectiveLineup = computed(() => game.value?.lineup ?? "4-4-2");

// T069: ADMIN/EDITOR/DT can remove any row; PLAYER sees button only on their own row
const canManageRoster = computed(() => {
  if (!authStore.user) {
    return false;
  }
  return [UserRole.ADMIN, UserRole.EDITOR, UserRole.DT].includes(
    authStore.user.role,
  );
});

useHead(() => ({
  title: game.value
    ? `Convocatoria vs ${game.value.opponentTeam?.name} – ${config.public.siteName}`
    : "Convocatoria",
}));

// T038: hover highlight state for field/table correlation
const hoveredParticipantId = ref<string | null>(null);

// T076: proxy loading/error state owned by page
const proxyLoading = ref(false);
const proxyError = ref<string | null>(null);

const isAddPlayerDisabled = computed(() => {
  return !(
    game.value?.status === GameStatus.SCHEDULED &&
    currentPlayerStatus.value === "signed_up" &&
    authStore.user?.role === UserRole.PLAYER &&
    !isFull.value
  );
});

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
  proxyLoading.value = true;
  proxyError.value = null;
  try {
    await signupProxy(targetPlayerId);
  } catch (e: any) {
    proxyError.value =
      e?.data?.message ?? e?.message ?? "Error al agregar jugador";
  } finally {
    proxyLoading.value = false;
  }
}

async function handleRemoveParticipant(participantId: string) {
  try {
    await removeParticipant(participantId);
  } catch {
    // error handled by composable
  }
}

async function handleCancelSelf() {
  await unregisterSelf();
}
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <!-- Error banner -->
    <div
      v-if="error"
      class="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg"
    >
      {{ error }}
    </div>

    <div class="grid gap-6 lg:grid-cols-12 mb-6">
      <div class="lg:col-span-6 flex">
        <!-- T051: Game header sub-component -->
        <SignupGameHeader
          v-if="game"
          :game="game"
          :confirmed-count="confirmedCount"
          :max-players="game.maxPlayers ?? null"
        />
      </div>
      <div class="lg:col-span-6 flex flex-col">
        <div class="mb-4">
          <!-- T076: Player-only add player widget (proxy + guest) -->
          <SignupAddPlayer
            :disabled="isAddPlayerDisabled"
            :confirmed-player-ids="
              roster.map((r) => r.player?.id).filter(Boolean)
            "
            :proxy-loading="proxyLoading"
            :proxy-error="proxyError"
            :is-full="isFull"
            :confirmed-count="confirmedCount"
            :max-players="game?.maxPlayers ?? DEFAULT_MAX_PLAYERS"
            @signup-proxy="handleSignupProxy"
            @signup-guest="handleSignupGuest"
          />
        </div>

        <!-- T053: Registration row (self + isFull) -->
        <SignupRegistrationRow
          v-if="game?.status === GameStatus.SCHEDULED"
          :current-player-status="currentPlayerStatus"
          :is-full="isFull"
          @signup-self="handleSignupSelf"
          @dismiss="() => {}"
          @cancel-self="handleCancelSelf"
        />
      </div>
    </div>

    <!-- T037: responsive layout — field + table side by side ≥768px, stacked on mobile -->
    <div v-if="roster.length" class="mt-6 md:grid md:grid-cols-12 md:gap-6">
      <!-- T037: Field (6/12 cols on md+, full-width on mobile) -->
      <div class="md:col-span-6 mb-6 md:mb-0">
        <!-- T064: formation label -->
        <p class="text-sm font-semibold text-gray-700 mb-3">
          Formación: {{ effectiveLineup }}
        </p>
        <GameLineupField
          :lineup="effectiveLineup"
          :roster="roster"
          @circle-hover="hoveredParticipantId = $event"
          @circle-unhover="hoveredParticipantId = null"
        />
      </div>

      <!-- T026+T052: Player table (6/12 cols) -->
      <div class="md:col-span-6">
        <SignupPlayerTable
          :roster="roster"
          :confirmed-count="confirmedCount"
          :max-players="game?.maxPlayers ?? null"
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
