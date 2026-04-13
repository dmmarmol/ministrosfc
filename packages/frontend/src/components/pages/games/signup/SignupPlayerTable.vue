<script setup lang="ts">
import { PlayerType, type RosterEntry } from "@ministrosfc/shared";
import { CheckCircleIcon } from "@heroicons/vue/24/solid";
import { computed, ref } from "vue";

const props = defineProps<{
  roster: RosterEntry[];
  confirmedCount: number;
  maxPlayers: number | null;
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

const isTeamFull = computed(
  () => props.maxPlayers != null && props.confirmedCount >= props.maxPlayers,
);
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <p class="text-sm font-semibold text-gray-700">
        Confirmados ({{ props.confirmedCount
        }}<span v-if="props.maxPlayers"> / {{ props.maxPlayers }}</span
        >)
      </p>
      <div
        v-if="isTeamFull"
        class="flex items-center gap-1.5 text-green-600 text-sm font-medium"
      >
        <CheckCircleIcon class="w-5 h-5" />
        Equipo completo
      </div>
    </div>

    <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div
        v-for="entry in props.roster"
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
        <div class="flex items-center gap-x-3">
          <UiPositionLabel :position="(entry.player.position as any) ?? null" />
          <UiPositionNumber
            :jersey-number="entry.player.jerseyNumber ?? null"
            :is-guest="entry.player.playerType === PlayerType.GUEST"
          />
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 truncate">
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
        <div class="self-center">
          <button
            v-if="
              hoverParticipantId === entry.participantId &&
              (props.canManageRoster ||
                entry.player.id === props.currentPlayerId)
            "
            class="p-0.5 text-gray-400 hover:text-red-500 transition-colors flex items-center gap-0.5"
            title="Eliminar del equipo"
            @click="$emit('row-removePlayer', entry.participantId)"
          >
            <span>Remover</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5"
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
  </div>
</template>
