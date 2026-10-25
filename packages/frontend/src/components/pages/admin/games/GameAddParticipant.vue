<script setup lang="ts">
import type { SelectItem } from "@nuxt/ui";
import type { Game } from "@ministrosfc/shared";
import { PlayerStatus } from "@ministrosfc/shared";

type Props = {
  game: Game | null;
};

const props = withDefaults(defineProps<Props>(), {
  game: null,
});

const modelValue = ref<string | null>(null);

const { availablePlayers } = useStatisticsAvailablePlayers(PlayerStatus.ACTIVE);
const nonParticipantPlayers = computed<SelectItem[]>(() => {
  return availablePlayers.value.filter((player) => {
    const playerId = player.value;
    const isPlayerAlreadyParticipating = props.game?.participants.find(
      (participant) => participant.playerId === playerId,
    );
    return !isPlayerAlreadyParticipating;
  });
});

const { addGameParticipant, fetchGameById } = useGames();
const store = useAdminGamesStore();

watch(
  () => store.selectedParticipantId,
  () => {
    modelValue.value = null;
  },
);

// Handle the updated model value here
async function handleSelectPlayer(participantId: string | null) {
  if (!participantId || !props.game?.id) {
    store.setSelectedParticipantId(null);
    return;
  }

  store.setSelectedParticipantId(participantId);
  await addGameParticipant(props.game.id, participantId);
  // Refresh the game data after adding the participant
  debugger;
  const refreshedGame: Game = await fetchGameById(props.game.id);
  store.setSelectedGame(refreshedGame);
}
</script>
<template>
  <div class="mb-4">
    <h3 class="text-md font-semibold text-gray-800">Anotar jugador</h3>
  </div>
  <div>
    <USelectMenu
      id="player-select"
      :model-value="modelValue"
      @update:model-value="handleSelectPlayer"
      :items="nonParticipantPlayers"
      value-key="value"
      label-key="label"
      placeholder="Seleccionar Jugador"
      :search-input="true"
      :clear="true"
      class="w-full"
      :ui="{ content: 'min-w-fit' }"
    />
  </div>
</template>
