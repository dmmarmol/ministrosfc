<script setup lang="ts">
import { Position, PositionDisplayName } from "@ministrosfc/shared";
import { ref, computed, onMounted } from "vue";
import { useOnboarding } from "~/composables/useOnboarding";
import { useAuthStore } from "~/stores/auth";
import { useJerseyAvailability } from "~/composables/useJerseyAvailability";
import IsPlayerCheckbox from "~/components/ui/IsPlayerCheckbox.vue";
import BackButton from "~/components/ui/BackButton.vue";


const { t } = useI18n();
definePageMeta({
  layout: "sheet",
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
  // validate: allow only relative paths to prevent open redirect
  const safeRedirect = redirect && /^\/[^/]/.test(redirect) ? redirect : null;
  if (safeRedirect) {
    await router.push(safeRedirect);
  } else if (authStore.isEditor) {
    await router.push("/admin/dashboard");
  } else {
    await router.push("/");
  }
}

/**
 * Back button destination: go back to /login preserving the redirect param
 * so the user doesn't lose their original destination.
 * Only safe (relative) redirect values are forwarded.
 */
const backPath = computed(() => {
  const redirect = route.query.redirect as string | undefined;
  const safeRedirect = redirect && /^\/[^/]/.test(redirect) ? redirect : null;
  return safeRedirect
    ? `/login?redirect=${encodeURIComponent(safeRedirect)}`
    : "/login";
});

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
  <div class="mx-auto max-w-md px-4 pb-16 pt-6">
    <BackButton :to="backPath" :label="t('common.volve')" />
    <UiSheetTitle size="md" class="mt-2">
      {{ t("authOnboarding.bienvenidoAMinistrosFc") }}
    </UiSheetTitle>
    <p class="mt-2">{{ t("authOnboarding.completaTuPerfilPara") }}</p>

    <div class="mt-6 space-y-5 border-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)] p-5">
      <IsPlayerCheckbox
        v-model="isPlayer"
        :label="t('authOnboarding.eresUnJugadorDel')"
        :description="t('authOnboarding.siSosParteDel')"
      />

      <template v-if="isPlayer">
        <div>
          <label class="sheet-label" for="position">
            {{ t("authOnboarding.cualEsTuPosicion") }}
          </label>
          <select id="position" v-model="position" required class="sheet-field mt-1">
            <option :value="null" disabled>{{ t("authOnboarding.seleccionaUnaPosicion") }}</option>
            <option v-for="pos in POSITIONS" :key="pos.value" :value="pos.value">
              {{ pos.label }} ({{ pos.value }})
            </option>
          </select>
        </div>

        <div>
          <UiJerseyNumberInput
            v-model="jerseyNumber"
            :taken-numbers="takenJerseys"
            :label="t('authOnboarding.cualEsTuNumero')"
          />
        </div>
      </template>

      <p v-if="error" class="sheet-notice" data-tone="error" role="alert">
        {{ error }}
      </p>

      <button
        type="button"
        :disabled="loading || !canSubmit"
        class="sheet-button w-full"
        @click="handleSubmit"
      >
        {{ loading ? t("common.guardando") : t("authOnboarding.continuar") }}
      </button>
    </div>
  </div>
</template>
