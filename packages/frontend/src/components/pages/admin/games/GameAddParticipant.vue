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
const selectedPlayer = ref<string | null>(null);
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

const { addGameParticipant } = useGames();

watch(selectedPlayer, () => {
  // when selectedPlayer changes, refresh the nonParticipantPlayers list
  // the nonParticipantPlayers list will automatically update due to the computed property
  modelValue.value = null;
});

// Handle the updated model value here
async function handleSelectPlayer(participantId: string | null) {
  if (!participantId || !props.game?.id) {
    selectedPlayer.value = null;
    return;
  }

  selectedPlayer.value = participantId;
  await addGameParticipant(props.game.id, participantId);
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
