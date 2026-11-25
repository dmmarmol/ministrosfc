<script setup lang="ts">
import { competitionTypeItems, type CompetitionType } from "@ministrosfc/shared";
import TournamentLine from "~/components/pages/tournaments/TournamentLine.vue";


const { t } = useI18n();
definePageMeta({ public: true, layout: "sheet" });
useHead({ title: t("common.torneos") });

interface TournamentRow {
  id: string;
  name: string;
  competitionType: string;
  startDate: string;
  endDate: string | null;
}

const { $api } = useNuxtApp();

const formats: { value: string; label: string }[] = [
  { value: "", label: t("common.todos") },
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
function state(row: TournamentRow): string | null {
  const start = new Date(row.startDate).getTime();
  const end = row.endDate ? new Date(row.endDate).getTime() : start;
  const today = startOfToday();
  if (start > today) return t("common.proximo");
  if (end >= today) return t("common.enCurso");
  return null;
}

// Newest first, grouped by the year each tournament starts
const groups = computed(() => {
  const rows = [...(data.value?.data ?? [])].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
  const out: { year: string; items: TournamentRow[] }[] = [];
  for (const row of rows) {
    const year = String(new Date(row.startDate).getFullYear());
    let g = out.find((x) => x.year === year);
    if (!g) out.push((g = { year, items: [] }));
    g.items.push(row);
  }
  return out;
});
const total = computed(() => data.value?.data?.length ?? 0);
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 pb-12 pt-6">
    <UiSheetTitle>{{ t("common.torneos") }}</UiSheetTitle>

    <div class="mt-5 flex flex-wrap gap-2" role="group" :aria-label="t('tournaments.formato')">
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
      {{ t("errors.noSePudieronCargarLos") }}
      <button type="button" class="sheet-link ml-1" @click="refresh()">{{ t("tournaments.reintentar") }}</button>
    </p>
    <UiSheetMessage v-else-if="!data" class="mt-8">{{ t("tournaments.cargandoTorneos") }}</UiSheetMessage>
    <UiSheetMessage v-else-if="!total" tone="empty" class="mt-8">{{ t("errors.noSeEncontraronTorneos") }}</UiSheetMessage>
    <div v-else class="transition-opacity" :class="pending && 'opacity-60'">
      <section v-for="g in groups" :key="g.year" class="mt-8" :aria-labelledby="`y-${g.year}`">
        <UiSheetBand :id="`y-${g.year}`" :count="g.items.length" count-label="torneos">{{ g.year }}</UiSheetBand>
        <ul class="border-b-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)]">
          <li v-for="item in g.items" :key="item.id" class="border-b border-[var(--sheet-rule)] px-3 last:border-b-0">
            <TournamentLine :tournament="item" :status-label="state(item)" />
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
