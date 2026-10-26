<script setup lang="ts">
import { reactive } from "vue";
import {
  type OpponentTeam,
  type OpponentTeamCreatePayload,
  type OpponentTeamUpdatePayload,
} from "@ministrosfc/shared";
import type { SelectMenuItem } from "#ui/types";
import type { ChipProps } from "#ui/components/Chip.vue";

export type OpponentTeamFormData = OpponentTeamCreatePayload &
  OpponentTeamUpdatePayload & {
    expectedUpdatedAt: string;
  };

const props = withDefaults(
  defineProps<{
    opponentTeam?: OpponentTeam | null;
    submitLabel?: string;
    cancelTo?: string;
    loading?: boolean;
    error?: string;
  }>(),
  {
    opponentTeam: null,
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
  primaryColor: "",
  secondaryColor: "",
  expectedUpdatedAt: "",
});

watch(
  () => props.opponentTeam,
  (opponentTeam) => {
    if (!opponentTeam) {
      form.name = "";
      form.primaryColor = "";
      form.secondaryColor = "";
      form.expectedUpdatedAt = "";
      return;
    }

    form.name = opponentTeam.name ?? "";
    form.primaryColor = opponentTeam?.primaryColor ?? "";
    form.secondaryColor = opponentTeam?.secondaryColor ?? "";
    form.expectedUpdatedAt = opponentTeam.updatedAt ?? "";
  },
  { immediate: true },
);

function handleSubmit() {
  const payload: OpponentTeamFormData = {
    name: form.name.trim(),
    primaryColor: form.primaryColor?.id?.trim() || "",
    secondaryColor: form.secondaryColor?.id?.trim() || "",
    expectedUpdatedAt: new Date().toISOString(),
  };

  emit("submit", payload);
}

const listOfTeamColors: SelectMenuItem[] = [
  {
    id: "red",
    label: "Rojo",
    chip: {
      color: "error",
    },
  },
  {
    id: "blue",
    label: "Azul",
    chip: {
      color: "info",
    },
  },
  {
    id: "green",
    label: "Verde",
    chip: {
      color: "success",
    },
  },
  {
    id: "yellow",
    label: "Amarillo",
    chip: {
      color: "warning",
    },
  },
  {
    id: "black",
    label: "Negro",
    chip: {
      color: "neutral",
    },
  },
  {
    id: "white",
    label: "Blanco",
    chip: {
      color: "neutral",
    },
  },
];
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
        <h2
          v-if="opponentTeam"
          class="mt-1 text-xl font-semibold text-gray-900"
        >
          {{ opponentTeam.name }}
        </h2>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1" for="name"
          >Nombre <span class="text-red-500">*</span></label
        >
        <UInput id="name" v-model="form.name" required class="w-full" />
      </div>
      <!-- Colors -->
      <div>
        <h3 class="text-xs font-medium text-gray-700 mb-1">Colores</h3>
        <div class="flex gap-x-1">
          <div class="flex-1">
            <label
              class="block text-xs font-medium text-gray-700 mb-1"
              for="primaryColor"
            >
              <USelectMenu
                id="primaryColor"
                v-model="form.primaryColor"
                class="w-full"
                placeholder="Primario"
                :items="listOfTeamColors"
              >
                <template #leading="{ modelValue, ui }">
                  <UChip
                    v-if="modelValue"
                    v-bind="modelValue.chip"
                    inset
                    standalone
                    :size="ui.itemLeadingChipSize() as ChipProps['size']"
                    :class="ui.itemLeadingChip()"
                  />
                </template>
              </USelectMenu>
            </label>
          </div>
          <div class="flex-1">
            <label
              class="block text-xs font-medium text-gray-700 mb-1"
              for="secondaryColor"
            >
              <USelectMenu
                id="secondaryColor"
                v-model="form.secondaryColor"
                class="w-full"
                placeholder="Secundario"
                :items="listOfTeamColors"
              >
                <template #leading="{ modelValue, ui }">
                  <UChip
                    v-if="modelValue"
                    v-bind="modelValue.chip"
                    inset
                    standalone
                    :size="ui.itemLeadingChipSize() as ChipProps['size']"
                    :class="ui.itemLeadingChip()"
                  />
                </template>
              </USelectMenu>
            </label>
          </div>
        </div>
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
