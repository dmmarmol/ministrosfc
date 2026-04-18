<script setup lang="ts">
import { ref, computed } from "vue";
import type { ColumnDef } from "~/types/table";

const props = defineProps<{
  columns: ColumnDef[];
  rows: Record<string, unknown>[];
  loading?: boolean;
}>();

// ── Sort state ────────────────────────────────────────────────────────────────

const sortKey = ref<string | null>(null);
const sortDir = ref<"asc" | "desc">("asc");

const sortedRows = computed(() => {
  if (!sortKey.value) return props.rows;

  const key = sortKey.value;
  const dir = sortDir.value;

  return [...props.rows].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return dir === "asc" ? cmp : -cmp;
  });
});

/**
 * Handle a sort event from <UiTable>:
 *  – first click on a column  → sort ascending
 *  – second click             → sort descending
 *  – third click              → reset (no sort)
 *  – click on non-sortable    → no-op
 */
function handleSort(key: string) {
  const col = props.columns.find((c) => c.key === key);
  if (!col?.sortable) return;

  if (sortKey.value === key) {
    if (sortDir.value === "asc") {
      sortDir.value = "desc";
    } else {
      sortKey.value = null;
      sortDir.value = "asc";
    }
  } else {
    sortKey.value = key;
    sortDir.value = "asc";
  }
}
</script>

<template>
  <UiTable
    :columns="columns"
    :rows="sortedRows"
    :loading="loading"
    :sort-key="sortKey"
    :sort-dir="sortDir"
    @sort="handleSort"
  >
    <!--
      Forward every slot the consumer provided (e.g. #rank-data, #name-data)
      through to <UiTable>, which in turn forwards them to <UTable>.
    -->
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot
        :name="slotName"
        v-bind="(slotProps as Record<string, unknown>) ?? {}"
      />
    </template>
  </UiTable>
</template>
