<script setup lang="ts">
import type { ColumnDef } from "~/types/table";

type RowData = Record<string, unknown>;

const props = withDefaults(
  defineProps<{
    columns?: ColumnDef<RowData>[];
    rows?: RowData[];
    loading?: boolean;
  }>(),
  {
    columns: () => [],
    rows: () => [],
    loading: false,
  },
);

const sortKey = ref<string | null>(null);
const sortDir = ref<"asc" | "desc" | null>(null);

const sortedRows = computed(() => {
  if (!sortKey.value || !sortDir.value) {
    return props.rows;
  }

  const key = sortKey.value;
  const direction = sortDir.value === "asc" ? 1 : -1;

  return [...props.rows].sort((left, right) => {
    const leftValue = left[key];
    const rightValue = right[key];

    if (leftValue == null && rightValue == null) {
      return 0;
    }
    if (leftValue == null) {
      return -1 * direction;
    }
    if (rightValue == null) {
      return 1 * direction;
    }

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return (leftValue - rightValue) * direction;
    }

    return String(leftValue).localeCompare(String(rightValue)) * direction;
  });
});

function toggleSort(key: string) {
  if (sortKey.value !== key) {
    sortKey.value = key;
    sortDir.value = "asc";
    return;
  }

  if (sortDir.value === "asc") {
    sortDir.value = "desc";
    return;
  }

  if (sortDir.value === "desc") {
    sortKey.value = null;
    sortDir.value = null;
    return;
  }

  sortDir.value = "asc";
}
</script>

<template>
  <UTable
    :columns="columns"
    :data="sortedRows"
    :loading="loading"
    :sort-key="sortKey"
    :sort-dir="sortDir"
    @sort="toggleSort"
  />
</template>
