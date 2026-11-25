<script setup lang="ts">
import { competitionTypeItems, type CompetitionType } from "@ministrosfc/shared";
import { formatCompetitionType, formatDateRange } from "~/utils/stats";
import HomeArrow from "~/components/pages/home/HomeArrow.vue";

definePageMeta({ public: true, layout: "sheet" });
useHead({ title: "Torneos" });

interface TournamentRow {
  id: string;
  name: string;
  competitionType: string;
  startDate: string;
  endDate: string | null;
}

const { $api } = useNuxtApp();

const formats: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  ...competitionTypeItems.map((i) => ({
    value: i.value as CompetitionType,
    label: String(i.label),
  })),
];
const formatFilter = ref("");

const { data, pending, error, refresh } = await useAsyncData("tournaments", () =>
  $api<{ data: TournamentRow[] }>("/api/v1/tournaments", {
    query: formatFilter.value ? { competitionType: formatFilter.value } : {},
  }),
);
watch(formatFilter, () => refresh());

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
function state(t: TournamentRow): string | null {
  const start = new Date(t.startDate).getTime();
  const end = t.endDate ? new Date(t.endDate).getTime() : start;
  const today = startOfToday();
  if (start > today) return "Próximo";
  if (end >= today) return "En curso";
  return null;
}

// Newest first, grouped by the year each tournament starts
const groups = computed(() => {
  const rows = [...(data.value?.data ?? [])].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
  const out: { year: string; items: TournamentRow[] }[] = [];
  for (const t of rows) {
    const year = String(new Date(t.startDate).getFullYear());
    let g = out.find((x) => x.year === year);
    if (!g) out.push((g = { year, items: [] }));
    g.items.push(t);
  }
  return out;
});
const total = computed(() => data.value?.data?.length ?? 0);
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 pb-12 pt-6">
    <h1 class="sheet-display text-[clamp(3rem,15vw,6rem)]">Torneos</h1>

    <div class="mt-5 flex flex-wrap gap-2" role="group" aria-label="Formato">
      <button
        v-for="f in formats"
        :key="f.value"
        type="button"
        class="sheet-chip"
        :aria-pressed="formatFilter === f.value"
        @click="formatFilter = f.value"
      >
        {{ f.label }}
      </button>
    </div>

    <p v-if="error" class="mt-8 text-lg" role="alert">
      No se pudieron cargar los torneos.
      <button type="button" class="sheet-link ml-1" @click="refresh()">Reintentar</button>
    </p>
    <p v-else-if="!data" class="mt-8">Cargando torneos…</p>
    <p v-else-if="!total" class="mt-8 text-lg">No se encontraron torneos.</p>
    <div v-else class="transition-opacity" :class="pending && 'opacity-60'">
      <section v-for="g in groups" :key="g.year" class="mt-8" :aria-labelledby="`y-${g.year}`">
        <h2
          :id="`y-${g.year}`"
          class="sheet-on-ink sheet-display flex items-baseline justify-between bg-[var(--sheet-ink)] px-3 py-2 text-4xl text-[var(--sheet-paper)]"
        >
          {{ g.year }}
          <span class="sheet-num font-[var(--sheet-type)] text-base font-bold text-[var(--sheet-blue-on-ink)]"
            >{{ g.items.length }}<span class="sr-only"> torneos</span></span
          >
        </h2>
        <ul class="border-b-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)]">
          <li v-for="t in g.items" :key="t.id" class="border-b border-[var(--sheet-rule)] px-3 last:border-b-0">
            <NuxtLink
              :to="`/tournaments/${t.id}`"
              class="grid min-h-[4.5rem] grid-cols-[1fr_auto] items-center gap-x-3 py-3 no-underline hover:bg-[var(--sheet-ground)]"
            >
              <span class="min-w-0">
                <span class="sheet-display block break-words text-2xl">{{ t.name }}</span>
                <span class="sheet-num block text-sm text-[var(--sheet-ink-soft)]"
                  >{{ formatCompetitionType(t.competitionType) }} ·
                  {{ formatDateRange(t.startDate, t.endDate) }}</span
                >
              </span>
              <span class="flex items-center gap-3 text-right">
                <span v-if="state(t)" class="sheet-label">{{ state(t) }}</span>
                <HomeArrow class="text-[var(--sheet-blue)]" />
              </span>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
