<script setup lang="ts">
import { reactive, ref, computed } from "vue";
import { PASSWORD_RULES } from "@ministrosfc/shared";

const props = defineProps<{
  loading: boolean;
  error: string;
}>();

const emit = defineEmits<{
  submit: [
    payload: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      passwordConfirmation: string;
      isPlayer: boolean;
    },
  ];
}>();

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  passwordConfirmation: "",
  isPlayer: true,
});

const mismatchError = ref(false);

const passwordRuleStatus = computed(() =>
  PASSWORD_RULES.map((rule) => ({
    message: rule.message,
    met: rule.regex.test(form.password),
  })),
);

function handleSubmit() {
  mismatchError.value = false;
  if (form.password !== form.passwordConfirmation) {
    mismatchError.value = true;
    return;
  }
  emit("submit", {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email,
    password: form.password,
    passwordConfirmation: form.passwordConfirmation,
    isPlayer: form.isPlayer,
  });
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label
          class="block text-sm font-medium text-gray-700 mb-1"
          for="firstName"
        >
          Nombre
        </label>
        <input
          id="firstName"
          v-model="form.firstName"
          type="text"
          autocomplete="given-name"
          required
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
          placeholder="Juan"
        />
      </div>
      <div>
        <label
          class="block text-sm font-medium text-gray-700 mb-1"
          for="lastName"
        >
          Apellido
        </label>
        <input
          id="lastName"
          v-model="form.lastName"
          type="text"
          autocomplete="family-name"
          required
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
          placeholder="Pérez"
        />
      </div>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1" for="email">
        Correo electrónico
      </label>
      <input
        id="email"
        v-model="form.email"
        type="email"
        autocomplete="email"
        required
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
        placeholder="tu@ejemplo.com"
      />
    </div>
    <div>
      <label
        class="block text-sm font-medium text-gray-700 mb-1"
        for="password"
      >
        Contraseña
      </label>
      <input
        id="password"
        v-model="form.password"
        type="password"
        autocomplete="new-password"
        required
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
        placeholder="••••••••"
      />
      <ul
        v-if="form.password.length > 0"
        data-testid="password-rules"
        class="mt-2 space-y-1 text-xs"
      >
        <li
          v-for="rule in passwordRuleStatus"
          :key="rule.message"
          :class="rule.met ? 'text-green-600' : 'text-gray-400'"
          class="flex items-center gap-1"
        >
          <span>{{ rule.met ? "✓" : "○" }}</span>
          <span>{{ rule.message }}</span>
        </li>
      </ul>
    </div>
    <div>
      <label
        class="block text-sm font-medium text-gray-700 mb-1"
        for="passwordConfirmation"
      >
        Confirmar contraseña
      </label>
      <input
        id="passwordConfirmation"
        v-model="form.passwordConfirmation"
        type="password"
        autocomplete="new-password"
        required
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
        placeholder="••••••••"
      />
    </div>
    <label
      for="isPlayer"
      class="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
    >
      <input
        id="isPlayer"
        v-model="form.isPlayer"
        type="checkbox"
        class="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/50"
      />
      <span class="text-sm text-gray-700">Eres un jugador del equipo?</span>
    </label>
    <p
      v-if="mismatchError"
      class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"
    >
      Las contraseñas no coinciden
    </p>
    <p v-if="error" class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
      {{ error }}
    </p>
    <button
      type="submit"
      :disabled="loading"
      class="w-full bg-brand text-gray-900 font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
    >
      {{ loading ? "Registrando…" : "Registrarse" }}
    </button>
  </form>
</template>
