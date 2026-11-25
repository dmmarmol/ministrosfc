<script setup lang="ts">
import PositionLabel from "~/components/ui/Position/Label.vue";
import { ref } from "vue";
import GameLineupField from "~/components/game/GameLineupField.vue";

const { t } = useI18n();

const props = defineProps<{
  roster: any[];
  confirmedCount: number;
  maxPlayers?: number | null;
  lineup?: string | null;
}>();

// Hover state is internal — only needed to correlate field circles with table rows
const hoveredParticipantId = ref<string | null>(null);
</script>

<template>
  <div
    class="mt-6"
    :class="lineup ? 'md:grid md:grid-cols-12 md:gap-6' : ''"
  >
    <!-- Formation field (8/12 cols on md+, hidden when no lineup) -->
    <div v-if="lineup" class="md:col-span-8 mb-6 md:mb-0">
      <GameLineupField
        :lineup="lineup"
        :roster="roster"
        @circle-hover="hoveredParticipantId = $event"
        @circle-unhover="hoveredParticipantId = null"
      />
    </div>

    <!-- Confirmed players table (4/12 cols with field, full-width without) -->
    <div :class="lineup ? 'md:col-span-4' : ''">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">
        {{
        maxPlayers
          ? t("signupTable.confirmedOfMax", { count: confirmedCount, max: maxPlayers })
          : t("signupTable.confirmed", { count: confirmedCount })
      }}
      </h3>
      <div class="bg-surface border border-gray-200 rounded-xl overflow-hidden">
        <div
          v-for="(entry, idx) in roster"
          :key="entry.participantId"
          class="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 text-sm transition-colors"
          :class="
            hoveredParticipantId === entry.participantId ? 'bg-sheet-draw/10' : ''
          "
        >
          <span
            class="text-gray-400 text-xs w-5 text-right flex-shrink-0 mt-0.5"
          >
            {{ idx + 1 }}
          </span>
          <span
            class="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5"
            :class="
              entry.player.playerType === 'GUEST'
                ? 'bg-sheet-draw/15 text-sheet-draw'
                : 'bg-sheet-win/15 text-sheet-win'
            "
          >
            {{ entry.player.playerType === "GUEST" ? t("common.inv") : t("common.reg") }}
          </span>
          <PositionLabel :position="entry.player.position ?? null" size="sm" />
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 truncate">
              <span
                v-if="
                  entry.player.playerType !== 'GUEST' &&
                  entry.player.jerseyNumber
                "
                class="text-gray-400 text-xs mr-1"
              >#{{ entry.player.jerseyNumber }}</span>
              {{ entry.player.firstName }}
              {{
                entry.player.playerType === "GUEST"
                  ? ""
                  : entry.player.lastName
              }}
            </p>
            <p
              v-if="
                entry.player.playerType === 'GUEST' &&
                entry.player.invitedByName
              "
              class="text-xs text-gray-400 truncate"
            >
              {{ t("signupTable.invitedBy", { name: entry.player.invitedByName }) }}
            </p>
            <p
              v-else-if="
                entry.confirmedById &&
                entry.player.playerType !== 'GUEST' &&
                entry.confirmedByName
              "
              class="text-xs text-gray-400 truncate"
            >
              {{ t("signupTable.addedBy", { name: entry.confirmedByName }) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
