<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import PlayerDeleteModal from "~/components/player/PlayerDeleteModal.vue";
import PlayerForm, {
  type PlayerFormData,
} from "~/components/pages/admin/players/PlayerForm.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Editar Jugador",
});

const { $api } = useNuxtApp();
const authStore = useAuthStore();
const showDeleteModal = ref(false);
const router = useRouter();
const route = useRoute();
const id = route.params.id as string;

const { data, pending } = await useAsyncData(`edit-player-${id}`, () =>
  $api<{ data: any }>(`/api/v1/players/${id}`),
);
const player = computed(() => data.value?.data ?? null);

const initialFormData = computed(() => {
  if (!player.value) return {};

  return {
    firstName: player.value.firstName ?? "",
    lastName: player.value.lastName ?? "",
    nickname: player.value.nickname ?? "",
    position: player.value.position ?? undefined,
    jerseyNumber: player.value.jerseyNumber
      ? String(player.value.jerseyNumber)
      : undefined,
    dateOfBirth: player.value.dateOfBirth
      ? player.value.dateOfBirth.split("T")[0]
      : "",
    photo: player.value.photoUrl ?? undefined,
  };
});

useHead(() => ({
  title: player.value
    ? `Edit ${player.value.firstName} ${player.value.lastName} – Admin`
    : "Edit Player",
}));

const loading = ref(false);
const error = ref("");

async function submit(data: PlayerFormData) {
  error.value = "";
  loading.value = true;
  try {
    await $api(`/api/v1/players/${id}`, { method: "PATCH", body: data });
    await router.push("/admin/players");
  } catch (e: any) {
    error.value = e?.message ?? "No se pudo guardar el jugador.";
  } finally {
    loading.value = false;
  }
}

async function confirmDelete() {
  if (!player.value) return;
  loading.value = true;
  try {
    await $api(`/api/v1/players/${id}`, { method: "DELETE" });
    await navigateTo("/admin/players");
  } catch (e: any) {
    showDeleteModal.value = false;
    error.value = e?.message ?? "No se pudo eliminar el jugador.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="max-w-xl">
    <div class="mb-4">
      <UiBackButton to="/admin/players" label="Volver a Jugadores" />
    </div>
    <h2 class="text-lg font-bold text-gray-900 mb-6">Editar Jugador</h2>

    <!-- Delete confirmation modal (admin only) -->
    <PlayerDeleteModal
      v-if="showDeleteModal && player"
      :player="{
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
      }"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />

    <div v-if="pending" class="space-y-4">
      <div
        v-for="i in 5"
        :key="i"
        class="h-10 bg-gray-200 animate-pulse rounded-lg"
      />
    </div>
    <div v-else-if="player" class="form-wrapper relative">
      <PlayerForm
        :initial-data="initialFormData"
        submit-label="Guardar Cambios"
        @submit="submit"
        :playerId="player.id"
      >
        <template #buttons>
          <UButton
            v-if="authStore.isAdmin"
            variant="outline"
            color="error"
            @click="showDeleteModal = true"
          >
            Eliminar
          </UButton>
        </template>
      </PlayerForm>

      <UiLoadingOverlay v-if="loading" />

      <p
        v-if="error"
        class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3"
      >
        {{ error }}
      </p>
    </div>
  </div>
</template>
