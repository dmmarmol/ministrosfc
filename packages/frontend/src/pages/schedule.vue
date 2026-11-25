<script setup lang="ts">
import { GameStatus, type Game } from "@ministrosfc/shared";
import GameLine from "~/components/pages/schedule/GameLine.vue";

definePageMeta({ public: true, layout: "sheet" });
useHead({ title: "Calendario" });

const { $api } = useNuxtApp();

const tabs = [
  { key: "upcoming", label: "Próximos" },
  { key: "past", label: "Resultados" },
];
const activeTab = ref("upcoming");
const opponentFilter = ref("");
const LIMIT = 50;

const { data: teamsData } = await useAsyncData("schedule-teams", () =>
  $api<{ data: any[] }>("/api/v1/opponent-teams"),
);
const teams = computed(() => teamsData.value?.data ?? []);

const baseQuery = () => ({
  ...(opponentFilter.value ? { opponentTeamId: opponentFilter.value } : {}),
  limit: LIMIT,
});
const list = (status: GameStatus) =>
  $api<{ data: Game[] }>("/api/v1/games", {
    query: { status, ...baseQuery() },
  }).then((r) => r.data ?? []);

const { data, pending, error, refresh } = await useAsyncData(
  "schedule",
  async () => {
    if (activeTab.value === "past") return list(GameStatus.COMPLETED);
    // Upcoming: scheduled games plus called-off ones that have not happened yet
    const [scheduled, cancelled] = await Promise.all([
      list(GameStatus.SCHEDULED),
      list(GameStatus.CANCELLED),
    ]);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const seen = new Set<string>();
    return [
      ...scheduled,
      ...cancelled.filter((g) => new Date(g.date) >= startOfToday),
    ].filter((g) => (seen.has(g.id) ? false : (seen.add(g.id), true)));
  },
);

watch([activeTab, opponentFilter], () => refresh());

const games = computed(() => {
  const list = [...(data.value ?? [])];
  const dir = activeTab.value === "upcoming" ? 1 : -1;
  return list.sort(
    (a, b) => dir * (new Date(a.date).getTime() - new Date(b.date).getTime()),
  );
});

// Group by month, keeping the sort order
const groups = computed(() => {
  const out: { key: string; label: string; items: Game[] }[] = [];
  for (const g of games.value) {
    const d = new Date(g.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let grp = out.find((x) => x.key === key);
    if (!grp) {
      const label = d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
      grp = { key, label: label.charAt(0).toUpperCase() + label.slice(1), items: [] };
      out.push(grp);
    }
    grp.items.push(g);
  }
  return out;
});
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 pb-12 pt-6">
    <h1 class="sheet-display text-[clamp(3rem,15vw,6rem)]">Calendario</h1>

    <div class="mt-5 flex flex-wrap gap-2" role="group" aria-label="Ver">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="sheet-chip"
        :aria-pressed="activeTab === tab.key"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="mt-4 border-y-[3px] border-[var(--sheet-ink)] py-4" role="search">
      <label class="block sm:max-w-xs">
        <span class="sheet-label">Rival</span>
        <select v-model="opponentFilter" class="sheet-field mt-1">
          <option value="">Todos</option>
          <option v-for="team in teams" :key="team.id" :value="team.id">
            {{ team.name }}
          </option>
        </select>
      </label>
    </div>

    <p v-if="error" class="mt-8 text-lg" role="alert">
      No se pudo cargar el calendario.
      <button type="button" class="sheet-link ml-1" @click="refresh()">Reintentar</button>
    </p>
    <p v-else-if="pending && !groups.length" class="mt-6">Cargando partidos…</p>
    <template v-else-if="groups.length">
      <section
        v-for="grp in groups"
        :key="grp.key"
        class="mt-8"
        :aria-labelledby="`month-${grp.key}`"
      >
        <h2 :id="`month-${grp.key}`" class="sheet-display text-3xl">{{ grp.label }}</h2>
        <ul
          class="mt-1 border-t-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)] transition-opacity"
          :class="pending && 'opacity-60'"
        >
          <li
            v-for="g in grp.items"
            :key="g.id"
            class="border-b border-[var(--sheet-rule)] px-3"
          >
            <GameLine :game="g" />
          </li>
        </ul>
      </section>
      <p v-if="games.length >= LIMIT" class="mt-6 text-sm text-[var(--sheet-ink-soft)]">
        Se muestran los {{ LIMIT }} partidos más {{ activeTab === "upcoming" ? "próximos" : "recientes" }}.
      </p>
    </template>
    <p v-else class="mt-8 text-lg">
      {{
        opponentFilter
          ? "No hay partidos con este rival."
          : activeTab === "upcoming"
            ? "No hay partidos próximos."
            : "Todavía no hay partidos jugados."
      }}
    </p>
  </div>
</template>
