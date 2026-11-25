<script setup lang="ts">
import { ref } from "vue";
import type { AddressSuggestion } from "@ministrosfc/shared";

const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;

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
  (e: "error", error: unknown): void;
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
        `${apiBase}/api/v1/address/search`,
        {
          params: { q: value },
        },
      );
      suggestions.value = result.data;
      open.value = true;
    } catch (e) {
      error.value = "No se pueden cargar sugerencias en este momento";
      suggestions.value = [];
      open.value = true;
      emit("error", e);
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
      class="sheet-field mt-1"
      autocomplete="off"
      @input="onInput"
      @keydown="onKeydown"
      @blur="closeDropdown"
    />

    <ul
      v-if="open"
      data-testid="suggestions"
      class="absolute z-50 w-full border-[3px] border-t-0 border-[var(--sheet-ink)] bg-[var(--sheet-paper)]"
    >
      <template v-if="error">
        <li class="sheet-error-text px-3 py-2">{{ error }}</li>
      </template>
      <template v-else-if="suggestions.length === 0">
        <li class="px-3 py-2 text-sm text-[var(--sheet-ink-soft)]">
          Sin resultados para esta búsqueda
        </li>
      </template>
      <template v-else>
        <li
          v-for="suggestion in suggestions"
          :key="suggestion.placeId ?? suggestion.displayName"
          data-testid="suggestion-item"
          class="min-h-11 cursor-pointer truncate px-3 py-2.5 text-sm hover:bg-[var(--sheet-ground)]"
          @mousedown.prevent
          @click="selectSuggestion(suggestion)"
        >
          {{ suggestion.displayName }}
        </li>
      </template>
      <li class="border-t border-[var(--sheet-rule)] px-3 py-1 text-xs text-[var(--sheet-ink-soft)]">
        © OpenStreetMap contributors
      </li>
    </ul>
  </div>
</template>
