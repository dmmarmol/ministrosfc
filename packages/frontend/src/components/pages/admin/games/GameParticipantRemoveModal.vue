<script setup lang="ts">
import ConfirmationModal from "../../../ui/ConfirmationModal.vue";
import type { GameParticipantRow } from "./GameParticipantsFields.vue";
import { useGames } from "~/composables/useGames";

const props = defineProps<{
  open: boolean;
  gameId: string | null;
  participantToRemove: GameParticipantRow | null;
}>();

const emit = defineEmits<{
  (e: "update:participant", participantRow: GameParticipantRow | null): void;
  (e: "update:open", value: boolean): void;
}>();

const { removeGameParticipant } = useGames();

function onCancelRemoval() {
  emit("update:open", false);
  emit("update:participant", null);
}

async function confirmRemoveParticipant() {
  if (!props.participantToRemove || !props.gameId) return;

  const gameId = props.gameId;
  const participantId = props.participantToRemove.id;

  await removeGameParticipant(gameId, participantId);

  emit("update:open", false);
  /** @TODO consider using an Event bus to push a notification so parent component can re fetch participants */
  emit("update:participant", null);
}

function getDeleteParticipantDescription(
  participantToRemove: GameParticipantRow | null,
): string {
  return `¿Remover al jugador <strong>${participantToRemove?.playerName}</strong> de la lista de convocados?\nEsta acción no se puede deshacer.`;
}
</script>
<template>
  <ConfirmationModal
    :description="getDeleteParticipantDescription(props.participantToRemove)"
    :open="props.open"
    title="Remover jugador"
    confirm-text="Eliminar"
    cancel-text="Cancelar"
    :on-confirm="confirmRemoveParticipant"
    :on-cancel="onCancelRemoval"
    @update:open="(value) => emit('update:open', value)"
    @update:participant="
      (value: GameParticipantRow | null) => emit('update:participant', value)
    "
  />
</template>
