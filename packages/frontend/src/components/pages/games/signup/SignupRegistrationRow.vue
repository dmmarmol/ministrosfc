<script setup lang="ts">
import { ref } from "vue";
import { useNuxtApp } from "nuxt/app";
import { Position, PositionDisplayName } from "@ministrosfc/shared";
import type {
  CurrentPlayerStatus,
  ApiResponse,
  PlayerPublic,
} from "@ministrosfc/shared";
import { PlayerStatus, PlayerType } from "@ministrosfc/shared";

const props = defineProps<{
  currentPlayerStatus: CurrentPlayerStatus;
  isFull: boolean;
  confirmedPlayerIds: string[];
}>();

const emit = defineEmits<{
  "signup-self": [];
  "signup-guest": [
    firstName: string,
    lastName: string,
    position: string | null,
  ];
  "signup-proxy": [targetPlayerId: string];
  dismiss: [];
  "cancel-self": [];
}>();

const { $api } = useNuxtApp();

const POSITIONS = Object.values(Position).map((p) => ({
  value: p,
  label: PositionDisplayName[p],
}));

// --- Self signup ---
const selfLoading = ref(false);

async function handleSelf() {
  selfLoading.value = true;
  try {
    emit("signup-self");
  } finally {
    selfLoading.value = false;
  }
}

// --- Guest form ---
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
  emit("dismiss");
}

async function submitGuest() {
  if (!guestFirst.value.trim() || !guestLast.value.trim()) return;
  guestLoading.value = true;
  guestError.value = null;
  try {
    emit(
      "signup-guest",
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

// --- Proxy search ---
const proxySearch = ref("");
const proxyLoading = ref(false);
const proxyPlayers = ref<PlayerPublic[]>([]);
const proxyError = ref<string | null>(null);

async function searchProxy() {
  if (!proxySearch.value.trim()) return;
  proxyLoading.value = true;
  proxyError.value = null;
  try {
    const res = await $api<ApiResponse<PlayerPublic[]>>("/api/v1/players", {
      query: {
        status: PlayerStatus.ACTIVE,
        playerType: PlayerType.REGISTERED,
        search: proxySearch.value.trim(),
        limit: 10,
      },
    });
    const confirmed = new Set(props.confirmedPlayerIds);
    proxyPlayers.value = (res.data ?? []).filter(
      (p: PlayerPublic) => !confirmed.has(p.id),
    );
  } catch (e: any) {
    proxyError.value = e?.message ?? "Error al buscar";
  } finally {
    proxyLoading.value = false;
  }
}

function confirmProxy(playerId: string) {
  proxyError.value = null;
  emit("signup-proxy", playerId);
  proxySearch.value = "";
  proxyPlayers.value = [];
}
</script>

<template>
  <!-- Capacity full -->
  <div
    v-if="props.isFull"
    class="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg text-center font-medium"
  >
    El cupo está completo.
  </div>

  <template v-else>
    <!-- Self signup -->
    <div
      v-if="props.currentPlayerStatus === 'not_signed_up'"
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
      v-else-if="props.currentPlayerStatus === 'signed_up'"
      class="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center justify-between"
    >
      <span class="text-sm text-green-700 font-medium"
        >✓ Ya estás confirmado para este partido.</span
      >
      <button
        class="text-sm text-red-500 hover:text-red-700 font-medium ml-4"
        @click="$emit('cancel-self')"
      >
        Cancelar inscripción
      </button>
    </div>

    <!-- Guest form -->
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
              <label class="text-xs text-gray-500 block mb-1">Apellido *</label>
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
          <p v-if="guestError" class="text-xs text-red-600">{{ guestError }}</p>
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

    <!-- Proxy search -->
    <div
      v-if="props.currentPlayerStatus !== 'not_player_role'"
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
</template>
