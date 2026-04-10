<script setup lang="ts">
import { ref } from "vue";
import type { CurrentPlayerStatus } from "@ministrosfc/shared";

const props = defineProps<{
  currentPlayerStatus: CurrentPlayerStatus;
  isFull: boolean;
}>();

const emit = defineEmits<{
  "signup-self": [];
  dismiss: [];
  "cancel-self": [];
}>();

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
  </template>
</template>
