<script setup lang="ts">
import { Position, PositionDisplayName } from "@ministrosfc/shared";
import { useGameSignup } from "~/composables/useGameSignup";
import { useAuthStore } from "~/stores/auth";
import GameLineupField from "~/components/game/GameLineupField.vue";

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
  game,
  load,
  signupSelf,
  signupGuest,
  signupProxy,
} = useGameSignup(gameId);

// Auth check + data load happen in onMounted (client-only, auth token available)

useHead(() => ({
  title: game.value
    ? `Convocatoria vs ${game.value.opponentTeam?.name} – Ministros FC`
    : "Convocatoria",
}));

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-AR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// --- Guest form (T024) ---
const guestMode = ref(false);
const guestFirst = ref("");
const guestLast = ref("");
const guestPosition = ref<string>("");
const guestLoading = ref(false);
const guestError = ref<string | null>(null);

function openGuestForm() {
  guestMode.value = true;
  guestFirst.value = "";
  guestLast.value = "";
  guestPosition.value = "";
  guestError.value = null;
}

function cancelGuestForm() {
  guestMode.value = false;
  guestError.value = null;
}

async function submitGuest() {
  if (!guestFirst.value.trim() || !guestLast.value.trim()) return;
  guestLoading.value = true;
  guestError.value = null;
  try {
    await signupGuest(
      guestFirst.value.trim(),
      guestLast.value.trim(),
      guestPosition.value || null,
    );
    guestMode.value = false;
  } catch (e: any) {
    guestError.value = e?.data?.message ?? e?.message ?? "Error al agregar";
  } finally {
    guestLoading.value = false;
  }
}

// --- Self signup (T024) ---
const selfLoading = ref(false);

async function handleSelf() {
  selfLoading.value = true;
  try {
    await signupSelf();
  } catch {
    // error handled by composable
  } finally {
    selfLoading.value = false;
  }
}

// --- Proxy search (T024) ---
const proxySearch = ref("");
const proxyLoading = ref(false);
const proxyPlayers = ref<any[]>([]);
const proxyError = ref<string | null>(null);

async function searchProxy() {
  if (!proxySearch.value.trim()) return;
  proxyLoading.value = true;
  try {
    const res = await $api<{ data: any[] }>("/api/v1/players", {
      query: {
        status: "ACTIVE",
        playerType: "REGISTERED",
        search: proxySearch.value.trim(),
        limit: 10,
      },
    });
    const confirmedIds = new Set(roster.value.map((r) => r.player.id));
    proxyPlayers.value = (res.data ?? []).filter(
      (p: any) => !confirmedIds.has(p.id),
    );
  } catch (e: any) {
    proxyError.value = e?.message ?? "Error al buscar";
  } finally {
    proxyLoading.value = false;
  }
}

async function confirmProxy(playerId: string) {
  proxyError.value = null;
  try {
    await signupProxy(playerId);
    proxySearch.value = "";
    proxyPlayers.value = [];
  } catch (e: any) {
    proxyError.value = e?.data?.message ?? e?.message ?? "Error";
  }
}

// T038: hover highlight state
const hoveredParticipantId = ref<string | null>(null);

const POSITIONS = Object.values(Position).map((p) => ({
  value: p,
  label: PositionDisplayName[p],
}));

