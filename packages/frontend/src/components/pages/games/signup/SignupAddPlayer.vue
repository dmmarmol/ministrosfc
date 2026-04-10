<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
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
  isFull: boolean;
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

// DropdownAddMore requires an onCreate prop — not used in pure-selector mode
const noopCreate = () => Promise.reject(new Error("Not used"));

// --- Guest form ---
const guestFirst = ref("");
const guestLast = ref("");
const guestPosition = ref("");
const guestError = ref<string | null>(null);

const POSITIONS = Object.values(Position).map((p) => ({
  value: p,
  label: PositionDisplayName[p],
}));

function openGuestForm() {
  guestFirst.value = "";
  guestLast.value = "";
  guestPosition.value = "";
  guestError.value = null;
  mode.value = "guest";
}

function cancelGuest() {
  mode.value = "dropdown";
  guestError.value = null;
}

function submitGuest() {
  if (!guestFirst.value.trim() || !guestLast.value.trim()) return;
  emit(
    "signup-guest",
    guestFirst.value.trim(),
    guestLast.value.trim(),
    guestPosition.value || null,
  );
  mode.value = "dropdown";
  guestFirst.value = "";
  guestLast.value = "";
  guestPosition.value = "";
  guestError.value = null;
}
</script>

<template>
  <div
    v-if="!isFull"
    class="relative bg-white border border-gray-200 rounded-xl p-4 mb-4"
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
      <p class="text-sm font-medium text-gray-700 mb-3">Agregar otro jugador</p>
      <DropdownAddMore
        :model-value="null"
        :options="dropdownOptions"
        :disabled="proxyLoading || fetchLoading"
        :loading="fetchLoading"
        :on-create="noopCreate"
        :labels="{ addNew: '' }"
        @select="onPlayerSelected"
      />
      <!-- "Agregar invitado" trigger — rendered outside DropdownAddMore (plan.md C1 fix) -->
      <button
        data-testid="open-guest-form"
        class="mt-2 text-sm text-brand hover:underline"
        @click="openGuestForm"
      >
        + Agregar invitado
      </button>
      <p v-if="proxyError" class="text-xs text-red-600 mt-2">
        {{ proxyError }}
      </p>
    </template>

    <!-- GUEST mode form (v-else) — completely replaces dropdown (FR-039) -->
    <template v-else>
      <p class="text-sm font-medium text-gray-700 mb-3 pr-6">
        Agregar invitado
      </p>
      <div data-testid="guest-form" class="space-y-3 pr-6">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-500 block mb-1">Nombre *</label>
            <input
              v-model="guestFirst"
              data-testid="guest-first"
              type="text"
              placeholder="Nombre"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 block mb-1">Apellido *</label>
            <input
              v-model="guestLast"
              data-testid="guest-last"
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
            data-testid="guest-position"
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
        <button
          data-testid="guest-submit"
          class="w-full bg-brand text-gray-900 font-semibold text-sm py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          :disabled="!guestFirst.trim() || !guestLast.trim()"
          @click="submitGuest"
        >
          Confirmar
        </button>
      </div>
    </template>
  </div>
</template>
