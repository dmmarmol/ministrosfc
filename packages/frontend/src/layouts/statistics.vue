<script setup lang="ts">
import StatisticsSubNav from "~/components/pages/statistics/StatisticsSubNav.vue";
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <CommonHeader />
    <CommonNavigation />
    <main class="flex-1 container mx-auto px-4 py-6 max-w-7xl">
      <div class="flex gap-8">
        <StatisticsSubNav />
        <div class="flex-1 min-w-0">
          <slot />
        </div>
      </div>
    </main>
    <CommonFooter />
  </div>
</template>
