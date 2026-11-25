<script setup lang="ts">
import PositionLabel from "~/components/ui/Position/Label.vue";

const { t } = useI18n();
defineProps<{
  participants: any[];
}>();
/** @TODO Review if this component is being used */
</script>

<template>
  <div>
    <h2 class="text-lg font-bold text-gray-800 mb-4">
      {{ t("gamePublicParticipants.players", { count: participants.length }) }}
    </h2>
    <div
      v-if="participants.length"
      class="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden"
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
              ? 'bg-sheet-draw/15 text-sheet-draw'
              : 'bg-sheet-win/15 text-sheet-win'
          "
        >
          {{ p.player?.playerType === "GUEST" ? t("common.inv") : t("common.reg") }}
        </span>
        <PositionLabel :position="p.player?.position ?? null" size="sm" />
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
            {{
              t("gamePublicParticipants.invitedBy", {
                name: p.confirmedBy
                  ? `${p.confirmedBy.firstName} ${p.confirmedBy.lastName}`
                  : "—",
              })
            }}
          </p>
        </div>
        <span class="text-xs text-gray-500 capitalize flex-shrink-0">
          {{ p.confirmationStatus?.toLowerCase().replace(/_/g, " ") }}
        </span>
      </div>
    </div>
    <p v-else class="text-gray-500 text-sm">{{ t("gamesGamePublicParticipants.noHayJugadoresConfirmados") }}</p>
  </div>
</template>
