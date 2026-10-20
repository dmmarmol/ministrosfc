<script setup lang="ts">
import { reactive, watch } from "vue";
import {
  CompetitionType,
  type Tournament,
  type TournamentCreatePayload,
  type TournamentUpdatePayload,
} from "@ministrosfc/shared";

export type TournamentFormData = TournamentCreatePayload &
  TournamentUpdatePayload & {
    expectedUpdatedAt: string;
  };

const props = withDefaults(
  defineProps<{
    tournament?: Tournament | null;
    submitLabel?: string;
    cancelTo?: string;
    loading?: boolean;
    error?: string;
  }>(),
  {
    tournament: null,
    submitLabel: "Guardar torneo",
    cancelTo: "/admin/tournaments",
    loading: false,
    error: "",
  },
);

const emit = defineEmits<{
  (e: "submit", payload: TournamentFormData): void;
}>();

const competitionTypeItems = [
  { value: CompetitionType.LEAGUE, label: "Liga" },
  { value: CompetitionType.CUP, label: "Copa" },
  { value: CompetitionType.PLAYOFF, label: "Playoff" },
  { value: CompetitionType.SEASON, label: "Temporada" },
  { value: CompetitionType.FRIENDLY, label: "Amistoso" },
];

const form = reactive<TournamentFormData>({
  name: "",
  competitionType: CompetitionType.SEASON as CompetitionType,
  startDate: "",
  endDate: "",
  description: "",
  expectedUpdatedAt: "",
});

const formatDateInput = (value?: string | null) => value?.split("T")[0] ?? "";

watch(
  () => props.tournament,
  (tournament) => {
    if (!tournament) {
      form.name = "";
      form.competitionType = CompetitionType.SEASON;
      form.startDate = "";
      form.endDate = "";
      form.description = "";
      form.expectedUpdatedAt = "";
      return;
    }

    form.name = tournament.name ?? "";
    form.competitionType = tournament.competitionType;
    form.startDate = formatDateInput(tournament.startDate);
    form.endDate = formatDateInput(tournament.endDate);
    form.description = tournament.description ?? "";
    form.expectedUpdatedAt = tournament.updatedAt ?? "";
  },
  { immediate: true },
);

function handleSubmit() {
  const payload: TournamentFormData = {
    name: form.name.trim(),
    competitionType: form.competitionType,
    startDate: form.startDate,
    endDate: form.endDate,
    description: form.description.trim(),
    expectedUpdatedAt: form.expectedUpdatedAt,
  };

  if (!form.endDate) {
    delete payload.endDate;
  }

  if (!form.description.trim()) {
    delete payload.description;
  }

  emit("submit", payload);
}
</script>

<template>
  <p
    v-if="error"
    class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
  >
    {{ error }}
  </p>
  <form
    class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
    @submit="handleSubmit"
  >
    <div class="mb-6 flex items-center justify-between gap-3">
      <div>
        <p class="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
          Torneo
        </p>
        <h2 v-if="tournament" class="mt-1 text-xl font-semibold text-gray-900">
          {{ tournament.name }}
        </h2>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1" for="name"
          >Nombre *</label
        >
        <UInput id="name" v-model="form.name" required class="w-full" />
      </div>

      <div>
        <label
          class="block text-xs font-medium text-gray-700 mb-1"
          for="competitionType"
          >Tipo de competición *</label
        >
        <USelect
          id="competitionType"
          v-model="form.competitionType"
          :items="competitionTypeItems"
          class="w-full"
        />
      </div>

      <div>
        <label
          class="block text-xs font-medium text-gray-700 mb-1"
          for="startDate"
          >Fecha de inicio *</label
        >
        <UInput
          id="startDate"
          v-model="form.startDate"
          required
          type="date"
          class="w-full"
        />
      </div>

      <div>
        <label
          class="block text-xs font-medium text-gray-700 mb-1"
          for="endDate"
          >Fecha de fin</label
        >
        <UInput
          id="endDate"
          v-model="form.endDate"
          type="date"
          class="w-full"
        />
      </div>

      <div class="md:col-span-2">
        <label
          class="block text-xs font-medium text-gray-700 mb-1"
          for="description"
          >Descripción</label
        >
        <UTextarea
          id="description"
          v-model="form.description"
          :rows="4"
          class="w-full"
        />
      </div>
    </div>

    <div class="flex justify-end w-full gap-3 pt-2">
      <slot name="buttons"></slot>
      <UButton :to="cancelTo" variant="outline" color="neutral" size="xl"
        >Cancelar</UButton
      >
      <UButton
        type="submit"
        variant="solid"
        color="primary"
        size="xl"
        :loading="loading"
      >
        {{ submitLabel }}
      </UButton>
    </div>
  </form>
</template>
