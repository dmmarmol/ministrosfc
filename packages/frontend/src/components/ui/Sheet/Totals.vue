<script setup lang="ts">
/** Row of big totals: label above, display-type value below. */
withDefaults(
  defineProps<{
    items: { label: string; value: string | number }[];
    columns?: 4 | 5;
  }>(),
  { columns: 4 },
);
</script>

<template>
  <dl
    class="grid grid-cols-2 border-y-[3px] border-[var(--sheet-ink)]"
    :class="columns === 5 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'"
  >
    <div
      v-for="item in items"
      :key="item.label"
      class="border-b border-r border-[var(--sheet-rule)] px-3 py-3 [&:last-child:nth-child(odd)]:col-span-2 sm:border-b-0 sm:[&:last-child:nth-child(odd)]:col-span-1 sm:last:border-r-0"
    >
      <dt class="sheet-label">{{ item.label }}</dt>
      <dd class="sheet-display sheet-num mt-1 text-5xl">{{ item.value }}</dd>
    </div>
  </dl>
</template>
