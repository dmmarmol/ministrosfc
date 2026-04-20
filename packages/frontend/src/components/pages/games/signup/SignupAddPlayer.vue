<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useNuxtApp } from "nuxt/app";
import type { ApiResponse, PlayerPublic } from "@ministrosfc/shared";
import {
  PlayerStatus,
  PlayerType,
  Position,
  PositionDisplayName,
} from "@ministrosfc/shared";
import DropdownAddMore from "~/components/ui/DropdownAddMore.vue";
import type { DropdownOption } from "~/components/ui/DropdownAddMore.vue";

const props = defineProps<{
  confirmedPlayerIds: string[];
  proxyLoading: boolean;
  proxyError: string | null;
  disabled: boolean;
  isFull: boolean;
  confirmedCount: number;
  maxPlayers: number;
}>();

const emit = defineEmits<{
  "signup-proxy": [playerId: string];
  "signup-guest": [
    firstName: string,
    lastName: string,
    position: string | null,
  ];
}>();

// --- Mode ---
const mode = ref<"dropdown" | "guest">("dropdown");

// --- Player catalogue (fetched on mount) ---
const { $api } = useNuxtApp();
const fetchLoading = ref(false);
const allPlayers = ref<PlayerPublic[]>([]);

const dropdownOptions = computed<DropdownOption[]>(() => {
  const excluded = new Set(props.confirmedPlayerIds);
  return allPlayers.value
    .filter((p) => !excluded.has(p.id))
    .map((p) => ({ id: p.id, label: `${p.firstName} ${p.lastName}` }));
});

const isInteractionDisabled = computed(() => props.disabled || props.isFull);

onMounted(async () => {
  fetchLoading.value = true;
  try {
    const res = await $api<ApiResponse<PlayerPublic[]>>("/api/v1/players", {
      query: {
        status: PlayerStatus.ACTIVE,
        playerType: PlayerType.REGISTERED,
      },
    });
    allPlayers.value = res.data ?? [];
  } finally {
    fetchLoading.value = false;
  }
});

// --- Dropdown handlers ---
function onPlayerSelected(option: DropdownOption) {
  emit("signup-proxy", option.id);
}

// --- Guest form ---
const guestFirst = ref("");
const guestPosition = ref("");
const guestError = ref<string | null>(null);

const POSITIONS = Object.values(Position).map((p) => ({
  value: p,
  label: PositionDisplayName[p],
}));

function openGuestForm() {
  if (isInteractionDisabled.value) return;
  guestFirst.value = "";
  guestPosition.value = "";
  guestError.value = null;
  mode.value = "guest";
}

function cancelGuest() {
  mode.value = "dropdown";
  guestError.value = null;
}

watch(
  () => isInteractionDisabled.value,
  (disabled) => {
    if (disabled && mode.value === "guest") {
      cancelGuest();
    }
  },
);

function submitGuest() {
  if (!guestFirst.value.trim()) return;
  emit(
    "signup-guest",
    guestFirst.value.trim(),
    "",
    guestPosition.value || null,
  );
  mode.value = "dropdown";
  guestFirst.value = "";
  guestPosition.value = "";
  guestError.value = null;
}
</script>

<template>
  <div
    :class="[
      'relative  border-gray-300  p-4 flex-1',
      isInteractionDisabled
        ? 'bg-gray-100 border-t border-r border-l rounded-t-xl'
        : 'bg-white border rounded-xl',
    ]"
  >
    <!-- GUEST mode: × dismiss at far top-right of container (FR-039) -->
    <button
      v-if="mode === 'guest'"
      data-testid="dismiss-guest"
      class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg leading-none"
      aria-label="Cerrar formulario"
      @click="cancelGuest"
    >
      ✕
    </button>

    <!-- DROPDOWN mode (v-if) -->
    <template v-if="mode === 'dropdown'">
      <div class="flex flex-col h-full justify-between">
        <div class="w-full">
          <div class="flex justify-between">
            <p class="text-sm font-medium text-gray-700 mb-3">
              Agregar otro jugador
            </p>
            <p class="text-sm text-gray-700">
              Confirmados: <strong>{{ confirmedCount }}</strong>
              <span v-if="maxPlayers"> / {{ maxPlayers }}</span>
            </p>
          </div>
          <DropdownAddMore
            :model-value="null"
            :options="dropdownOptions"
            :disabled="isInteractionDisabled || proxyLoading || fetchLoading"
            :loading="fetchLoading"
            :labels="{
              placeholder: 'Seleccionar jugador',
              addNew: '', // hide internal 'add more' trigger — separate button used instead (plan.md C1 fix)
            }"
            @select="onPlayerSelected"
          />
        </div>
        <!-- "Agregar invitado" trigger — rendered outside DropdownAddMore (plan.md C1 fix) -->
        <button
          data-testid="open-guest-form"
          class="mt-2 self-end text-sm text-brand hover:underline"
          :class="
            isInteractionDisabled
              ? 'opacity-50 cursor-not-allowed hover:no-underline'
              : ''
          "
          :disabled="isInteractionDisabled"
          @click="openGuestForm"
        >
          + Agregar invitado
        </button>
        <p v-if="proxyError" class="text-xs text-red-600 mt-2">
          {{ proxyError }}
        </p>
      </div>
    </template>

    <!-- GUEST mode form (v-else) — completely replaces dropdown (FR-039) -->
    <template v-else>
      <p class="text-sm font-medium text-gray-700 mb-3">Agregar invitado</p>
      <div data-testid="guest-form" class="space-y-3">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label class="text-xs text-gray-500 block mb-1">Nombre *</label>
            <input
              v-model="guestFirst"
              data-testid="guest-first"
              type="text"
              placeholder="Nombre"
              :disabled="isInteractionDisabled"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 block mb-1"
              >Posición (opcional)</label
            >
            <select
              v-model="guestPosition"
              data-testid="guest-position"
              :disabled="isInteractionDisabled"
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
        </div>
        <p v-if="guestError" class="text-xs text-red-600">{{ guestError }}</p>
        <button
          data-testid="guest-submit"
          class="w-full bg-brand text-gray-900 font-semibold text-sm py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          :disabled="isInteractionDisabled || !guestFirst.trim()"
          @click="submitGuest"
        >
          Confirmar
        </button>
      </div>
    </template>
  </div>
  <div
    v-if="isInteractionDisabled"
    class="bg-gray-200 border border-gray-300 py-1.5 px-2 rounded-b-xl"
  >
    <p
      data-testid="add-player-disabled-hint"
      class="text-xs text-gray-500 w-full text-center"
    >
      {{
        isFull
          ? "El cupo está completo."
          : "Confirmá tu asistencia para habilitar esta sección."
      }}
    </p>
  </div>
</template>
