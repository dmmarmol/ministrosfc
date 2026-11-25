<script setup lang="ts">
import type { CurrentPlayerStatus } from "@ministrosfc/shared";


const { t } = useI18n();
const props = defineProps<{
  status: CurrentPlayerStatus;
  loading: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
  "cancel-self": [];
}>();
</script>

<template>
  <div
    v-if="status === 'signed_up'"
    class="bg-sheet-win/10 border border-sheet-win/40 rounded-xl py-[0.57rem] px-4 flex items-center justify-between"
  >
    <span class="text-sm text-sheet-win font-medium"
      >{{ t("signupSignupSelfSection.yaEstasConfirmado") }}</span
    >
    <button
      class="text-sm text-sheet-loss hover:text-sheet-loss font-medium"
      @click="$emit('cancel-self')"
    >
      {{ t("signupSignupSelfSection.cancelarInscripcion") }}
    </button>
  </div>
  <button
    v-if="status === 'not_signed_up'"
    class="w-full bg-brand text-gray-900 font-semibold text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
    :disabled="loading"
    @click="emit('confirm')"
  >
    {{ loading ? t("signupSignupSelfSection.confirmando") : t("signupSignupSelfSection.confirmarAsistencia") }}
  </button>
</template>
