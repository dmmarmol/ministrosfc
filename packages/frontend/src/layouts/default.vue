<script setup lang="ts"></script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <CommonHeader />
    <CommonNavigation />
    <main class="flex-1 container mx-auto px-4 py-6 max-w-7xl">
      <slot />
    </main>
    <CommonFooter />
  </div>
</template>
