<script setup lang="ts">
import { computed, ref } from "vue";

/**
 * Ranked rows (spec 023): every statistics table on a phone becomes ruled
 * lines with ONE headline number. Chips choose what that number means; tapping
 * a row opens the remaining columns.
 */
export interface RankedMetric {
  key: string;
  label: string;
  unit: string;
  format?: (v: number) => string;
}
export interface RankedItem {
  id: string;
  title: string;
  subtitle?: string;
  to?: string;
  linkLabel?: string;
  values: Record<string, number | null | undefined>;
  detail?: { label: string; value: string | number }[];
}

const NATURAL = "__natural";
const props = withDefaults(
  defineProps<{
    items: RankedItem[];
    metrics: RankedMetric[];
    loading?: boolean;
    /** Keep the given order first (years, tournaments); chips then re-rank. */
    natural?: boolean;
    emptyText?: string;
    sortLabel?: string;
  }>(),
  {
    loading: false,
    natural: false,
    emptyText: "No hay datos para estos filtros.",
    sortLabel: "Ordenar por",
  },
);

const sortKey = ref<string>(props.natural ? NATURAL : props.metrics[0]!.key);
const open = ref<Set<string>>(new Set());

const shownMetric = computed(
  () =>
    props.metrics.find((m) => m.key === sortKey.value) ?? props.metrics[0]!,
);
const sorted = computed(() => {
  if (sortKey.value === NATURAL) return props.items;
  const k = sortKey.value;
  return [...props.items].sort(
    (a, b) => (b.values[k] ?? -Infinity) - (a.values[k] ?? -Infinity),
  );
});
const max = computed(() =>
  Math.max(
    0,
    ...sorted.value.map((i) => i.values[shownMetric.value.key] ?? 0),
  ),
);
const showRank = computed(() => sortKey.value !== NATURAL);

function fmt(item: RankedItem) {
  const m = shownMetric.value;
  const v = item.values[m.key];
  if (v == null || Number.isNaN(v)) return "—";
  return m.format ? m.format(v) : String(v);
}
function width(item: RankedItem) {
  const v = item.values[shownMetric.value.key] ?? 0;
  return max.value > 0 && v > 0 ? Math.round((v / max.value) * 100) : 0;
}
function toggle(id: string) {
  const s = new Set(open.value);
  s.has(id) ? s.delete(id) : s.add(id);
  open.value = s;
}
</script>

<template>
  <div>
    <div class="mt-4">
      <p class="sheet-label" id="rank-by">{{ sortLabel }}</p>
      <div class="mt-1.5 flex flex-wrap gap-2" role="group" aria-labelledby="rank-by">
        <button
          v-if="natural"
          type="button"
          class="sheet-chip"
          :aria-pressed="sortKey === NATURAL"
          @click="sortKey = NATURAL"
        >
          Orden
        </button>
        <button
          v-for="m in metrics"
          :key="m.key"
          type="button"
          class="sheet-chip"
          :aria-pressed="sortKey === m.key"
          @click="sortKey = m.key"
        >
          {{ m.label }}
        </button>
      </div>
    </div>

    <p v-if="loading" class="mt-6">Cargando…</p>
    <p v-else-if="!sorted.length" class="mt-6">{{ emptyText }}</p>
    <ol v-else class="mt-4 border-t-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)]">
      <li
        v-for="(item, i) in sorted"
        :key="item.id"
        class="border-b border-[var(--sheet-rule)]"
      >
        <button
          type="button"
          class="grid w-full min-h-14 items-center gap-x-3 px-3 py-2.5 text-left"
          :class="showRank ? 'grid-cols-[1.75rem_1fr_auto]' : 'grid-cols-[1fr_auto]'"
          :aria-expanded="open.has(item.id)"
          :aria-controls="`row-${item.id}`"
          @click="toggle(item.id)"
        >
          <span
            v-if="showRank"
            class="sheet-num font-bold text-[var(--sheet-blue)]"
            aria-hidden="true"
            >{{ String(i + 1).padStart(2, "0") }}</span
          >
          <span class="min-w-0">
            <span class="sheet-display block break-words text-2xl">{{ item.title }}</span>
            <span v-if="item.subtitle" class="block break-words text-sm text-[var(--sheet-ink-soft)]">{{ item.subtitle }}</span>
          </span>
          <span class="text-right">
            <span class="sheet-display sheet-num block text-4xl leading-none">{{ fmt(item) }}</span>
            <span class="sheet-label block">{{ shownMetric.unit }}</span>
          </span>
          <span
            class="col-span-full mt-1.5 block h-1.5 bg-[var(--sheet-ground)]"
            :class="showRank ? 'sm:col-start-2' : ''"
            aria-hidden="true"
          >
            <span class="block h-full bg-[var(--sheet-ink)]" :style="{ width: width(item) + '%' }" />
          </span>
        </button>
        <div
          v-if="open.has(item.id)"
          :id="`row-${item.id}`"
          class="px-3 pb-3"
        >
          <dl
            v-if="item.detail?.length"
            class="grid grid-cols-4 border-[3px] border-[var(--sheet-ink)] text-center"
          >
            <div
              v-for="d in item.detail"
              :key="d.label"
              class="border-b border-r border-[var(--sheet-ink)] py-1.5 [&:nth-child(4n)]:border-r-0"
            >
              <dt class="text-xs font-bold">{{ d.label }}</dt>
              <dd class="sheet-display sheet-num text-xl leading-none">{{ d.value }}</dd>
            </div>
          </dl>
          <NuxtLink
            v-if="item.to"
            :to="item.to"
            class="sheet-link mt-2 inline-flex min-h-11 items-center"
            >{{ item.linkLabel ?? "Ver detalle" }} →</NuxtLink
          >
        </div>
      </li>
    </ol>
  </div>
</template>
