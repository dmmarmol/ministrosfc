<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import PlayerDeleteModal from "~/components/player/PlayerDeleteModal.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
});

const { $api } = useNuxtApp();
const authStore = useAuthStore();
const showDeleteModal = ref(false);
const router = useRouter();
const route = useRoute();
const id = route.params.id as string;

const { data, pending, refresh } = await useAsyncData(`edit-player-${id}`, () =>
  $api<{ data: any }>(`/api/v1/players/${id}`),
);
const player = computed(() => data.value?.data ?? null);

const form = reactive({
  firstName: "",
  lastName: "",
  nickname: "",
  position: "",
  jerseyNumber: null as number | null,
  dateOfBirth: "",
});

watch(
  player,
  (p) => {
    if (!p) return;
    form.firstName = p.firstName ?? "";
    form.lastName = p.lastName ?? "";
    form.nickname = p.nickname ?? "";
    form.position = p.position ?? "";
    form.jerseyNumber = p.jerseyNumber ?? null;
    form.dateOfBirth = p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "";
  },
  { immediate: true },
);

useHead(() => ({
  title: player.value
    ? `Edit ${player.value.firstName} ${player.value.lastName} – Admin`
    : "Edit Player",
}));

const photoInput = ref<HTMLInputElement | null>(null);
const photoFile = ref<File | null>(null);
const photoPreview = ref<string | null>(null);
const loading = ref(false);
const error = ref("");

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    photoFile.value = file;
    photoPreview.value = URL.createObjectURL(file);
  }
}

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    const fd = new FormData();
    fd.append("firstName", form.firstName);
    fd.append("lastName", form.lastName);
    if (form.nickname !== undefined) fd.append("nickname", form.nickname);
    if (form.position) fd.append("position", form.position);
    if (form.jerseyNumber) fd.append("jerseyNumber", String(form.jerseyNumber));
    if (form.dateOfBirth) fd.append("dateOfBirth", form.dateOfBirth);
    if (photoFile.value) fd.append("photo", photoFile.value);
    await $api(`/api/v1/players/${id}`, { method: "PATCH", body: fd });
    await router.push("/admin/players");
  } catch (e: any) {
    error.value = e?.message ?? "No se pudo guardar el jugador.";
  } finally {
    loading.value = false;
  }
}

async function toggleStatus() {
  if (!player.value) return;
  loading.value = true;
  try {
    const newStatus = player.value.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await $api(`/api/v1/players/${id}/status`, {
      method: "PATCH",
      body: { status: newStatus },
    });
    await refresh();
  } catch (e: any) {
    error.value = e?.message ?? "No se pudo actualizar el estado.";
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
    <NuxtLink
      to="/admin/players"
      class="text-sm text-gray-500 hover:text-brand mb-4 inline-block"
      >← Volver a Jugadores</NuxtLink
    >
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
    <form
      v-else-if="player"
      class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4"
      @submit.prevent="submit"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1"
            >Nombre *</label
          >
          <input
            v-model="form.firstName"
            required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1"
            >Apellido *</label
          >
          <input
            v-model="form.lastName"
            required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1"
            >Apodo</label
          >
          <input
            v-model="form.nickname"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1"
            >Posición</label
          >
          <select
            v-model="form.position"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">—</option>
            <option value="GK">Portero</option>
            <option value="CB">Defensa Central</option>
            <option value="RB">Lateral Derecho</option>
            <option value="LB">Lateral Izquierdo</option>
            <option value="RWB">Carrilero Derecho</option>
            <option value="LWB">Carrilero Izquierdo</option>
            <option value="DMF">Mediocampista Defensivo</option>
            <option value="CMF">Mediocampista Central</option>
            <option value="AMF">Mediocampista Ofensivo</option>
            <option value="RMF">Mediocampista Derecho</option>
            <option value="LMF">Mediocampista Izquierdo</option>
            <option value="SS">Segundo Delantero</option>
            <option value="CF">Delantero Centro</option>
            <option value="RWF">Extremo Derecho</option>
            <option value="LWF">Extremo Izquierdo</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1"
            >Dorsal #</label
          >
          <input
            v-model.number="form.jerseyNumber"
            type="number"
            min="1"
            max="99"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1"
            >Fecha de Nacimiento</label
          >
          <input
            v-model="form.dateOfBirth"
            type="date"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <!-- Photo -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Foto</label>
        <div class="flex items-center gap-4">
          <div
            class="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex-shrink-0"
          >
            <img
              :src="photoPreview ?? player.photoUrl ?? undefined"
              :alt="`${player.firstName} ${player.lastName}`"
              class="w-full h-full object-cover"
            />
          </div>
          <button
            type="button"
            class="text-sm text-brand hover:underline"
            @click="photoInput?.click()"
          >
            Cambiar foto
          </button>
          <input
            ref="photoInput"
            type="file"
            accept="image/jpeg,image/png"
            class="hidden"
            @change="onFileChange"
          />
        </div>
      </div>

      <p
        v-if="error"
        class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"
      >
        {{ error }}
      </p>
      <div class="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          :disabled="loading"
          class="bg-brand text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-60"
        >
          {{ loading ? "Guardando…" : "Guardar Cambios" }}
        </button>
        <button
          type="button"
          :disabled="loading"
          :class="
            player.status === 'ACTIVE'
              ? 'border-red-200 text-red-600 hover:bg-red-50'
              : 'border-green-200 text-green-600 hover:bg-green-50'
          "
          class="text-sm px-5 py-2.5 rounded-lg border"
          @click="toggleStatus"
        >
          {{ player.status === "ACTIVE" ? "Desactivar" : "Activar" }}
        </button>
        <button
          v-if="authStore.isAdmin"
          data-testid="delete-player-btn"
          type="button"
          :disabled="loading"
          class="text-sm px-5 py-2.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
          @click="showDeleteModal = true"
        >
          Eliminar Jugador
        </button>
      </div>
    </form>
  </div>
</template>
