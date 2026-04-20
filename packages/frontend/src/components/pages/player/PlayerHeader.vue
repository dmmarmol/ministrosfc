<script setup lang="ts">
import type { Player } from "~/composables/useGetPlayerById";
import { PositionDisplayName } from "@ministrosfc/shared";

defineProps<{ player: Player }>();
</script>

<template>
  <div
    class="relative bg-gray-900 text-white rounded-2xl p-6 mb-8 flex items-center gap-6"
  >
    <span
      class="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full"
      :class="
        player.status === 'ACTIVE'
          ? 'bg-green-500/20 text-green-300 ring-1 ring-green-500/40'
          : 'bg-gray-500/20 text-gray-400 ring-1 ring-gray-500/40'
      "
    >
      {{ player.status === "ACTIVE" ? "Activo" : "Inactivo" }}
    </span>
    <div
      class="w-24 h-24 rounded-full overflow-hidden bg-gray-700 flex-shrink-0"
    >
      <img
        v-if="player.photoUrl"
        :src="player.photoUrl"
        :alt="`${player.firstName} ${player.lastName}`"
        class="w-full h-full object-cover"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-3xl text-gray-500"
      >
        👤
      </div>
    </div>
    <div>
      <h1 class="text-2xl font-bold">
        {{ player.firstName }} {{ player.lastName }}
      </h1>
      <p v-if="player.nickname" class="text-gray-400 text-sm">
        "{{ player.nickname }}"
      </p>
      <div class="flex gap-4 mt-2 text-sm text-gray-300">
        <div class="flex gap-x-3 items-baseline">
          <UiPositionLabel v-if="player.position" :position="player.position" />
          <span v-if="player.position" class="text-gray-300">{{
            PositionDisplayName[player.position]
          }}</span>
          <span v-if="player.jerseyNumber">#{{ player.jerseyNumber }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
