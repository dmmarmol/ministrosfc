<script setup lang="ts">
import { ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => Promise<void> | void;
    onCancel?: () => void;
  }>(),
  {
    description: "",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
  },
);

const emit = defineEmits<{
  "update:open": [value: boolean];
  error: [error: unknown];
}>();

const isConfirming = ref(false);
const errorMessage = ref("");
const modalUi = {
  container: "flex min-h-full items-center justify-center text-center",
  width: "w-full sm:max-w-md",
  overlay: {
    background: "bg-black/60",
  },
};

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      errorMessage.value = "";
      isConfirming.value = false;
    }
  },
);

function requestClose() {
  emit("update:open", false);
}

function toMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "No se pudo completar la acción. Intentá nuevamente.";
}

function handleCancel() {
  if (isConfirming.value) return;
  props.onCancel?.();
  requestClose();
}

function handleOpenChange(value: boolean) {
  if (value) return;
  handleCancel();
}

async function handleConfirm() {
  if (isConfirming.value) return;
  errorMessage.value = "";
  isConfirming.value = true;

  try {
    await props.onConfirm();
    requestClose();
  } catch (error) {
    errorMessage.value = toMessage(error);
    emit("error", error);
  } finally {
    isConfirming.value = false;
  }
}
</script>

<template>
  <UModal
    :model-value="open"
    :prevent-close="isConfirming"
    @update:model-value="handleOpenChange"
    :transition="true"
    :ui="modalUi"
  >
    <div class="p-6" data-testid="confirmation-modal">
      <h3 class="text-lg font-bold text-gray-900 mb-2">{{ title }}</h3>
      <p v-if="description" class="text-sm text-gray-600 mb-4">
        {{ description }}
      </p>
      <p v-if="errorMessage" class="text-sm text-red-600 mb-4" role="alert">
        {{ errorMessage }}
      </p>

      <div class="flex gap-3 justify-end">
        <button
          data-testid="cancel-confirmation"
          type="button"
          class="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          :disabled="isConfirming"
          @click="handleCancel"
        >
          {{ cancelText }}
        </button>
        <button
          data-testid="confirm-confirmation"
          type="button"
          class="text-sm px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60"
          :disabled="isConfirming"
          @click="handleConfirm"
        >
          {{ isConfirming ? "Procesando..." : confirmText }}
        </button>
      </div>
    </div>
  </UModal>
</template>
