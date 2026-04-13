<script setup lang="ts">
import type { CurrentPlayerStatus } from "@ministrosfc/shared";

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
    class="bg-green-50 border border-green-200 rounded-xl py-[0.57rem] px-4 flex items-center justify-between"
  >
    <span class="text-sm text-green-700 font-medium"
      >✓ Ya estás confirmado.</span
    >
    <button
      class="text-sm text-red-500 hover:text-red-700 font-medium"
      @click="$emit('cancel-self')"
    >
      Cancelar inscripción
    </button>
  </div>
  <button
    v-if="status === 'not_signed_up'"
    class="w-full bg-brand text-gray-900 font-semibold text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
    :disabled="loading"
    @click="emit('confirm')"
  >
    {{ loading ? "Confirmando…" : "Confirmar asistencia" }}
  </button>
</template>
