<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

definePageMeta({ layout: "admin", middleware: "auth" });

const { $api } = useNuxtApp();
const router = useRouter();
const route = useRoute();
const id = route.params.id as string;
const authStore = useAuthStore();

const { data, pending } = await useAsyncData(`edit-game-${id}`, () =>
  $api<{ data: any }>(`/api/v1/games/${id}`),
);
const game = computed(() => data.value?.data ?? null);

const form = reactive({
  date: "",
  time: "",
  location: "",
  notes: "",
  homeTeamScore: null as number | null,
  awayTeamScore: null as number | null,
  status: "SCHEDULED",
});

watch(
  game,
  (g) => {
    if (!g) return;
    form.date = g.date ? g.date.split("T")[0] : "";
    form.time = g.time ?? "";
    form.location = g.location ?? "";
    form.notes = g.notes ?? "";
    form.homeTeamScore = g.homeTeamScore ?? null;
    form.awayTeamScore = g.awayTeamScore ?? null;
    form.status = g.status ?? "SCHEDULED";
  },
  { immediate: true },
);

useHead(() => ({
  title: game.value
    ? `Edit vs ${game.value.opponentTeam?.name} – Admin`
    : "Edit Game",
}));

const loading = ref(false);
const error = ref("");

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    const body: Record<string, any> = {
      date: form.date,
      location: form.location,
      notes: form.notes,
    };
    if (form.time) body.time = form.time;
    if (authStore.isAdmin) {
      body.homeTeamScore = form.homeTeamScore;
      body.awayTeamScore = form.awayTeamScore;
      body.status = form.status;
    }
    await $api(`/api/v1/games/${id}`, { method: "PATCH", body });
    await router.push("/admin/games");
  } catch (e: any) {
    error.value = e?.message ?? "Failed to save game.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="max-w-lg">
    <NuxtLink
      to="/admin/games"
      class="text-sm text-gray-500 hover:text-brand mb-4 inline-block"
      >← Volver a Partidos</NuxtLink
    >
    <h2 class="text-lg font-bold text-gray-900 mb-6">Editar Partido</h2>

    <div v-if="pending" class="space-y-4">
      <div
        v-for="i in 6"
        :key="i"
        class="h-10 bg-gray-200 animate-pulse rounded-lg"
      />
    </div>
    <form
      v-else-if="game"
      class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4"
      @submit.prevent="submit"
    >
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1"
          >Rival</label
        >
        <input
          :value="game.opponentTeam?.name"
          disabled
          class="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500"
        />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1"
            >Fecha</label
          >
          <input
            v-model="form.date"
            type="date"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1"
            >Hora</label
          >
          <input
            v-model="form.time"
            type="time"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1"
          >Ubicación</label
        >
        <input
          v-model="form.location"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1"
          >Notas</label
        >
        <textarea
          v-model="form.notes"
          rows="2"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <!-- Admin-only: Record Result -->
      <template v-if="authStore.isAdmin">
        <div class="border-t border-gray-100 pt-4">
          <p
            class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3"
          >
            Registrar Resultado
          </p>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1"
                >Goles Ministros</label
              >
              <input
                v-model.number="form.homeTeamScore"
                type="number"
                min="0"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1"
                >Goles Rival</label
              >
              <input
                v-model.number="form.awayTeamScore"
                type="number"
                min="0"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div class="mt-3">
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >Estado</label
            >
            <select
              v-model="form.status"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="SCHEDULED">Programado</option>
              <option value="IN_PROGRESS">En curso</option>
              <option value="COMPLETED">Completado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
        </div>
      </template>
      <p v-else class="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
        Campos de marcador y estado requieren acceso de Administrador.
      </p>

      <p
        v-if="error"
        class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"
      >
        {{ error }}
      </p>
      <div class="flex gap-3 pt-2">
        <button
          type="submit"
          :disabled="loading"
          class="bg-brand text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-60"
        >
          {{ loading ? "Guardando…" : "Guardar Cambios" }}
        </button>
        <NuxtLink
          to="/admin/games"
          class="text-sm text-gray-500 px-5 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50"
          >Cancelar</NuxtLink
        >
      </div>
    </form>
  </div>
</template>
