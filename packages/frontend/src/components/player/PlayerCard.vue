<script setup lang="ts">
import type { PlayerPublic, Position } from "@ministrosfc/shared";

defineProps<{ player: PlayerPublic }>();
</script>

<template>
  <NuxtLink
    :to="`/players/${player.id}`"
    class="relative group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
  >
    <div class="absolute left-0 top-0 z-20 p-3 flex flex-col gap-y-2">
      <!-- Position Label -->
      <UiPositionLabel v-if="player.position" :position="player.position" />
      <!-- Jersey badge -->
      <span
        v-if="player.jerseyNumber"
        class="text-center bg-brand text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full"
      >
        #{{ player.jerseyNumber }}
      </span>
    </div>
    <!-- Photo -->
    <div class="aspect-square bg-gray-100 relative overflow-hidden">
      <img
        v-if="player.photoUrl"
        :src="player.photoUrl"
        :alt="`${player.firstName} ${player.lastName}`"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-4xl text-gray-300"
      >
        <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
          />
        </svg>
      </div>
    </div>
    <!-- Info -->
    <div class="p-3">
      <p class="font-semibold text-gray-900 text-sm truncate">
        {{ player.firstName }} {{ player.lastName }}
      </p>
      <p v-if="player.nickname" class="text-xs text-gray-400 italic truncate">
        {{ player.nickname }}
      </p>
    </div>
  </NuxtLink>
</template>
