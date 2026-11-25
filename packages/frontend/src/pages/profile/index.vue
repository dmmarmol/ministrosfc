<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { DEFAULT_DATE_LOCALE } from "@ministrosfc/shared";

definePageMeta({ layout: "sheet", middleware: "auth", requiresAuth: true });
useHead({ title: "Perfil de usuario" });

const { $api } = useNuxtApp();

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
  return new Date(date).toLocaleDateString(DEFAULT_DATE_LOCALE, {
    month: "long",
    year: "numeric",
  });
}

</script>

<template>
  <div class="mx-auto max-w-2xl px-4 pb-16 pt-6">
    <h1 class="sheet-display text-[clamp(3rem,14vw,5rem)]">Mi perfil</h1>

    <p v-if="loading" class="mt-6">Cargando perfil…</p>

    <template v-else-if="profile">
      <section class="mt-6 border-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)] p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="sheet-display break-words text-4xl">
              {{ profile.user.firstName }} {{ profile.user.lastName }}
            </h2>
            <p class="mt-1 break-all text-sm text-[var(--sheet-ink-soft)]">{{ profile.user.email }}</p>
          </div>
          <span class="shrink-0 border border-[var(--sheet-blue)] px-1.5 text-xs font-bold text-[var(--sheet-blue)]">
            {{ profile.user.role }}
          </span>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-4">
          <div>
            <label class="sheet-label" for="profile-first">Nombre</label>
            <input
              id="profile-first"
              v-model="form.firstName"
              type="text"
              :disabled="!editMode"
              class="sheet-field mt-1 disabled:opacity-70"
            />
          </div>
          <div>
            <label class="sheet-label" for="profile-last">Apellido</label>
            <input
              id="profile-last"
              v-model="form.lastName"
              type="text"
              :disabled="!editMode"
              class="sheet-field mt-1 disabled:opacity-70"
            />
          </div>
        </div>

        <dl class="mt-6 grid grid-cols-2 gap-4 border-t-[3px] border-[var(--sheet-ink)] pt-4 text-sm">
          <div>
            <dt class="sheet-label">Miembro desde</dt>
            <dd class="mt-1 font-bold">{{ memberSince(profile.user.createdAt) }}</dd>
          </div>
          <div>
            <dt class="sheet-label">Autenticación</dt>
            <dd class="mt-1 font-bold">
              <span v-if="profile.user.hasPassword">Contraseña</span>
              <span v-if="profile.user.hasPassword && profile.user.hasGoogle"> + </span>
              <span v-if="profile.user.hasGoogle">Google</span>
            </dd>
          </div>
        </dl>

        <p v-if="error" class="sheet-notice mt-4" data-tone="error" role="alert">
          {{ error }}
        </p>

        <div class="mt-6 flex justify-end gap-3">
          <template v-if="editMode">
            <button type="button" class="sheet-button" data-variant="outline" @click="editMode = false">
              Cancelar
            </button>
            <button type="button" class="sheet-button" @click="saveChanges">
              {{ loading ? "Guardando…" : "Guardá los cambios" }}
            </button>
          </template>
          <button v-else type="button" class="sheet-button" data-variant="outline" @click="editMode = true">
            Editar
          </button>
        </div>
      </section>

      <section v-if="profile.user.playerId" class="mt-6 border-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)] p-5">
        <p>También tenés acceso a tu perfil de jugador</p>
        <NuxtLink to="/profile/player" class="sheet-link mt-2 inline-flex min-h-11 items-center">
          Ver perfil de jugador →
        </NuxtLink>
      </section>
    </template>

    <p v-else class="sheet-notice mt-6" data-tone="error" role="alert">
      {{ error || "No se pudo cargar el perfil" }}
    </p>
  </div>
</template>
