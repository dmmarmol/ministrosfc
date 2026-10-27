<script setup lang="ts">
import {
  GameStatus,
  UserRole,
  type Game,
  type GameParticipant,
} from "@ministrosfc/shared";
import { useAuthStore } from "~/stores/auth";

type Props = {
  game: Game;
  participants: GameParticipant[];
};
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "signup", gameId: string): void;
}>();

const authStore = useAuthStore();
const { isUserSignedUp } = useGameSignup(props.game.id);

const isGameCompleted = computed(
  () => props.game?.status === GameStatus.COMPLETED,
);
const isTeamFull = computed(
  () =>
    props.game?.maxPlayers != null &&
    props.participants.length >= props.game.maxPlayers,
);
const isUserAParticipant = computed(() => {
  if (authStore.user?.onboardingCompletedAt === null) {
    return false;
  }

  return props.participants.some(
    (participant) => participant.playerId === authStore.user?.playerId,
  );
});

const showSignupLink = computed(
  () =>
    authStore.isAuthenticated &&
    !isUserAParticipant.value &&
    !isTeamFull.value &&
    isUserSignedUp.value &&
    authStore.user?.role === UserRole.PLAYER &&
    props.game?.status === GameStatus.SCHEDULED,
);
</script>
<template>
  <div class="grid lg:grid-cols-3">
    <div>
      <h2 class="text-lg font-bold text-gray-800">
        Confirmados ({{ props.participants.length
        }}<span v-if="props.game.maxPlayers">
          / {{ props.game.maxPlayers }}</span
        >)
      </h2>
    </div>
    <div class="lg:text-center">
      <!-- Signup CTA for authenticated players (FR-042) -->
      <UButton
        v-if="showSignupLink"
        :onClick="() => emit('signup', props.game.id)"
        class="flex items-center justify-center w-full"
        variant="solid"
        color="primary"
      >
        Anotarse a este partido
      </UButton>
    </div>
    <div class="text-lg font-bold justify-end flex">
      <p
        v-if="isTeamFull"
        class="flex items-center gap-1.5 justify-end text-green-600"
      >
        <CheckCircleIcon class="w-5 h-5" /> El equipo ya está completo
      </p>
      <p v-else-if="isUserAParticipant">Ya estás anotado a este partido</p>
      <p v-else-if="!isGameCompleted">Puedes anotarte a este partido</p>
      <p v-else>Partido finalizado</p>
    </div>
  </div>
</template>
