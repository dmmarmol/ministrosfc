<script setup lang="ts">
import { PlayerStatus, type StatsFiltersMode } from "@ministrosfc/shared";
import StatsFilters from "~/components/pages/stats/StatsFilters.vue";
import StatisticsSubNav from "~/components/pages/statistics/StatisticsSubNav.vue";

const route = useRoute();
const qp = useQueryParams();

/**
 * Each statistics page declares its filter bar mode via definePageMeta:
 *   definePageMeta({ filtersMode: "tournaments" })
 * Falls back to "years" (year-only filter bar).
 */
const filtersMode = computed<StatsFiltersMode>(
  () => (route.meta.filtersMode as StatsFiltersMode) ?? "years",
);
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <CommonHeader />
    <CommonNavigation />
    <main class="flex-1 container mx-auto px-4 py-6 max-w-7xl">
      <div class="flex gap-8">
        <StatisticsSubNav />
        <div class="flex-1 min-w-0 space-y-6">
          <StatsFilters
            :mode="filtersMode"
            :year="qp.get('year')"
            :tournament="qp.get('tournament')"
            :rival="qp.get('rivalId')"
            :player="qp.get('playerId')"
            :player-status="qp.get('playerStatus') ?? PlayerStatus.ACTIVE"
            @change:year="(v) => qp.set('year', v)"
            @change:tournament="(v) => qp.set('tournament', v)"
            @change:rival="(v) => qp.set('rivalId', v)"
            @change:player="(v) => qp.set('playerId', v)"
            @change:player-status="(v) => qp.set('playerStatus', v)"
          />
          <slot />
        </div>
      </div>
    </main>
    <CommonFooter />
  </div>
</template>
