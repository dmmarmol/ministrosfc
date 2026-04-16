<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useAuthStore } from "~/stores/auth";
import LoginForm from "~/components/auth/LoginForm.vue";
import RegisterForm from "~/components/auth/RegisterForm.vue";
import GoogleSignInButton from "~/components/auth/GoogleSignInButton.vue";
import BackButton from "~/components/ui/BackButton.vue";

definePageMeta({ layout: false, middleware: "auth", authPage: true });

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const isRegisterMode = ref(false);
const loading = ref(false);
const error = ref("");

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_cancelled: "Inicio de sesión con Google cancelado.",
  google_failed: "Error al iniciar sesión con Google. Intentá de nuevo.",
  csrf_mismatch: "Error de seguridad. Intentá de nuevo.",
};

const googleError = computed(() => {
  const err = route.query.error as string | undefined;
  return err ? (GOOGLE_ERROR_MESSAGES[err] ?? "Error desconocido.") : "";
});

function toggleMode() {
  isRegisterMode.value = !isRegisterMode.value;
  error.value = "";
}

async function navigateAfterAuth() {
  const redirect = route.query.redirect as string | undefined;
  if (authStore.needsOnboarding) {
    const dest = redirect ?? (authStore.isEditor ? "/admin/dashboard" : "/");
    await router.push(`/auth/onboarding?redirect=${encodeURIComponent(dest)}`);
  } else if (redirect) {
    await router.push(redirect);
  } else if (authStore.isEditor) {
    await router.push("/admin/dashboard");
  } else {
    await router.push("/");
  }
}

async function handleLogin(payload: { email: string; password: string }) {
  error.value = "";
  loading.value = true;
  try {
    await authStore.login(payload.email, payload.password);
    await navigateAfterAuth();
    // Navigation succeeded — keep loading=true so the form doesn't
    // re-render while Vue swaps the page component.
    return;
  } catch (e: any) {
    error.value = e?.message ?? "Email o contraseña incorrectos.";
  }
  loading.value = false;
}

async function handleRegister(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}) {
  error.value = "";
  loading.value = true;
  try {
    await authStore.register(payload);
    await router.push("/auth/onboarding");
  } catch (e: any) {
    error.value = e?.message ?? "Error al registrarse. Intentá de nuevo.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (route.query.mode === "register") {
    isRegisterMode.value = true;
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-sm">
      <div class="mb-3">
        <BackButton to="/" label="Volver al sitio" />
      </div>
      <div class="text-center mb-8">
        <div
          class="w-16 h-16 bg-brand rounded-full mx-auto flex items-center justify-center text-gray-900 font-bold text-2xl mb-4"
        >
          M
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Ministros FC</h1>
        <p class="text-gray-500 text-sm mt-1">
          {{ isRegisterMode ? "Creá tu cuenta" : "Iniciá sesión en tu cuenta" }}
        </p>
      </div>

      <div
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
      >
        <p
          v-if="googleError"
          class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"
        >
          {{ googleError }}
        </p>

        <LoginForm
          v-if="!isRegisterMode"
          :loading="loading"
          :error="error"
          @submit="handleLogin"
        />
        <RegisterForm
          v-else
          :loading="loading"
          :error="error"
          @submit="handleRegister"
        />

        <div class="relative my-2">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200" />
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="bg-white px-2 text-gray-400">o</span>
          </div>
        </div>

        <GoogleSignInButton />

        <p class="text-center text-sm text-gray-500 mt-4">
          <button
            type="button"
            class="text-brand font-medium hover:underline"
            @click="toggleMode"
          >
            {{
              isRegisterMode
                ? "¿Ya tenés cuenta? Iniciá sesión"
                : "¿No tenés cuenta? Registrate"
            }}
          </button>
        </p>
      </div>
    </div>
  </div>
</template>
