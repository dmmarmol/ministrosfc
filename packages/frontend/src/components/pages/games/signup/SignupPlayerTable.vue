<script setup lang="ts">
import { PlayerType, type RosterEntry } from "@ministrosfc/shared";
import { ref } from "vue";

const props = defineProps<{
  roster: RosterEntry[];
  highlightedParticipantId?: string | null;
  canManageRoster?: boolean;
  currentPlayerId?: string | null;
}>();

const emit = defineEmits<{
  "row-highlight": [participantId: string];
  "row-unhighlight": [];
  "row-removePlayer": [participantId: string];
}>();

const hoverParticipantId = ref<string | null>(null);
function onMouseEnter(participantId: string) {
  hoverParticipantId.value = participantId;
  emit("row-highlight", participantId);
}

function onMouseLeave() {
  hoverParticipantId.value = null;
  emit("row-unhighlight");
}
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
      @mouseenter="onMouseEnter(entry.participantId)"
      @mouseleave="onMouseLeave()"
    >
      <span class="text-gray-400 text-xs w-5 text-right flex-shrink-0 mt-0.5">
        {{ idx + 1 }}
      </span>

      <span class="text-xs text-gray-500 w-8 flex-shrink-0 mt-0.5">
        {{ entry.player.position ?? "—" }}
      </span>
      <div class="flex-1 min-w-0">
        <p class="font-medium text-gray-900 truncate">
          <span
            v-if="
              entry.player.playerType !== PlayerType.GUEST &&
              entry.player.jerseyNumber
            "
            class="text-gray-400 text-xs mr-1"
            >#{{ entry.player.jerseyNumber }}</span
          >
          {{ entry.player.firstName }}
          {{
            entry.player.playerType === PlayerType.GUEST
              ? ""
              : entry.player.lastName
          }}
        </p>
        <p
          v-if="
            entry.player.playerType === PlayerType.GUEST &&
            entry.player.invitedByName
          "
          class="text-xs text-gray-400 truncate"
        >
          Invitado por {{ entry.player.invitedByName }}
        </p>
        <p
          v-else-if="
            entry.confirmedById &&
            entry.player.playerType !== PlayerType.GUEST &&
            entry.confirmedByName
          "
          class="text-xs text-gray-400 truncate"
        >
          Agregado por {{ entry.confirmedByName }}
        </p>
      </div>
      <div>
        <button
          v-if="
            hoverParticipantId === entry.participantId &&
            (props.canManageRoster || entry.player.id === props.currentPlayerId)
          "
          class="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
          title="Eliminar del equipo"
          @click="$emit('row-removePlayer', entry.participantId)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
        <span
          v-else
          class="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5"
          :class="
            entry.player.playerType === 'GUEST'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-green-100 text-green-700'
          "
        >
          {{
            entry.player.playerType === PlayerType.GUEST
              ? "Invitado"
              : "Registrado"
          }}
        </span>
      </div>
    </div>
  </div>
</template>
