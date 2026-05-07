<script setup lang="ts">
import type { Player } from "~/composables/useGetPlayerById";
import { PositionDisplayName } from "@ministrosfc/shared";

defineProps<{ player: Player }>();
</script>

<template>
  <div class="relative rounded-2xl py-6 mb-8 flex items-center gap-6">
    <div class="w-full">
      <div class="flex items-center gap-4 mb-2">
        <UiPositionLabel v-if="player.position" :position="player.position" />
        <div class="flex gap-x-3 items-baseline text-gray-400">
          <span v-if="player.position">{{
            PositionDisplayName[player.position]
          }}</span>
        </div>
      </div>
      <div class="flex items-center justify-between w-full">
        <div>
          <h1 class="text-8xl font-bold">
            {{ player.firstName }} {{ player.lastName }}
          </h1>
          <p v-if="player.nickname" class="text-gray-400 text-2xl">
            "{{ player.nickname }}"
          </p>
        </div>
        <div
          class="flex flex-col items-center gap-y-2 rounded-3xl bg-neutral-100 px-4 py-4"
        >
          <UiPositionNumber
            :jersey-number="player.jerseyNumber ?? null"
            :is-guest="player.playerType === 'GUEST'"
            :is-jersey="true"
            class="w-16 h-16"
          />
          <UiPlayerStatusBadge :status="player.status" />
        </div>
      </div>
    </div>
  </div>
</template>
