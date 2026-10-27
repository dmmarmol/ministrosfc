<script setup lang="ts">
import type { GameParticipant } from "@ministrosfc/shared";
import ConfirmationModal from "../../../ui/ConfirmationModal.vue";
import { useAdminGamesStore } from "~/stores/admin-games";
import { useGames } from "~/composables/useGames";

const props = defineProps<{
  open: boolean;
  gameId: string | null;
}>();

const { removeGameParticipant } = useGames();
const store = useAdminGamesStore();

function onCancelRemoval() {
  store.cancelRemoveParticipant();
}

async function confirmRemoveParticipant() {
  if (!store.selectedParticipantId || !props.gameId) return;

  const gameId = props.gameId;
  const participantId = store.selectedParticipantId;

  const refreshedGame = await removeGameParticipant(gameId, participantId);
  // Refresh the game data after removing the participant
  store.setSelectedGame(refreshedGame);
  store.cancelRemoveParticipant();
}

function getDeleteParticipantDescription(participantId: string | null): string {
  const selectedParticipant: GameParticipant | null =
    store.getParticipantFromGame(participantId);
  return `¿Remover al jugador <strong>${selectedParticipant?.player.firstName} ${selectedParticipant?.player.lastName}</strong> de la lista de convocados?\nEsta acción no se puede deshacer.`;
}
</script>
<template>
  <ConfirmationModal
    :description="getDeleteParticipantDescription(store.selectedParticipantId)"
    :open="props.open"
    title="Remover jugador"
    confirm-text="Eliminar"
    cancel-text="Cancelar"
    :on-confirm="confirmRemoveParticipant"
    :on-cancel="onCancelRemoval"
    @update:open="(value) => emit('update:open', value)"
  />
</template>
