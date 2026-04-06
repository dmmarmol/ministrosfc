<script setup lang="ts">
import { ref, onMounted } from "vue";

definePageMeta({ middleware: "auth" });
useHead({ title: "Perfil de Usuario – Ministros FC" });

const { $api } = useNuxtApp();
const authStore = useAuthStore();

interface UserProfile {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    hasPassword: boolean;
    hasGoogle: boolean;
    playerId: string | null;
    createdAt: string;
  };
}

const profile = ref<UserProfile | null>(null);
const loading = ref(true);
const error = ref("");
const editMode = ref(false);
const form = reactive({
  firstName: "",
  lastName: "",
});

onMounted(async () => {
  try {
    const res = await $api<{ data: UserProfile }>("/api/v1/profile");
    profile.value = res.data;
    form.firstName = res.data.user.firstName;
    form.lastName = res.data.user.lastName;
  } catch (e: any) {
    error.value = e?.message ?? "Error al cargar el perfil";
  } finally {
    loading.value = false;
  }
});

async function saveChanges() {
  if (!profile.value) return;
  try {
    const res = await $api<{ data: UserProfile }>("/api/v1/profile", {
      method: "PATCH",
      body: form,
    });
    profile.value = res.data;
    editMode.value = false;
    form.firstName = res.data.user.firstName;
    form.lastName = res.data.user.lastName;
  } catch (e: any) {
    error.value = e?.message ?? "Error al guardar los cambios";
  }
}

function memberSince(date: string): string {
  return new Date(date).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
}

function roleBadgeClass(role: string): string {
  const classes: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-800",
    EDITOR: "bg-purple-100 text-purple-800",
    DT: "bg-blue-100 text-blue-800",
    PLAYER: "bg-green-100 text-green-800",
  };
  return classes[role] ?? "bg-gray-100 text-gray-800";
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 space-y-8">
    <div v-if="loading" class="text-center py-16 text-gray-400">
      Cargando perfil…
    </div>

    <template v-else-if="profile">
      <!-- User Info Card -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">
              {{ profile.user.firstName }} {{ profile.user.lastName }}
            </h2>
            <p class="text-gray-500 text-sm mt-1">{{ profile.user.email }}</p>
          </div>
          <span
            class="inline-block px-3 py-1 text-sm font-semibold rounded-full"
            :class="roleBadgeClass(profile.user.role)"
          >
            {{ profile.user.role }}
          </span>
        </div>

        <!-- Name Fields (disabled until edit mode) -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label
              class="block text-xs font-semibold text-gray-500 uppercase mb-2"
            >
              Nombre
            </label>
            <input
              v-model="form.firstName"
              type="text"
              :disabled="!editMode"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white disabled:bg-gray-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
          <div>
            <label
              class="block text-xs font-semibold text-gray-500 uppercase mb-2"
            >
              Apellido
            </label>
            <input
              v-model="form.lastName"
              type="text"
              :disabled="!editMode"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white disabled:bg-gray-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
        </div>

        <!-- Info Fields -->
        <div class="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-6">
          <div>
            <p class="text-gray-500 text-xs uppercase font-semibold">
              Miembro desde
            </p>
            <p class="text-gray-800">
              {{ memberSince(profile.user.createdAt) }}
            </p>
          </div>
          <div>
            <p class="text-gray-500 text-xs uppercase font-semibold">
              Métodos de autenticación
            </p>
            <p class="text-gray-800">
              <span v-if="profile.user.hasPassword">Contraseña</span>
              <span v-if="profile.user.hasPassword && profile.user.hasGoogle">
                +
              </span>
              <span v-if="profile.user.hasGoogle">Google</span>
            </p>
          </div>
        </div>

        <!-- Error Message -->
        <p
          v-if="error"
          class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4"
        >
          {{ error }}
        </p>

        <!-- Action Buttons -->
        <div v-if="editMode" class="flex gap-2">
          <button
            class="flex-1 bg-brand text-gray-900 font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            @click="saveChanges"
          >
            Guardar cambios
          </button>
          <button
            class="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            @click="editMode = false"
          >
            Cancelar
          </button>
        </div>
        <button
          v-else
          class="text-sm text-brand font-semibold hover:underline"
          @click="editMode = true"
        >
          Editar
        </button>
      </div>

      <!-- Player Profile Link -->
      <div
        v-if="profile.user.playerId"
        class="bg-blue-50 rounded-xl border border-blue-200 p-6"
      >
        <p class="text-sm text-blue-800 mb-4">
          También tenés acceso a tu perfil de jugador
        </p>
        <NuxtLink
          to="/profile/player"
          class="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Ver Perfil de Jugador
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NuxtLink>
      </div>
    </template>

    <div v-else class="text-center py-16 text-red-500">
      {{ error || "No se pudo cargar el perfil" }}
    </div>
  </div>
</template>
