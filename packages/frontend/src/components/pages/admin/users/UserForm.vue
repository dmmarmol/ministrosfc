<script setup lang="ts">
import { reactive, watch } from "vue";

export type UserFormData = {
  email: string;
  password?: string;
  expectedUpdatedAt: string;
};

const props = withDefaults(
  defineProps<{
    initialData?: Partial<UserFormData>;
    submitLabel?: string;
    cancelTo?: string;
    loading?: boolean;
  }>(),
  {
    initialData: () => ({}),
    submitLabel: "Guardar perfil",
    cancelTo: "/admin/users",
    loading: false,
  },
);

const emit = defineEmits<{
  (e: "submit", payload: UserFormData): void;
}>();

const form = reactive({
  email: "",
  password: "",
  expectedUpdatedAt: "",
});

watch(
  () => props.initialData,
  (initial) => {
    form.email = initial.email ?? "";
    form.password = "";
    form.expectedUpdatedAt = initial.expectedUpdatedAt ?? "";
  },
  { immediate: true, deep: true },
);

function handleSubmit() {
  const payload: UserFormData = {
    email: form.email.trim().toLowerCase(),
    expectedUpdatedAt: form.expectedUpdatedAt,
  };

  if (form.password.trim()) {
    payload.password = form.password;
  }

  emit("submit", {
    ...payload,
  });
}
</script>

<template>
  <form
    class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4"
    @submit.prevent="handleSubmit"
  >
    <div>
      <h3 class="text-sm font-semibold text-gray-800">Perfil de usuario</h3>
      <p class="text-xs text-gray-500">
        Editá email y contraseña de la cuenta.
      </p>
    </div>

    <div class="grid lg:grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1" for="email"
          >Email *</label
        >
        <UInput
          id="email"
          v-model="form.email"
          required
          type="email"
          class="w-full"
        />
      </div>

      <div>
        <label
          class="block text-xs font-medium text-gray-700 mb-1"
          for="password"
          >Contraseña</label
        >
        <UInput
          id="password"
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          placeholder="Dejar vacío para no cambiar"
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
