<script setup lang="ts">
import { PlayerStatus } from "@ministrosfc/shared";


const { t } = useI18n();
const model = defineModel<string>({ default: PlayerStatus.ACTIVE });
</script>

<template>
  <select
    v-model="model"
    class="sheet-field"
  >
    <option :value="PlayerStatus.ACTIVE">{{ t("statsFiltersPlayerStatusSelect.activos") }}</option>
    <option :value="PlayerStatus.INACTIVE">{{ t("statsFiltersPlayerStatusSelect.inactivos") }}</option>
    <option :value="''">{{ t("statsFiltersPlayerStatusSelect.todosLosEstados") }}</option>
  </select>
</template>
