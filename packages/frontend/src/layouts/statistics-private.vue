<script setup lang="ts">
import StatisticsSubNav from "~/components/pages/statistics/StatisticsSubNav.vue";
</script>

<template>
  <NuxtLayout name="sheet">
    <StatisticsSubNav />
    <div class="mx-auto max-w-5xl px-4 pb-12 pt-6">
      <slot />
    </div>
  </NuxtLayout>
</template>
