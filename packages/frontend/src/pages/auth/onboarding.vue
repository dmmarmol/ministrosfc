<script setup lang="ts">
import { Position, PositionDisplayName } from "@ministrosfc/shared";
import { ref, computed, onMounted } from "vue";
import { useOnboarding } from "~/composables/useOnboarding";
import { useAuthStore } from "~/stores/auth";
import { useJerseyAvailability } from "~/composables/useJerseyAvailability";
import JerseyNumberInput from "~/components/ui/JerseyNumberInput.vue";
import IsPlayerCheckbox from "~/components/ui/IsPlayerCheckbox.vue";

definePageMeta({
  layout: false,
  middleware: "auth",
  requiresAuth: true,
  onboardingPage: true,
});

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { loading, error, fetchStatus, completeOnboarding } = useOnboarding();

const isPlayer = ref(true);
const jerseyNumber = ref<number | null>(null);
const position = ref<Position | null>(null);

const { taken: takenJerseys, fetch: fetchJerseyAvailability } =
  useJerseyAvailability();

const jerseyIsTaken = computed(
  () =>
    jerseyNumber.value !== null &&
    takenJerseys.value.includes(jerseyNumber.value),
);

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
  if (jerseyIsTaken.value) return false;
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
    } else {
      await fetchJerseyAvailability();
    }
  } catch {
    // Stay on page — error is displayed
  }
});

async function navigateAfterOnboarding() {
  const redirect = route.query.redirect as string | undefined;
  if (redirect) {
    await router.push(redirect);
  } else if (authStore.isEditor) {
    await router.push("/admin/dashboard");
  } else {
    await router.push("/");
  }
}

async function handleSubmit() {
  try {
    const result = await completeOnboarding({
      isPlayer: isPlayer.value,
      jerseyNumber: isPlayer.value ? jerseyNumber.value : null,
      position: isPlayer.value ? position.value : null,
    });
    // Update store so the middleware stops treating this user as needing onboarding
    if (authStore.user) {
      authStore.user = {
        ...authStore.user,
        onboardingCompletedAt: result.user.onboardingCompletedAt,
      };
    }
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
        <IsPlayerCheckbox
          v-model="isPlayer"
          label="¿Eres un jugador del equipo?"
          description="Si sos parte del plantel, marcá esta opción"
        />

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
              for="jerseyNumberInput"
            >
              ¿Cuál es tu número de camiseta?
            </label>
            <JerseyNumberInput
              v-model="jerseyNumber"
              :taken-numbers="takenJerseys"
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
