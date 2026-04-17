<script setup lang="ts">
import type { TeamSummaryHeaderDTO } from "@ministrosfc/shared";

const props = defineProps<{
  summary: TeamSummaryHeaderDTO | null;
}>();
</script>

<template>
  <div v-if="summary" class="space-y-4">
    <!-- All-time totals -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div
        class="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100"
      >
        <p class="text-2xl font-bold text-gray-900">{{ summary.totalGames }}</p>
        <p class="text-xs text-gray-500 mt-1">Partidos</p>
      </div>
      <div
        class="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100"
      >
        <p class="text-2xl font-bold text-green-600">{{ summary.totalWins }}</p>
        <p class="text-xs text-gray-500 mt-1">Victorias</p>
      </div>
      <div
        class="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100"
      >
        <p class="text-2xl font-bold text-red-500">{{ summary.totalLosses }}</p>
        <p class="text-xs text-gray-500 mt-1">Derrotas</p>
      </div>
      <div
        class="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100"
      >
        <p class="text-2xl font-bold text-yellow-500">
          {{ summary.totalDraws }}
        </p>
        <p class="text-xs text-gray-500 mt-1">Empates</p>
      </div>
    </div>

    <!-- Goals and win rate -->
    <div class="grid grid-cols-3 gap-3">
      <div
        class="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100"
      >
        <p class="text-2xl font-bold text-gray-900">
          {{ summary.totalGoalsFor }}
        </p>
        <p class="text-xs text-gray-500 mt-1">Goles a Favor</p>
      </div>
      <div
        class="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100"
      >
        <p class="text-2xl font-bold text-gray-900">
          {{ summary.totalGoalsAgainst }}
        </p>
        <p class="text-xs text-gray-500 mt-1">Goles en Contra</p>
      </div>
      <div
        class="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100"
      >
        <p class="text-2xl font-bold text-brand">
          {{ summary.winRate.toFixed(1) }}%
        </p>
        <p class="text-xs text-gray-500 mt-1">% Victorias</p>
      </div>
    </div>

    <!-- Records -->
    <div
      class="bg-white rounded-lg shadow-sm border border-gray-100 divide-y divide-gray-100"
    >
      <div class="flex justify-between px-4 py-2 text-sm">
        <span class="text-gray-500">Rival más jugado</span>
        <span class="font-medium text-gray-800"
          >{{ summary.rivalMostPlayed?.name ?? "—" }} ({{
            summary.rivalMostPlayed?.count ?? 0
          }})</span
        >
      </div>
      <div class="flex justify-between px-4 py-2 text-sm">
        <span class="text-gray-500">Más victorias contra</span>
        <span class="font-medium text-green-600"
          >{{ summary.rivalMostWins?.name ?? "—" }} ({{
            summary.rivalMostWins?.count ?? 0
          }})</span
        >
      </div>
      <div class="flex justify-between px-4 py-2 text-sm">
        <span class="text-gray-500">Más derrotas contra</span>
        <span class="font-medium text-red-500"
          >{{ summary.rivalMostLosses?.name ?? "—" }} ({{
            summary.rivalMostLosses?.count ?? 0
          }})</span
        >
      </div>
      <div class="flex justify-between px-4 py-2 text-sm">
        <span class="text-gray-500">Más empates contra</span>
        <span class="font-medium text-yellow-500"
          >{{ summary.rivalMostDraws?.name ?? "—" }} ({{
            summary.rivalMostDraws?.count ?? 0
          }})</span
        >
      </div>
      <div class="flex justify-between px-4 py-2 text-sm">
        <span class="text-gray-500">Mejor victoria</span>
        <span class="font-medium text-gray-800"
          >{{ summary.bestWin?.score ?? "—" }} vs
          {{ summary.bestWin?.rival ?? "—" }}</span
        >
      </div>
      <div class="flex justify-between px-4 py-2 text-sm">
        <span class="text-gray-500">Peor derrota</span>
        <span class="font-medium text-gray-800"
          >{{ summary.worstLoss?.score ?? "—" }} vs
          {{ summary.worstLoss?.rival ?? "—" }}</span
        >
      </div>
      <div class="flex justify-between px-4 py-2 text-sm">
        <span class="text-gray-500">Más goles a favor contra</span>
        <span class="font-medium text-gray-800"
          >{{ summary.rivalMostGoalsFor?.name ?? "—" }} ({{
            summary.rivalMostGoalsFor?.totalGoals ?? 0
          }})</span
        >
      </div>
      <div class="flex justify-between px-4 py-2 text-sm">
        <span class="text-gray-500">Más goles en contra</span>
        <span class="font-medium text-gray-800"
          >{{ summary.rivalMostGoalsAgainst?.name ?? "—" }} ({{
            summary.rivalMostGoalsAgainst?.totalGoals ?? 0
          }})</span
        >
      </div>
      <div class="flex justify-between px-4 py-2 text-sm">
        <span class="text-gray-500">Goleador histórico</span>
        <span class="font-medium text-gray-800"
          >{{ summary.topScorer?.name ?? "—" }} ({{
            summary.topScorer?.goals ?? 0
          }}
          goles)</span
        >
      </div>
    </div>
  </div>
  <div
    v-else
    class="bg-white rounded-lg p-6 text-center text-gray-400 border border-gray-100"
  >
    Sin datos de resumen disponibles
  </div>
</template>
