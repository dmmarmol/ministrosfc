<script setup lang="ts">
import { PlayerStatus } from "@ministrosfc/shared";

const model = defineModel<string>({ default: PlayerStatus.ACTIVE });
</script>

<template>
  <select
    v-model="model"
    class="sheet-field"
  >
    <option :value="PlayerStatus.ACTIVE">Activos</option>
    <option :value="PlayerStatus.INACTIVE">Inactivos</option>
    <option :value="''">Todos los estados</option>
  </select>
</template>
