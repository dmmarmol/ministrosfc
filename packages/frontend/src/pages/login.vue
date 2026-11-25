<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "~/stores/auth";
import LoginForm from "~/components/auth/LoginForm.vue";
import RegisterForm from "~/components/auth/RegisterForm.vue";
// import GoogleSignInButton from "~/components/auth/GoogleSignInButton.vue";
import PendingApprovalBanner from "~/components/auth/PendingApprovalBanner.vue";
import BackButton from "~/components/ui/BackButton.vue";

definePageMeta({ layout: "sheet", middleware: "auth", authPage: true });

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const isRegisterMode = ref(false);
const loading = ref(false);
const error = ref("");
const pendingApprovalMessage = ref("");

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
  pendingApprovalMessage.value = "";
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
  pendingApprovalMessage.value = "";
  loading.value = true;
  try {
    await authStore.login(payload.email, payload.password);
    await navigateAfterAuth();
    // Navigation succeeded — keep loading=true so the form doesn't
    // re-render while Vue swaps the page component.
    return;
  } catch (e: any) {
    error.value =
      e?.message ?? "El correo electrónico o la contraseña son incorrectos.";
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
  pendingApprovalMessage.value = "";
  loading.value = true;
  try {
    const result = await authStore.register(payload);
    pendingApprovalMessage.value = result.message;
    isRegisterMode.value = false;
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
  <div class="mx-auto max-w-md px-4 pb-16 pt-6">
    <BackButton to="/" label="Volvé al sitio" />
    <h1 class="sheet-display mt-2 text-[clamp(3.25rem,16vw,5.5rem)]">
      {{ isRegisterMode ? "Registrate" : "Ingresar" }}
    </h1>
    <p class="mt-2">
      {{ isRegisterMode ? "Creá tu cuenta" : "Iniciá sesión en tu cuenta" }}
    </p>

    <div class="mt-6 space-y-5 border-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)] p-5">
      <p v-if="googleError" class="sheet-notice" data-tone="error" role="alert">
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

      <PendingApprovalBanner
        v-if="pendingApprovalMessage"
        :message="pendingApprovalMessage"
      />

      <!-- @TODO Temporary disable google sign in -->
      <!-- <GoogleSignInButton /> -->

      <p class="border-t-[3px] border-[var(--sheet-ink)] pt-4">
        <button type="button" class="sheet-link min-h-11 text-left" @click="toggleMode">
          {{
            isRegisterMode
              ? "¿Ya tenés cuenta? Iniciá sesión"
              : "¿No tenés cuenta? Registrate"
          }}
        </button>
      </p>
    </div>
  </div>
</template>
