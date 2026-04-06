<script setup lang="ts">
import { reactive, ref, computed } from "vue";
import { PASSWORD_RULES } from "@ministrosfc/shared";
import EmailInput from "~/components/ui/EmailInput.vue";

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
    },
  ];
}>();

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  passwordConfirmation: "",
});

const mismatchError = ref(false);
const emailInputRef = ref<InstanceType<typeof EmailInput>>();

const passwordRuleStatus = computed(() =>
  PASSWORD_RULES.map((rule) => ({
    message: rule.message,
    met: rule.regex.test(form.password),
  })),
);

function handleSubmit() {
  mismatchError.value = false;
  if (!emailInputRef.value?.validate()) return;
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
      <EmailInput
        id="email"
        ref="emailInputRef"
        v-model="form.email"
        autocomplete="email"
        :required="true"
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
