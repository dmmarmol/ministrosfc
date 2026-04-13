<script lang="ts" setup>
import { GameStatus, type GameSignupState } from "@ministrosfc/shared";

type Props = {
  gameStatus: GameStatus;
  signupUrl: string;
  signupState: GameSignupState | null;
};
defineProps<Props>();
</script>
<template>
  <!-- Signup CTA — outside the detail link, only for SCHEDULED games with a signupState -->
  <div
    v-if="gameStatus === GameStatus.SCHEDULED && signupState"
    class="px-4 pb-3 pt-0 flex items-center justify-end"
  >
    <NuxtLink
      v-if="signupState === 'available'"
      :to="signupUrl"
      class="text-xs font-semibold bg-brand text-gray-900 px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
    >
      Anotarme
    </NuxtLink>
    <span
      v-else-if="signupState === 'signed_up'"
      class="text-xs font-semibold text-green-700 flex items-center gap-1"
    >
      <span>✓</span> Confirmado
    </span>
    <span
      v-else-if="signupState === 'full'"
      class="text-xs font-semibold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg"
    >
      Completo
    </span>
  </div>
</template>
