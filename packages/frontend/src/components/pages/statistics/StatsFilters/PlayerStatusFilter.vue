<script setup lang="ts">
import { PlayerStatus } from "@ministrosfc/shared";

const model = defineModel<string>({ default: PlayerStatus.ACTIVE });
</script>

<template>
  <select
    v-model="model"
    class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
  >
    <option :value="PlayerStatus.ACTIVE">Activos</option>
    <option :value="PlayerStatus.INACTIVE">Inactivos</option>
    <option :value="''">Todos los estados</option>
  </select>
</template>
