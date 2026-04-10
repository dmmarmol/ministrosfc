<script setup lang="ts">
import type { RosterEntry } from "@ministrosfc/shared";

const props = defineProps<{
  roster: RosterEntry[];
  highlightedParticipantId?: string | null;
}>();

const emit = defineEmits<{
  "row-highlight": [participantId: string];
  "row-unhighlight": [];
}>();
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
    <div
      v-for="(entry, idx) in props.roster"
      :key="entry.participantId"
      class="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 text-sm transition-colors"
      :class="
        props.highlightedParticipantId === entry.participantId
          ? 'bg-yellow-50'
          : ''
      "
      @mouseenter="emit('row-highlight', entry.participantId)"
      @mouseleave="emit('row-unhighlight')"
    >
      <span class="text-gray-400 text-xs w-5 text-right flex-shrink-0 mt-0.5">
        {{ idx + 1 }}
      </span>
      <span
        class="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5"
        :class="
          entry.player.playerType === 'GUEST'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-green-100 text-green-700'
        "
      >
        {{ entry.player.playerType === "GUEST" ? "Inv." : "Reg." }}
      </span>
      <span class="text-xs text-gray-500 w-8 flex-shrink-0 mt-0.5">
        {{ entry.player.position ?? "—" }}
      </span>
      <div class="flex-1 min-w-0">
        <p class="font-medium text-gray-900 truncate">
          <span
            v-if="
              entry.player.playerType !== 'GUEST' && entry.player.jerseyNumber
            "
            class="text-gray-400 text-xs mr-1"
            >#{{ entry.player.jerseyNumber }}</span
          >
          {{ entry.player.firstName }}
          {{ entry.player.playerType === "GUEST" ? "" : entry.player.lastName }}
        </p>
        <p
          v-if="
            entry.player.playerType === 'GUEST' && entry.player.invitedByName
          "
          class="text-xs text-gray-400 truncate"
        >
          Invitado por {{ entry.player.invitedByName }}
        </p>
        <p
          v-else-if="
            entry.confirmedById &&
            entry.player.playerType !== 'GUEST' &&
            entry.confirmedByName
          "
          class="text-xs text-gray-400 truncate"
        >
          Agregado por {{ entry.confirmedByName }}
        </p>
      </div>
    </div>
  </div>
</template>
