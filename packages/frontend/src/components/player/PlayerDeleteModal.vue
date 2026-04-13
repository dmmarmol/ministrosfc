<script setup lang="ts">
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";

const props = defineProps<{
  player: { id: string; firstName: string; lastName: string };
}>();

defineEmits<{
  confirm: [];
  cancel: [];
}>();

function getDeletePlayerDescription(): string {
  return `¿Estás seguro que deseas eliminar a ${props.player.firstName} ${props.player.lastName}? Esta acción es permanente e irreversible.`;
}
</script>

<template>
  <ConfirmationModal
    :open="true"
    title="Eliminar Jugador"
    :description="getDeletePlayerDescription()"
    confirm-text="Eliminar Jugador"
    cancel-text="Cancelar"
    :on-confirm="() => $emit('confirm')"
    :on-cancel="() => $emit('cancel')"
    data-testid="player-delete-modal"
  />
</template>
