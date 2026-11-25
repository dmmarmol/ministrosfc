<script setup lang="ts">
import { reactive, ref, computed } from "vue";
import { PASSWORD_RULES } from "@ministrosfc/shared";
import EmailInput from "~/components/ui/EmailInput.vue";

defineProps<{
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
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="sheet-label" for="firstName">
          Nombre
        </label>
        <input
          id="firstName"
          v-model="form.firstName"
          type="text"
          autocomplete="given-name"
          required
          class="sheet-field mt-1"
          placeholder="Juan"
        />
      </div>
      <div>
        <label class="sheet-label" for="lastName">
          Apellido
        </label>
        <input
          id="lastName"
          v-model="form.lastName"
          type="text"
          autocomplete="family-name"
          required
          class="sheet-field mt-1"
          placeholder="Pérez"
        />
      </div>
    </div>
    <div>
      <label class="sheet-label" for="email">
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
      <label class="sheet-label" for="password">
        Contraseña
      </label>
      <input
        id="password"
        v-model="form.password"
        type="password"
        autocomplete="new-password"
        required
        class="sheet-field mt-1"
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
          :class="rule.met ? 'text-green-600 font-bold' : 'text-[var(--sheet-ink-soft)]'"
          class="flex items-center gap-1"
        >
          <span>{{ rule.met ? "✓" : "○" }}</span>
          <span>{{ rule.message }}</span>
        </li>
      </ul>
    </div>
    <div>
      <label class="sheet-label" for="passwordConfirmation">
        Confirmar contraseña
      </label>
      <input
        id="passwordConfirmation"
        v-model="form.passwordConfirmation"
        type="password"
        autocomplete="new-password"
        required
        class="sheet-field mt-1"
        placeholder="••••••••"
      />
    </div>

    <p v-if="mismatchError" class="sheet-notice" data-tone="error" role="alert">
      Las contraseñas no coinciden
    </p>
    <p v-if="error" class="sheet-notice" data-tone="error" role="alert">
      {{ error }}
    </p>
    <button type="submit" :disabled="loading" class="sheet-button w-full">
      {{ loading ? "Registrando…" : "Registrarse" }}
    </button>
  </form>
</template>
