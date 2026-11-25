<script setup lang="ts" generic="T">
import HomeArrow from "./HomeArrow.vue";

/**
 * A home page block: heading, ruled list (or loading / empty line) and a
 * "see all" link. The row content comes from the `item` slot.
 */
withDefaults(
  defineProps<{
    id: string;
    title: string;
    items: T[];
    /** Stable key for each row. */
    itemKey: (item: T, index: number) => string | number;
    loading?: boolean;
    emptyText: string;
    linkTo: string;
    linkLabel: string;
    /** Numbered ranking (<ol>) instead of a plain list (<ul>). */
    ordered?: boolean;
  }>(),
  { loading: false, ordered: false },
);
</script>

<template>
  <section :aria-labelledby="id">
    <h2 :id="id" class="sheet-display text-4xl">{{ title }}</h2>
    <p v-if="loading" class="mt-4">Cargando…</p>
    <component
      :is="ordered ? 'ol' : 'ul'"
      v-else-if="items.length"
      class="mt-3 border-t-[3px] border-[var(--sheet-ink)]"
    >
      <li
        v-for="(item, i) in items"
        :key="itemKey(item, i)"
        class="border-b border-[var(--sheet-rule)]"
      >
        <slot name="item" :item="item" :index="i" />
      </li>
    </component>
    <p v-else class="mt-4">{{ emptyText }}</p>
    <NuxtLink
      :to="linkTo"
      class="sheet-link mt-3 inline-flex min-h-11 items-center gap-2"
      >{{ linkLabel }} <HomeArrow
    /></NuxtLink>
  </section>
</template>
