<script setup lang="ts">
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";


const { t } = useI18n();
const props = defineProps<{
  player: { id: string; firstName: string; lastName: string };
}>();

defineEmits<{
  confirm: [];
  cancel: [];
}>();

function getDeletePlayerDescription(): string {
  return t("playerDeleteModal.description", {
    name: `${props.player.firstName} ${props.player.lastName}`,
  });
}
</script>

<template>
  <ConfirmationModal
    :open="true"
    :title="t('playerPlayerDeleteModal.eliminarJugador')"
    :description="getDeletePlayerDescription()"
    confirm-text="Eliminar Jugador"
    cancel-text="Cancelar"
    :on-confirm="() => $emit('confirm')"
    :on-cancel="() => $emit('cancel')"
    data-testid="player-delete-modal"
  />
</template>
