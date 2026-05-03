<script setup lang="ts"></script>
<template>
  <div
    class="absolute inset-0 z-10 bg-white/70 rounded-xl flex items-center justify-center"
    aria-live="polite"
    aria-busy="true"
  >
    <span class="text-sm text-gray-700 font-medium"
      ><slot>Guardando...</slot></span
    >
  </div>
</template>
