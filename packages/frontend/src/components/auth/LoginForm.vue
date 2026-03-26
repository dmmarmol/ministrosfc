<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1" for="login-email">
        Correo electrónico
      </label>
      <input
        id="login-email"
        v-model="form.email"
        type="email"
        autocomplete="email"
        required
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
        placeholder="tu@ejemplo.com"
      />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1" for="login-password">
        Contraseña
      </label>
      <input
        id="login-password"
        v-model="form.password"
        type="password"
        autocomplete="current-password"
        required
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
        placeholder="••••••••"
      />
    </div>
    <p v-if="error" class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
      {{ error }}
    </p>
    <button
      type="submit"
      :disabled="loading"
      class="w-full bg-brand text-gray-900 font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
    >
      {{ loading ? "Iniciando sesión…" : "Iniciar sesión" }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { reactive } from "vue";

const props = defineProps<{
  loading: boolean;
  error: string;
}>();

const emit = defineEmits<{
  submit: [payload: { email: string; password: string }];
}>();

const form = reactive({ email: "", password: "" });

function handleSubmit() {
  emit("submit", { email: form.email, password: form.password });
}
</script>
