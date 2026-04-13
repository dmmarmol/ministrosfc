<script setup lang="ts">
defineProps<{
  participants: any[];
}>();
</script>

<template>
  <div>
    <h2 class="text-lg font-bold text-gray-800 mb-4">
      Jugadores ({{ participants.length }})
    </h2>
    <div
      v-if="participants.length"
      class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div
        v-for="p in participants"
        :key="p.id"
        class="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0"
      >
        <span class="text-gray-400 text-xs w-5 text-right">
          {{ p.player?.jerseyNumber ?? "—" }}
        </span>
        <span
          class="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
          :class="
            p.player?.playerType === 'GUEST'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-green-100 text-green-700'
          "
        >
          {{ p.player?.playerType === "GUEST" ? "Inv." : "Reg." }}
        </span>
        <span class="text-xs text-gray-500 w-8 flex-shrink-0">
          {{ p.player?.position ?? "—" }}
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-800 truncate">
            {{
              p.player?.playerType === "GUEST"
                ? p.player.firstName
                : `${p.player?.firstName} ${p.player?.lastName}`
            }}
          </p>
          <p
            v-if="p.player?.playerType === 'GUEST'"
            class="text-xs text-gray-400 truncate"
          >
            Invitado por
            {{
              p.confirmedBy
                ? `${p.confirmedBy.firstName} ${p.confirmedBy.lastName}`
                : "—"
            }}
          </p>
        </div>
        <span class="text-xs text-gray-500 capitalize flex-shrink-0">
          {{ p.confirmationStatus?.toLowerCase().replace(/_/g, " ") }}
        </span>
      </div>
    </div>
    <p v-else class="text-gray-500 text-sm">No hay jugadores confirmados.</p>
  </div>
</template>
