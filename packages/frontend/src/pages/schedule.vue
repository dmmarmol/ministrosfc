<script setup lang="ts">
import { GameStatus, type Game } from "@ministrosfc/shared";
import GameLine from "~/components/pages/schedule/GameLine.vue";

definePageMeta({ public: true, layout: "sheet" });
useHead({ title: "Calendario" });

const { $api } = useNuxtApp();

type View = "all" | "upcoming" | "past";
const views: { key: View; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "upcoming", label: "Próximos" },
  { key: "past", label: "Resultados" },
];
const view = ref<View>("all");
const opponentFilter = ref("");
const LIMIT = 50;

const { data: teamsData } = await useAsyncData("schedule-teams", () =>
  $api<{ data: any[] }>("/api/v1/opponent-teams"),
);
const teams = computed(() => teamsData.value?.data ?? []);

const list = (status: GameStatus) =>
  $api<{ data: Game[] }>("/api/v1/games", {
    query: {
      status,
      ...(opponentFilter.value ? { opponentTeamId: opponentFilter.value } : {}),
      limit: LIMIT,
    },
  }).then((r) => r.data ?? []);

// Both halves load once; the buttons only choose what is shown.
const { data, pending, error, refresh } = await useAsyncData(
  "schedule",
  async () => {
    const [scheduled, cancelled, completed] = await Promise.all([
      list(GameStatus.SCHEDULED),
      list(GameStatus.CANCELLED),
      list(GameStatus.COMPLETED),
    ]);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const seen = new Set<string>();
    const upcoming = [
      ...scheduled,
      ...cancelled.filter((g) => new Date(g.date) >= startOfToday),
    ].filter((g) => (seen.has(g.id) ? false : (seen.add(g.id), true)));
    return { upcoming, past: completed };
  },
);

watch(opponentFilter, () => refresh());

const byDate = (dir: 1 | -1) => (a: Game, b: Game) =>
  dir * (new Date(a.date).getTime() - new Date(b.date).getTime());

function monthGroups(games: Game[]) {
  const out: { key: string; label: string; items: Game[] }[] = [];
  for (const g of games) {
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
}

const upcomingGroups = computed(() =>
  monthGroups([...(data.value?.upcoming ?? [])].sort(byDate(1))),
);
const pastGroups = computed(() =>
  monthGroups([...(data.value?.past ?? [])].sort(byDate(-1))),
);

const sections = computed(() => {
  const s = [
    {
      key: "upcoming" as const,
      title: "Próximos partidos",
      groups: upcomingGroups.value,
      count: data.value?.upcoming.length ?? 0,
      empty: "No hay partidos próximos.",
    },
    {
      key: "past" as const,
      title: "Partidos jugados",
      groups: pastGroups.value,
      count: data.value?.past.length ?? 0,
      empty: "Todavía no hay partidos jugados.",
    },
  ];
  return view.value === "all" ? s : s.filter((x) => x.key === view.value);
});
const hasData = computed(() => !!data.value);
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 pb-12 pt-6">
    <h1 class="sheet-display text-[clamp(3rem,15vw,6rem)]">Calendario</h1>

    <div class="mt-5 flex flex-wrap gap-2" role="group" aria-label="Ver">
      <button
        v-for="v in views"
        :key="v.key"
        type="button"
        class="sheet-chip"
        :aria-pressed="view === v.key"
        @click="view = v.key"
      >
        {{ v.label }}
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
    <p v-else-if="!hasData" class="mt-6">Cargando partidos…</p>
    <div v-else class="transition-opacity" :class="pending && 'opacity-60'">
      <section
        v-for="sec in sections"
        :key="sec.key"
        class="mt-8"
        :aria-labelledby="`sec-${sec.key}`"
      >
        <h2
          :id="`sec-${sec.key}`"
          class="sheet-on-ink sheet-display flex items-baseline justify-between bg-[var(--sheet-ink)] px-3 py-2 text-4xl text-[var(--sheet-paper)]"
        >
          {{ sec.title }}
          <span class="sheet-num font-[var(--sheet-type)] text-base font-bold text-[var(--sheet-blue-on-ink)]"
            >{{ sec.count }}<span class="sr-only"> partidos</span></span
          >
        </h2>

        <p v-if="!sec.groups.length" class="border-b-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)] px-3 py-4">
          {{ opponentFilter ? "No hay partidos con este rival." : sec.empty }}
        </p>
        <template v-else>
          <div v-for="grp in sec.groups" :key="grp.key" class="mt-5">
            <h3 class="sheet-display text-2xl">{{ grp.label }}</h3>
            <ul class="mt-1 border-t-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)]">
              <li
                v-for="g in grp.items"
                :key="g.id"
                class="border-b border-[var(--sheet-rule)] px-3"
              >
                <GameLine :game="g" />
              </li>
            </ul>
          </div>
          <p v-if="sec.count >= LIMIT" class="mt-4 text-sm text-[var(--sheet-ink-soft)]">
            Se muestran los {{ LIMIT }} partidos más {{ sec.key === "upcoming" ? "próximos" : "recientes" }}.
          </p>
        </template>
      </section>
    </div>
  </div>
</template>