// Auth check + load on client mount — token is available here, not during SSR
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await navigateTo(`/login?redirect=${encodeURIComponent(route.fullPath)}`);
    return;
  }
  await load();
});
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <!-- Game header -->
    <div v-if="game" class="bg-gray-900 text-white rounded-2xl p-6 mb-6">
      <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">
        {{ formatDate(game.date) }}
        <span v-if="game.playground?.name"> · {{ game.playground.name }}</span>
      </p>
      <div class="flex items-center justify-between gap-2">
        <span class="text-lg font-bold">Ministros FC</span>
        <span class="text-gray-400">vs</span>
        <span class="text-lg font-bold">{{ game.opponentTeam?.name }}</span>
      </div>
      <p class="text-sm text-gray-300 mt-2">
        Confirmados: <strong>{{ confirmedCount }}</strong>
        <span v-if="game.maxPlayers"> / {{ game.maxPlayers }}</span>
      </p>
    </div>

    <!-- Error banner -->
    <div
      v-if="error"
      class="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg"
    >
      {{ error }}
    </div>

    <!-- T025: Capacity full message -->
    <div
      v-if="isFull"
      class="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg text-center font-medium"
    >
      El cupo está completo.
    </div>

    <!-- T024: Signup actions (only when not full and game is SCHEDULED) -->
    <template v-if="!isFull && game?.status === 'SCHEDULED'">
      <!-- Self signup -->
      <div
        v-if="currentPlayerStatus === 'not_signed_up'"
        class="bg-white border border-gray-200 rounded-xl p-4 mb-4"
      >
        <p class="text-sm font-medium text-gray-700 mb-3">Tu inscripción</p>
        <button
          class="w-full bg-brand text-gray-900 font-semibold text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          :disabled="selfLoading"
          @click="handleSelf"
        >
          {{ selfLoading ? "Confirmando…" : "Confirmar asistencia" }}
        </button>
      </div>
      <div
        v-else-if="currentPlayerStatus === 'signed_up'"
        class="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-sm text-green-700 font-medium"
      >
        ✓ Ya estás confirmado para este partido.
      </div>

      <!-- Guest form (T024) -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <p class="text-sm font-medium text-gray-700 mb-3">Agregar invitado</p>
        <template v-if="!guestMode">
          <button
            class="text-sm text-brand hover:underline"
            @click="openGuestForm"
          >
            + Agregar invitado
          </button>
        </template>
        <template v-else>
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-gray-500 block mb-1">Nombre *</label>
                <input
                  v-model="guestFirst"
                  type="text"
                  placeholder="Nombre"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
              </div>
              <div>
                <label class="text-xs text-gray-500 block mb-1"
                  >Apellido *</label
                >
                <input
                  v-model="guestLast"
                  type="text"
                  placeholder="Apellido"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
              </div>
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1"
                >Posición (opcional)</label
              >
              <select
                v-model="guestPosition"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Sin posición</option>
                <option
                  v-for="pos in POSITIONS"
                  :key="pos.value"
                  :value="pos.value"
                >
                  {{ pos.label }}
                </option>
              </select>
            </div>
            <p v-if="guestError" class="text-xs text-red-600">
              {{ guestError }}
            </p>
            <div class="flex gap-2">
              <button
                class="flex-1 bg-brand text-gray-900 font-semibold text-sm py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                :disabled="
                  guestLoading || !guestFirst.trim() || !guestLast.trim()
                "
                @click="submitGuest"
              >
                {{ guestLoading ? "Agregando…" : "Confirmar" }}
              </button>
              <!-- T024: × dismiss restores default DropdownAddMore state -->
              <button
                class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg"
                @click="cancelGuestForm"
              >
                ✕
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- Proxy signup (T024) -->
      <div
        v-if="currentPlayerStatus !== 'not_player_role'"
        class="bg-white border border-gray-200 rounded-xl p-4 mb-4"
      >
        <p class="text-sm font-medium text-gray-700 mb-3">
          Agregar a otro jugador
        </p>
        <div class="flex gap-2 mb-2">
          <input
            v-model="proxySearch"
            type="text"
            placeholder="Buscar jugador…"
            class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
            @keyup.enter="searchProxy"
          />
          <button
            class="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            :disabled="proxyLoading"
            @click="searchProxy"
          >
            Buscar
          </button>
        </div>
        <p v-if="proxyError" class="text-xs text-red-600 mb-2">
          {{ proxyError }}
        </p>
        <div v-if="proxyPlayers.length" class="space-y-1">
          <div
            v-for="p in proxyPlayers"
            :key="p.id"
            class="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm"
          >
            <span>{{ p.firstName }} {{ p.lastName }}</span>
            <button
              class="text-xs text-brand hover:underline font-medium"
              @click="confirmProxy(p.id)"
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- T037: responsive layout — field + table side by side ≥768px, stacked on mobile -->
    <!-- T037: field hidden when lineup is null (FR-022) -->
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

      <!-- T026: Roster table (4/12 cols on md+ with field, full-width without) -->
      <div :class="game?.lineup ? 'md:col-span-4' : ''">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">
          Confirmados ({{ confirmedCount
          }}<span v-if="game?.maxPlayers"> / {{ game.maxPlayers }}</span
          >)
        </h3>
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div
            v-for="(entry, idx) in roster"
            :key="entry.participantId"
            class="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 text-sm transition-colors"
            :class="
              hoveredParticipantId === entry.participantId ? 'bg-yellow-50' : ''
            "
          >
            <span
              class="text-gray-400 text-xs w-5 text-right flex-shrink-0 mt-0.5"
            >
              {{ idx + 1 }}
            </span>
            <span
              class="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5"
              :class="
                entry.player.playerType === 'GUEST'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
              "
            >
              {{ entry.player.playerType === "GUEST" ? "Inv." : "Reg." }}
            </span>
            <span class="text-xs text-gray-500 w-8 flex-shrink-0 mt-0.5">
              {{ entry.player.position ?? "—" }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 truncate">
                <span
                  v-if="
                    entry.player.playerType !== 'GUEST' &&
                    entry.player.jerseyNumber
                  "
                  class="text-gray-400 text-xs mr-1"
                  >#{{ entry.player.jerseyNumber }}</span
                >
                {{ entry.player.firstName }}
                {{
                  entry.player.playerType === "GUEST"
                    ? ""
                    : entry.player.lastName
                }}
              </p>
              <p
                v-if="
                  entry.player.playerType === 'GUEST' &&
                  entry.player.invitedByName
                "
                class="text-xs text-gray-400 truncate"
              >
                Invitado por {{ entry.player.invitedByName }}
              </p>
              <p
                v-else-if="
                  entry.confirmedById &&
                  entry.player.playerType !== 'GUEST' &&
                  entry.confirmedByName
                "
                class="text-xs text-gray-400 truncate"
              >
                Agregado por {{ entry.confirmedByName }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="mt-6 text-sm text-gray-500">Sin confirmados aún.</p>

    <div v-if="loading" class="mt-4 text-center text-sm text-gray-400">
      Cargando…
    </div>
  </div>
</template>
