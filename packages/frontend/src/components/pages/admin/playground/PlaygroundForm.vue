<script setup lang="ts">
import { ref, reactive } from "vue";
import { usePlaygrounds } from "~/composables/usePlaygrounds";
import AddressAutocompleteInput from "~/components/AddressAutocompleteInput.vue";
import type {
  AddressSuggestion,
  Playground,
  PlaygroundCreatePayload,
  PlaygroundUpdatePayload,
} from "@ministrosfc/shared";

export type PlaygroundFormData = PlaygroundCreatePayload &
  PlaygroundUpdatePayload & {
    expectedUpdatedAt: string;
  };

const props = withDefaults(
  defineProps<{
    playground?: Playground | null;
    submitLabel?: string;
    cancelTo?: string;
    loading?: boolean;
    error?: string;
  }>(),
  {
    playground: null,
    submitLabel: "Guardar cancha",
    cancelTo: "/admin/playgrounds",
    loading: false,
    error: "",
  },
);

const emit = defineEmits<{
  (e: "submit", payload: PlaygroundFormData): void;
}>();

const addressError = ref<unknown>(null);
const form = reactive<PlaygroundFormData>({
  name: "",
  address: "",
  latitude: undefined,
  longitude: undefined,
  expectedUpdatedAt: "",
});

watch(
  () => props.playground,
  (playground) => {
    if (!playground) {
      form.name = "";
      form.address = "";
      form.latitude = undefined;
      form.longitude = undefined;
      form.expectedUpdatedAt = "";
      return;
    }

    form.name = playground.name ?? "";
    form.address = playground.address ?? "";
    form.latitude = playground.latitude ?? undefined;
    form.longitude = playground.longitude ?? undefined;
    form.expectedUpdatedAt = playground.updatedAt ?? "";
  },
  { immediate: true },
);

function handleSubmit() {
  addressError.value = null;

  const payload: PlaygroundFormData = {
    name: form.name.trim(),
    address: form.address.trim(),
    latitude: form.latitude,
    longitude: form.longitude,
    expectedUpdatedAt: form.expectedUpdatedAt,
  };

  if (addressError.value) {
    // If there is an address error, do not proceed with submission
    console.error(addressError.value);
    return;
  }

  if (payload.latitude === undefined) {
    delete payload.latitude;
  }

  if (payload.longitude === undefined) {
    delete payload.longitude;
  }

  emit("submit", payload);
}

function onAddressSelect(suggestion: AddressSuggestion | null) {
  form.latitude = suggestion?.lat ?? undefined;
  form.longitude = suggestion?.lon ?? undefined;
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
        <h2 v-if="playground" class="mt-1 text-xl font-semibold text-gray-900">
          {{ playground.name }}
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

      <label class="block text-sm font-medium text-gray-700 mb-1"
        >Dirección <span class="text-red-500">*</span></label
      >
      <AddressAutocompleteInput
        v-model="form.address"
        required
        placeholder="Ej: Av. Corrientes 1234, Buenos Aires"
        :class="{ 'border-red-400': addressError }"
        @select="onAddressSelect"
        @error="addressError = $event"
      />
      <p v-if="addressError" class="mt-1 text-xs text-red-600">
        {{ addressError }}
      </p>
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
