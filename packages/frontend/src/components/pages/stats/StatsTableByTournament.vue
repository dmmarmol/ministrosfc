<script setup lang="ts">
import { type TeamStatPeriodDTO, formatDate } from "@ministrosfc/shared";

defineProps<{
  rows: TeamStatPeriodDTO[];
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
      <table class="w-full text-sm text-left text-gray-900">
        <thead class="bg-gray-50 text-gray-900 uppercase text-xs">
          <tr>
            <th class="px-3 py-2">Año</th>
            <th class="px-3 py-2">Cancha</th>
            <th class="px-3 py-2">Torneo</th>
            <th class="px-3 py-2">Período</th>
            <th class="px-3 py-2 text-right">PJ</th>
            <th class="px-3 py-2 text-right">V</th>
            <th class="px-3 py-2 text-right">D</th>
            <th class="px-3 py-2 text-right">E</th>
            <th class="px-3 py-2 text-right">GF</th>
            <th class="px-3 py-2 text-right">GC</th>
            <th class="px-3 py-2 text-right">DG</th>
            <th class="px-3 py-2 text-right">GRF</th>
            <th class="px-3 py-2 text-right">GRC</th>
            <th class="px-3 py-2 text-right">Pts</th>
            <th class="px-3 py-2 text-right">%V</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="row in rows" :key="row.key" class="hover:bg-gray-50">
            <td class="px-3 py-2 text-gray-500">
              {{
                row.periodStart
                  ? formatDate(row.periodStart, { year: "numeric" })
                  : "—"
              }}
            </td>
            <td class="px-3 py-2 text-gray-500 truncate text-ellipsis">
              {{ row.playgroundName ?? "—" }}
            </td>
            <td class="px-3 py-2 font-medium truncate">{{ row.label }}</td>
            <td class="px-3 py-2 text-gray-500">
              {{
                row.periodStart && row.periodEnd
                  ? `${formatDate(row.periodStart, { month: "2-digit", year: "2-digit" })} – ${formatDate(row.periodEnd, { month: "2-digit", year: "2-digit" })}`
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
            <td class="px-3 py-2 text-right">
              {{ row.goalRateFor.toFixed(2) }}
            </td>
            <td class="px-3 py-2 text-right">
              {{ row.goalRateAgainst.toFixed(2) }}
            </td>
            <td class="px-3 py-2 text-right font-medium">
              {{ row.pointsEarned }}
            </td>
            <td class="px-3 py-2 text-right">{{ row.winRate.toFixed(1) }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
