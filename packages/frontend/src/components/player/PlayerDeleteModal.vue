<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    role="dialog"
    aria-modal="true"
    :aria-label="`Delete player ${player.name}`"
    data-testid="player-delete-modal"
    @keydown.escape="$emit('cancel')"
    @click.self="$emit('cancel')"
  >
    <div class="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
      <h3 class="text-lg font-bold text-gray-900 mb-2">Eliminar Jugador</h3>
      <p class="text-sm text-gray-600 mb-1">
        ¿Estás seguro que deseas eliminar a
        <span class="font-semibold text-gray-900">{{ player.name }}</span
        >?
      </p>
      <p class="text-sm text-red-600 mb-6">
        Esta acción es <strong>permanente e irreversible</strong>. Se eliminarán
        todos los datos del jugador.
      </p>
      <div class="flex gap-3 justify-end">
        <button
          data-testid="cancel-delete"
          type="button"
          class="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          @click="$emit('cancel')"
        >
          Cancelar
        </button>
        <button
          data-testid="confirm-delete"
          type="button"
          class="text-sm px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
          @click="$emit('confirm')"
        >
          Eliminar Jugador
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  player: { id: string; name: string };
}>();

defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>
