<script setup lang="ts">
import { ref, watch } from "vue";
import type { AddressSuggestion } from "@ministrosfc/shared";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    id?: string;
    placeholder?: string;
    required?: boolean;
  }>(),
  {
    id: undefined,
    placeholder: undefined,
    required: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "select", suggestion: AddressSuggestion | null): void;
}>();

const suggestions = ref<AddressSuggestion[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const open = ref(false);

let debounceTimer: ReturnType<typeof setTimeout> | undefined;

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  emit("update:modelValue", value);
  emit("select", null);

  clearTimeout(debounceTimer);
  error.value = null;

  if (value.length < 3) {
    suggestions.value = [];
    open.value = false;
    return;
  }

  debounceTimer = setTimeout(async () => {
    loading.value = true;
    try {
      const result = await $fetch<{ data: AddressSuggestion[] }>(
        "/api/v1/address/search",
        {
          params: { q: value },
        },
      );
      suggestions.value = result.data;
      open.value = true;
    } catch {
      error.value = "No se pueden cargar sugerencias en este momento";
      suggestions.value = [];
      open.value = true;
    } finally {
      loading.value = false;
    }
  }, 400);
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    open.value = false;
  }
}

function selectSuggestion(suggestion: AddressSuggestion) {
  emit("update:modelValue", suggestion.displayName);
  emit("select", suggestion);
  open.value = false;
  suggestions.value = [];
}

function closeDropdown() {
  open.value = false;
}
</script>

<template>
  <div class="relative">
    <input
      :id="id"
      type="text"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      autocomplete="off"
      @input="onInput"
      @keydown="onKeydown"
      @blur="closeDropdown"
    />

    <ul
      v-if="open"
      data-testid="suggestions"
      class="absolute z-50 mt-1 w-full rounded border border-gray-200 bg-white shadow-lg"
    >
      <template v-if="error">
        <li class="px-3 py-2 text-xs text-red-600">{{ error }}</li>
      </template>
      <template v-else-if="suggestions.length === 0">
        <li class="px-3 py-2 text-sm text-gray-500">
          Sin resultados para esta búsqueda
        </li>
      </template>
      <template v-else>
        <li
          v-for="suggestion in suggestions"
          :key="suggestion.placeId ?? suggestion.displayName"
          data-testid="suggestion-item"
          class="cursor-pointer truncate px-3 py-2 text-sm hover:bg-blue-50"
          @mousedown.prevent
          @click="selectSuggestion(suggestion)"
        >
          {{ suggestion.displayName }}
        </li>
      </template>
      <li class="border-t border-gray-100 px-3 py-1 text-xs text-gray-400">
        © OpenStreetMap contributors
      </li>
    </ul>
  </div>
</template>
