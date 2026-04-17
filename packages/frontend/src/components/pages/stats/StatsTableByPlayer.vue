<script setup lang="ts">
import type { PlayerStatRowDTO } from "@ministrosfc/shared";

defineProps<{
  rows: PlayerStatRowDTO[];
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
      <table class="w-full text-sm text-left text-gray-900">
        <thead class="bg-gray-50 text-gray-900 uppercase text-xs">
          <tr>
            <th class="px-3 py-2">{{ mode === "all" ? "Jugador" : "Año" }}</th>
            <th class="px-3 py-2 text-right">PJ</th>
            <th class="px-3 py-2 text-right">V</th>
            <th class="px-3 py-2 text-right">D</th>
            <th class="px-3 py-2 text-right">E</th>
            <th class="px-3 py-2 text-right">Goles</th>
            <th class="px-3 py-2 text-right">Asist.</th>
            <th class="px-3 py-2 text-right">%V</th>
            <th class="px-3 py-2 text-right">GPJ</th>
            <th class="px-3 py-2 text-right">%Part.</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="row in rows" :key="row.playerId" class="hover:bg-gray-50">
            <td class="px-3 py-2 font-medium">
              <div class="flex gap-x-2 items-baseline">
                <p class="text-base">
                  {{ row.playerName }}
                </p>
                <p class="text-sm text-gray-400">
                  {{ row.playerNickname }}
                </p>
              </div>
            </td>
            <td class="px-3 py-2 text-right">{{ row.gamesPlayed }}</td>
            <td class="px-3 py-2 text-right text-green-600">{{ row.wins }}</td>
            <td class="px-3 py-2 text-right text-red-500">{{ row.losses }}</td>
            <td class="px-3 py-2 text-right text-yellow-500">
              {{ row.draws }}
            </td>
            <td class="px-3 py-2 text-right font-medium">{{ row.goals }}</td>
            <td class="px-3 py-2 text-right">{{ row.assists }}</td>
            <td class="px-3 py-2 text-right">
              {{ row.winRate != null ? row.winRate.toFixed(1) : "—" }}%
            </td>
            <td class="px-3 py-2 text-right">
              {{ row.goalRate != null ? row.goalRate.toFixed(2) : "—" }}
            </td>
            <td class="px-3 py-2 text-right">
              {{
                row.participationRate != null
                  ? row.participationRate.toFixed(1)
                  : "—"
              }}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
