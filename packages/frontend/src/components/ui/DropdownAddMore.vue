<script lang="ts">
/** A generic selectable option. Frontend-only type — does not go to @ministrosfc/shared. */
export interface DropdownOption {
  id: string;
  label: string;
  meta?: Record<string, unknown>;
}

/** All user-facing label overrides. All fields optional; Spanish defaults are applied. */
export interface DropdownLabels {
  placeholder?: string;
  addNew?: string;
  empty?: string;
  noResults?: string;
  retry?: string;
}

export interface DropdownAddMoreProps {
  modelValue: string | null;
  options: DropdownOption[];
  loading?: boolean;
  creationError?: string | null;
  searchable?: boolean;
  disabled?: boolean;
  onCreate?: (payload: Record<string, unknown>) => Promise<DropdownOption>;
  labels?: DropdownLabels;
}
</script>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import VSelect from "vue-select";

const props = withDefaults(defineProps<DropdownAddMoreProps>(), {
  loading: false,
  creationError: null,
  searchable: true,
  disabled: false,
  labels: () => ({}),
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
  (e: "select", option: DropdownOption): void;
}>();

// Internal options list — seeded from props.options; new entries are appended on creation.
const internalOptions = ref<DropdownOption[]>([...props.options]);

watch(
  () => props.options,
  (newOptions) => {
    internalOptions.value = [...newOptions];
  },
);

const addNewLabel = computed(() => props.labels?.addNew ?? "Agregar nueva...");
const showFooter = computed(() => addNewLabel.value !== "");
const emptyLabel = computed(
  () => props.labels?.empty ?? "Sin opciones disponibles",
);
const noResultsLabel = computed(
  () => props.labels?.noResults ?? "Sin resultados",
);
const placeholderLabel = computed(
  () => props.labels?.placeholder ?? "Seleccionar...",
);

// State for inline-create panel
const open_create = ref(false);
const internalCreationError = ref<string | null>(props.creationError ?? null);
const creationLoading = ref(false);

watch(
  () => props.creationError,
  (val) => {
    internalCreationError.value = val ?? null;
  },
);

// Resolve selected option object from modelValue id
const selectedOption = computed<DropdownOption | null>(() => {
  if (props.modelValue === null || props.modelValue === undefined) return null;
  return internalOptions.value.find((o) => o.id === props.modelValue) ?? null;
});

function handleOptionSelected(option: DropdownOption) {
  emit("update:modelValue", option.id);
  emit("select", option);
}

// Inline-create slot functions
async function submitCreate(payload: Record<string, unknown>) {
  if (creationLoading.value || !props.onCreate) return;
  creationLoading.value = true;
  internalCreationError.value = null;
  try {
    const newOption = await props.onCreate(payload);
    internalOptions.value = [...internalOptions.value, newOption];
    emit("update:modelValue", newOption.id);
    emit("select", newOption);
    open_create.value = false;
  } catch (err) {
    internalCreationError.value =
      err instanceof Error ? err.message : String(err);
  } finally {
    creationLoading.value = false;
  }
}

function cancelCreate() {
  open_create.value = false;
  internalCreationError.value = null;
}
</script>

<template>
  <VSelect
    :model-value="selectedOption"
    :options="internalOptions"
    :loading="props.loading"
    :searchable="props.searchable"
    :disabled="props.disabled"
    :placeholder="placeholderLabel"
    :clearable="false"
    :deselect-from-dropdown="false"
    :append-to-body="true"
    label="label"
    @option:selected="handleOptionSelected"
  >
    <!-- No-options slot: distinguish empty list from zero search results -->
    <template #no-options="{ search }">
      <span class="vs__no-options-message">
        {{ search ? noResultsLabel : emptyLabel }}
      </span>
    </template>

    <!-- List-footer slot: only rendered when addNew label is set -->
    <template #list-footer>
      <li v-if="showFooter" class="vs__dropdown-add-more-footer">
        <template v-if="!open_create">
          <button
            type="button"
            class="vs__add-new-btn"
            @click.stop="open_create = true"
          >
            {{ addNewLabel }}
          </button>
        </template>
        <template v-else>
          <slot
            name="inline-create"
            :submit="submitCreate"
            :cancel="cancelCreate"
            :error="internalCreationError"
            :loading="creationLoading"
          />
        </template>
      </li>
    </template>
  </VSelect>
</template>

<style scoped>
/* Align vue-select visuals with the Tailwind design system */
:deep(.v-select) {
  --vs-border-color: #d1d5db; /* gray-300 */
  --vs-border-radius: 0.5rem; /* rounded-lg */
  --vs-font-size: 0.875rem; /* text-sm */
  --vs-dropdown-box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --vs-dropdown-z-index: 9999;
  --vs-controls-color: #6b7280; /* gray-500 */
  --vs-selected-color: #111827; /* gray-900 */
}

:deep(.vs__dropdown-toggle) {
  padding: 0.375rem 0.75rem;
}

:deep(.vs__search::placeholder) {
  color: #9ca3af; /* gray-400 */
}

.vs__dropdown-add-more-footer {
  list-style: none;
  border-top: 1px solid #f3f4f6; /* gray-100 */
  margin-top: 0.25rem;
}

:deep(.vs__add-new-btn) {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  color: #6b7280; /* gray-500 */
  cursor: pointer;
  background: transparent;
  border: none;
}

:deep(.vs__add-new-btn:hover) {
  background-color: #f9fafb; /* gray-50 */
  color: #111827; /* gray-900 */
}
</style>
