<script setup lang="ts">
import { useGetPlayerById } from "~/composables/useGetPlayerById";
import { useGetPlayerStatsById } from "~/composables/useGetPlayerStatsById";
import PlayerFicha from "~/components/player/PlayerFicha.vue";
import PlayerCareerStats from "~/components/pages/player/PlayerCareerStats.vue";
import PlayerStatsByRival from "~/components/pages/player/PlayerStatsByRival.vue";
import { useAuthStore } from "~/stores/auth";
import { useQueryParams } from "~/composables/useQueryParams";

definePageMeta({ public: true, layout: "sheet", sheetWide: true });

const route = useRoute();
const qp = useQueryParams();
const id = route.params.id as string;

const year = computed(() => qp.get("year") || undefined);

const { player, pending } = await useGetPlayerById(id);
const { stats, availableYears } = await useGetPlayerStatsById(id, { year });
const authStore = useAuthStore();

if (!authStore.isAuthenticated && player.value?.status === "INACTIVE") {
  await navigateTo("/roster");
}

async function onYearChange(newYear: string) {
  await qp.set("year", newYear);
}

useHead(() => ({
  title: player.value
    ? `${player.value.firstName} ${player.value.lastName}`
    : "Jugador no encontrado",
}));
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 pb-12 pt-6">
    <NuxtLink to="/roster" class="sheet-link inline-flex min-h-11 items-center"
      >← Plantilla</NuxtLink
    >

    <p v-if="pending" class="mt-6">Cargando jugador…</p>
    <div
      v-else-if="player"
      class="mt-4 grid gap-8 md:grid-cols-[minmax(0,22rem)_1fr]"
    >
      <PlayerFicha
        :player="player"
        size="large"
        :as-link="false"
        :show-stats="false"
      />

      <div>
        <h1 class="sheet-display text-[clamp(2.25rem,8vw,4rem)]">
          {{ player.firstName }} {{ player.lastName }}
        </h1>
        <p v-if="player.status === 'INACTIVE'" class="sheet-label mt-2">
          Inactivo
        </p>

        <div class="mt-8">
          <PlayerCareerStats
            :stats="stats"
            :available-years="availableYears"
            :year="year"
            @year-change="onYearChange"
          />
        </div>

        <div v-if="authStore.isAuthenticated" class="mt-10">
          <PlayerStatsByRival :player-id="id">
            <template #header>
              <h2 class="sheet-display text-3xl">
                Estadísticas por equipo rival
              </h2>
            </template>
          </PlayerStatsByRival>
        </div>
      </div>
    </div>
    <p v-else class="mt-8 text-lg">Jugador no encontrado.</p>
  </div>
</template>
