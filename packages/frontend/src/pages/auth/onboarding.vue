<script setup lang="ts">
import { Position, PositionDisplayName } from "@ministrosfc/shared";
import { ref, computed, onMounted } from "vue";
import { useOnboarding } from "~/composables/useOnboarding";
import { useAuthStore } from "~/stores/auth";

definePageMeta({ layout: false });

const router = useRouter();
const authStore = useAuthStore();
const { loading, error, fetchStatus, completeOnboarding } = useOnboarding();

const isPlayer = ref(true);
const jerseyNumber = ref<number | null>(null);
const position = ref<Position | null>(null);

const POSITIONS: {
  value: Position;
  label: (typeof PositionDisplayName)[Position];
}[] = [
  { value: Position.GK, label: PositionDisplayName[Position.GK] },
  { value: Position.CB, label: PositionDisplayName[Position.CB] },
  { value: Position.RB, label: PositionDisplayName[Position.RB] },
  { value: Position.LB, label: PositionDisplayName[Position.LB] },
  { value: Position.RWB, label: PositionDisplayName[Position.RWB] },
  { value: Position.LWB, label: PositionDisplayName[Position.LWB] },
  { value: Position.DMF, label: PositionDisplayName[Position.DMF] },
  { value: Position.CMF, label: PositionDisplayName[Position.CMF] },
  { value: Position.AMF, label: PositionDisplayName[Position.AMF] },
  { value: Position.RMF, label: PositionDisplayName[Position.RMF] },
  { value: Position.LMF, label: PositionDisplayName[Position.LMF] },
  { value: Position.SS, label: PositionDisplayName[Position.SS] },
  { value: Position.CF, label: PositionDisplayName[Position.CF] },
  { value: Position.RWF, label: PositionDisplayName[Position.RWF] },
  { value: Position.LWF, label: PositionDisplayName[Position.LWF] },
];

const canSubmit = computed(() => {
  if (!isPlayer.value) return true;
  return position.value != null;
});

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await router.push("/login");
    return;
  }
  try {
    const status = await fetchStatus();
    if (!status.needsOnboarding) {
      await navigateAfterOnboarding();
    }
  } catch {
    // Stay on page — error is displayed
  }
});

async function navigateAfterOnboarding() {
  if (authStore.isEditor) {
    await router.push("/admin/dashboard");
  } else {
    await router.push("/player/games");
  }
}

async function handleSubmit() {
  try {
    await completeOnboarding({
      isPlayer: isPlayer.value,
      jerseyNumber: isPlayer.value ? jerseyNumber.value : null,
      position: isPlayer.value ? position.value : null,
    });
    await navigateAfterOnboarding();
  } catch {
    // error is handled by composable
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div
          class="w-16 h-16 bg-brand rounded-full mx-auto flex items-center justify-center text-gray-900 font-bold text-2xl mb-4"
        >
          M
        </div>
        <h1 class="text-2xl font-bold text-gray-900">
          Bienvenido a Ministros FC
        </h1>
        <p class="text-gray-500 text-sm mt-1">
          Completá tu perfil para continuar
        </p>
      </div>

      <div
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5"
      >
        <label
          for="isPlayer"
          class="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 cursor-pointer"
        >
          <input
            id="isPlayer"
            v-model="isPlayer"
            type="checkbox"
            class="mt-0.5 h-5 w-5 rounded border-gray-300 text-brand focus:ring-brand/50"
          />
          <div>
            <span class="text-sm font-medium text-gray-900"
              >¿Eres un jugador del equipo?</span
            >
            <p class="text-xs text-gray-500 mt-0.5">
              Si sos parte del plantel, marcá esta opción
            </p>
          </div>
        </label>

        <template v-if="isPlayer">
          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1"
              for="position"
            >
              ¿Cuál es tu posición en la cancha?
            </label>
            <select
              id="position"
              v-model="position"
              required
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
            >
              <option :value="null" disabled>Seleccioná una posición</option>
              <option
                v-for="pos in POSITIONS"
                :key="pos.value"
                :value="pos.value"
              >
                {{ pos.label }} ({{ pos.value }})
              </option>
            </select>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-1"
              for="jerseyNumber"
            >
              ¿Cuál es tu número de camiseta?
            </label>
            <input
              id="jerseyNumber"
              v-model.number="jerseyNumber"
              type="number"
              min="1"
              max="99"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              placeholder="Ej: 10 (opcional)"
            />
          </div>
        </template>

        <p
          v-if="error"
          class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"
        >
          {{ error }}
        </p>

        <button
          type="button"
          :disabled="loading || !canSubmit"
          class="w-full bg-brand text-gray-900 font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
          @click="handleSubmit"
        >
          {{ loading ? "Guardando…" : "Continuar" }}
        </button>
      </div>
    </div>
  </div>
</template>
