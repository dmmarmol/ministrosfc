<script setup lang="ts">
import type { TeamStatPeriodDTO } from "@ministrosfc/shared/types/statistics";

defineProps<{
  rows: TeamStatPeriodDTO[];
  mode: "all" | "single";
  loading: boolean;
}>();
</script>

<template>
  <div>
    <div v-if="loading" class="space-y-2">
      <div
        v-for="i in 5"
        :key="i"
        class="h-8 bg-gray-100 rounded animate-pulse"
      />
    </div>
    <div v-else-if="rows.length === 0" class="text-center text-gray-400 py-8">
      Sin datos
    </div>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm text-left">
        <thead class="bg-gray-50 text-gray-600 uppercase text-xs">
          <tr>
            <th class="px-3 py-2">
              {{ mode === "all" ? "Rival" : "Período" }}
            </th>
            <th v-if="mode === 'single'" class="px-3 py-2">Torneo</th>
            <th class="px-3 py-2 text-right">PJ</th>
            <th class="px-3 py-2 text-right">V</th>
            <th class="px-3 py-2 text-right">D</th>
            <th class="px-3 py-2 text-right">E</th>
            <th class="px-3 py-2 text-right">GF</th>
            <th class="px-3 py-2 text-right">GC</th>
            <th class="px-3 py-2 text-right">DG</th>
            <th class="px-3 py-2 text-right">Pts</th>
            <th class="px-3 py-2 text-right">%V</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="row in rows" :key="row.label" class="hover:bg-gray-50">
            <td class="px-3 py-2 font-medium">{{ row.label }}</td>
            <td v-if="mode === 'single'" class="px-3 py-2 text-gray-500">
              {{
                row.periodStart && row.periodEnd
                  ? `${row.periodStart} – ${row.periodEnd}`
                  : "—"
              }}
            </td>
            <td class="px-3 py-2 text-right">{{ row.gamesPlayed }}</td>
            <td class="px-3 py-2 text-right text-green-600">{{ row.wins }}</td>
            <td class="px-3 py-2 text-right text-red-500">{{ row.losses }}</td>
            <td class="px-3 py-2 text-right text-yellow-500">
              {{ row.draws }}
            </td>
            <td class="px-3 py-2 text-right">{{ row.goalsFor }}</td>
            <td class="px-3 py-2 text-right">{{ row.goalsAgainst }}</td>
            <td
              class="px-3 py-2 text-right"
              :class="
                row.goalDifference > 0
                  ? 'text-green-600'
                  : row.goalDifference < 0
                    ? 'text-red-500'
                    : ''
              "
            >
              {{ row.goalDifference > 0 ? "+" : "" }}{{ row.goalDifference }}
            </td>
            <td class="px-3 py-2 text-right font-medium">
              {{ row.pointsEarned }}
            </td>
            <td class="px-3 py-2 text-right">
              {{ (row.winRate * 100).toFixed(1) }}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
