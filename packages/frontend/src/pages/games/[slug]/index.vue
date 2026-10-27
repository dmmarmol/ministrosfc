<script setup lang="ts">
import { useRoute, useHead, useRouter } from "nuxt/app";
import GameParticipantsTable from "../../../components/pages/games/GameParticipantsTable.vue";
import { useGameBySlug } from "~/composables/useGameBySlug";

definePageMeta({ public: true });
const route = useRoute();
const slug = route.params.slug as string;
const router = useRouter();

// T027: resolve slug → UUID, then fetch full game + participants
const { game, participants, pending } = useGameBySlug(slug);

useHead(() => ({
  title: game.value
    ? `vs ${game.value.opponentTeam?.name} – Ministros FC`
    : "Game",
}));

function handleSignUp(gameId: string) {
  router.push({ path: `/games/${gameId}/signup` });
}
</script>

<template>
  <div>
    <div v-if="pending" class="space-y-4">
      <div class="h-48 bg-gray-200 animate-pulse rounded-2xl" />
    </div>
    <template v-else-if="game">
      <div class="mb-8">
        <GameHeader :game="game" />
      </div>

      <div class="mb-4">
        <GameMetadataRow
          :game="game"
          :participants="participants"
          @signup="handleSignUp"
        />
      </div>

      <GameParticipantsTable
        v-if="participants.length"
        :participants="participants"
      />
      <p v-else class="text-gray-500 text-sm">
        Aun no hay jugadores confirmados.
      </p>
    </template>
    <div v-else class="text-center py-16 text-gray-500">Game not found.</div>
  </div>
</template>
