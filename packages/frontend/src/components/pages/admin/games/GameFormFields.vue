<script setup lang="ts">
import type { SelectItem } from "#ui/components/Select.vue.js";
import PlaygroundSelect from "../playground/PlaygroundSelect.vue";
import type { GameFormData } from "./GameForm.vue";
import {
  competitionTypeItems,
  type OpponentTeam,
  type Tournament,
} from "@ministrosfc/shared";

const props = defineProps<{
  form: GameFormData;
  teamsData: OpponentTeam[];
  tournamentData: Tournament[];
}>();

const teams = computed(() => props.teamsData ?? []);
const teamItems: SelectItem[] = teams.value.map((t) => ({
  value: t.id,
  label: t.name,
}));

const tournaments = computed(() => props.tournamentData ?? []);
const tournamentItems: SelectItem[] = tournaments.value.map((t) => ({
  value: t.id,
  label: t.name,
}));
</script>
<template>
  <div>
    <label
      for="opponentTeamId"
      class="block text-xs font-medium text-gray-700 mb-1"
      >Equipo Rival <span class="text-red-500">*</span></label
    >
    <div class="flex gap-x-1">
      <USelect
        id="opponentTeamId"
        v-model="form.opponentTeamId"
        :items="teamItems"
        class="w-full"
        placeholder="Seleccionar Equipo"
      />
      <UButton
        to="/admin/teams/create"
        variant="solid"
        color="primary"
        icon="mdi:shield-plus-outline"
        >Nuevo
      </UButton>
    </div>
  </div>
  <div class="grid grid-cols-2 gap-4">
    <div>
      <label for="date" class="block text-xs font-medium text-gray-700 mb-1"
        >Fecha <span class="text-red-500">*</span></label
      >
      <UInput
        id="date"
        v-model="form.date"
        type="date"
        required
        class="w-full"
      />
    </div>
    <div>
      <label for="time" class="block text-xs font-medium text-gray-700 mb-1"
        >Hora</label
      >
      <UInput id="time" v-model="form.time" type="time" class="w-full" />
    </div>
  </div>
  <div>
    <label
      for="playgroundId"
      class="block text-xs font-medium text-gray-700 mb-1"
      >Ubicación (Cancha) <span class="text-red-500">*</span></label
    >
    <PlaygroundSelect
      id="playgroundId"
      v-model="form.playgroundId"
      class="w-full"
      required
    />
  </div>
  <div>
    <label
      for="competitionType"
      class="block text-xs font-medium text-gray-700 mb-1"
      >Tipo de Partido <span class="text-red-500">*</span></label
    >
    <USelect
      id="competitionType"
      v-model="form.competitionType"
      class="w-full"
      :items="competitionTypeItems"
      required
    />
  </div>
  <div>
    <label class="block text-xs font-medium text-gray-700 mb-1"
      >Cupo máximo</label
    >
    <UInput
      id="maxPlayers"
      v-model.number="form.maxPlayers"
      type="number"
      min="1"
      step="1"
      placeholder="Sin límite"
      class="w-full"
    />
  </div>
  <div>
    <label
      for="tournamentId"
      class="block text-xs font-medium text-gray-700 mb-1"
      >Torneo <span class="text-red-500">*</span></label
    >
    <USelect
      id="tournamentId"
      v-model="form.tournamentId"
      :items="tournamentItems"
      class="w-full"
      placeholder="Seleccionar Torneo"
      required
    />
  </div>
</template>
