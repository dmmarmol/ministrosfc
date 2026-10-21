<script setup lang="ts">
import { ref } from "vue";
import {
  CompetitionType,
  type OpponentTeam,
  type OpponentTeamCreatePayload,
  type OpponentTeamUpdatePayload,
} from "@ministrosfc/shared";

export type OpponentTeamFormData = OpponentTeamCreatePayload &
  OpponentTeamUpdatePayload & {
    expectedUpdatedAt: string;
  };

const props = withDefaults(
  defineProps<{
    team?: OpponentTeam | null;
    submitLabel?: string;
    cancelTo?: string;
    loading?: boolean;
    error?: string;
  }>(),
  {
    team: null,
    submitLabel: "Guardar equipo",
    cancelTo: "/admin/teams",
    loading: false,
    error: "",
  },
);

const emit = defineEmits<{
  (e: "submit", payload: OpponentTeamFormData): void;
}>();

const form = reactive<OpponentTeamFormData>({
  name: "",
  colors: "",
  expectedUpdatedAt: "",
});

watch(
  () => props.team,
  (team) => {
    if (!team) {
      form.name = "";
      form.colors = "";
      form.expectedUpdatedAt = "";
      return;
    }

    form.name = team.name ?? "";
    form.colors = team.colors ?? "";
    form.expectedUpdatedAt = team.updatedAt ?? "";
  },
  { immediate: true },
);

function handleSubmit() {
  const payload: OpponentTeamFormData = {
    name: form.name.trim(),
    colors: form.colors.trim(),
    expectedUpdatedAt: form.expectedUpdatedAt,
  };

  if (!form.colors.trim()) {
    delete payload.colors;
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
          Equipo
        </p>
        <h2 v-if="team" class="mt-1 text-xl font-semibold text-gray-900">
          {{ team.name }}
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
        <label class="block text-xs font-medium text-gray-700 mb-1" for="colors"
          >Colores</label
        >
        <UInput id="colors" v-model="form.colors" class="w-full" />
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
