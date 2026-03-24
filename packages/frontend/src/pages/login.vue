<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div
          class="w-16 h-16 bg-brand rounded-full mx-auto flex items-center justify-center text-gray-900 font-bold text-2xl mb-4"
        >
          M
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Ministros FC</h1>
        <p class="text-gray-500 text-sm mt-1">Iniciá sesión en tu cuenta</p>
      </div>

      <form
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
        @submit.prevent="handleLogin"
      >
        <div>
          <label
            class="block text-sm font-medium text-gray-700 mb-1"
            for="email"
            >Correo electrónico</label
          >
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
            >Contraseña</label
          >
          <input
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
            placeholder="••••••••"
          />
        </div>
        <p
          v-if="error"
          class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"
        >
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

definePageMeta({ layout: false });

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({ email: "", password: "" });
const loading = ref(false);
const error = ref("");

async function handleLogin() {
  error.value = "";
  loading.value = true;
  try {
    await authStore.login(form.email, form.password);
    const redirect = route.query.redirect as string | undefined;
    if (redirect) {
      await router.push(redirect);
    } else if (authStore.isEditor) {
      await router.push("/admin/dashboard");
    } else {
      await router.push("/player/games");
    }
  } catch (e: any) {
    error.value = e?.message ?? "Invalid email or password.";
  } finally {
    loading.value = false;
  }
}
</script>
