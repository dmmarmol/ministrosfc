<script setup lang="ts">
const props = defineProps<{
  status: "not_signed_up" | "signed_up" | "not_player_role";
  loading: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
}>();
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4 mb-4">
    <p class="text-sm font-medium text-gray-700 mb-3">Tu inscripción</p>
    <button
      v-if="status === 'not_signed_up'"
      class="w-full bg-brand text-gray-900 font-semibold text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      :disabled="loading"
      @click="emit('confirm')"
    >
      {{ loading ? "Confirmando…" : "Confirmar asistencia" }}
    </button>
    <div
      v-else-if="status === 'signed_up'"
      class="text-sm text-green-700 font-medium"
    >
      ✓ Ya estás confirmado para este partido.
    </div>
  </div>
</template>
