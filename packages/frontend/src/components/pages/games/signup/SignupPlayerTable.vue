<script setup lang="ts">
import { PlayerType, type RosterEntry } from "@ministrosfc/shared";
import { CheckCircleIcon } from "@heroicons/vue/24/solid";
import { computed, ref } from "vue";


const { t } = useI18n();
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
        {{
          props.maxPlayers
            ? t("signupTable.confirmedOfMax", { count: props.confirmedCount, max: props.maxPlayers })
            : t("signupTable.confirmed", { count: props.confirmedCount })
        }}
      </p>
      <div
        v-if="isTeamFull"
        data-testid="team-full"
        class="flex items-center gap-1.5 text-sheet-win text-sm font-medium"
      >
        <CheckCircleIcon class="w-5 h-5" />
        {{ t("signupSignupPlayerTable.equipoCompleto") }}
      </div>
    </div>

    <div class="bg-surface border border-gray-200 rounded-xl overflow-hidden">
      <div
        v-for="entry in props.roster"
        :key="entry.participantId"
        class="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 text-sm transition-colors"
        :class="
          props.highlightedParticipantId === entry.participantId
            ? 'bg-sheet-draw/10'
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
            {{ t("signupTable.invitedBy", { name: entry.player.invitedByName }) }}
          </p>
          <p
            v-else-if="
              entry.confirmedById &&
              entry.player.playerType !== PlayerType.GUEST &&
              entry.confirmedByName
            "
            class="text-xs text-gray-400 truncate"
          >
            {{ t("signupTable.addedBy", { name: entry.confirmedByName }) }}
          </p>
        </div>
        <div class="self-center">
          <button
            v-if="
              hoverParticipantId === entry.participantId &&
              (props.canManageRoster ||
                entry.player.id === props.currentPlayerId)
            "
            class="p-0.5 text-gray-400 hover:text-sheet-loss transition-colors flex items-center gap-0.5"
            :title="t('signupSignupPlayerTable.eliminarDelEquipo')"
            @click="$emit('row-removePlayer', entry.participantId)"
          >
            <span>{{ t("signupSignupPlayerTable.remover") }}</span>
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
                ? 'bg-sheet-draw/15 text-sheet-draw'
                : 'bg-sheet-win/15 text-sheet-win'
            "
          >
            {{
              entry.player.playerType === PlayerType.GUEST
                ? t("common.invitado")
                : t("signupSignupPlayerTable.registrado")
            }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
