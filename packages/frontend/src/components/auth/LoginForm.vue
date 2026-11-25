<script setup lang="ts">
import { reactive } from "vue";
import EmailInput from "~/components/ui/EmailInput.vue";


const { t } = useI18n();
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

<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <div>
      <label class="sheet-label" for="login-email">
        {{ t("authLoginForm.correoElectronico") }}
      </label>
      <EmailInput
        id="login-email"
        v-model="form.email"
        autocomplete="email"
        :required="true"
      />
    </div>
    <div>
      <label class="sheet-label" for="login-password">
        {{ t("common.contrasena") }}
      </label>
      <input
        id="login-password"
        v-model="form.password"
        type="password"
        autocomplete="current-password"
        required
        class="sheet-field mt-1"
        placeholder="••••••••"
      />
    </div>
    <p v-if="error" class="sheet-notice" data-tone="error" role="alert">
      {{ error }}
    </p>
    <button type="submit" :disabled="loading" class="sheet-button w-full">
      {{ loading ? t("authLoginForm.iniciandoSesion") : t("authLoginForm.iniciarSesion") }}
    </button>
  </form>
</template>
