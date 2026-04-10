<script setup lang="ts">
import { useAsyncData, useHead, useNuxtApp, useRouter } from "nuxt/app";
import { computed, reactive, ref } from "vue";
import PlaygroundSelect from "~/components/PlaygroundSelect.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
});
useHead({ title: "Schedule Game – Admin" });

const { $api } = useNuxtApp();
const router = useRouter();

const [{ data: teamsData }, { data: tourData }] = await Promise.all([
  useAsyncData("create-game-teams", () =>
    $api<{ data: any[] }>("/api/v1/teams"),
  ),
  useAsyncData("create-game-tours", () =>
    $api<{ data: any[] }>("/api/v1/tournaments"),
  ),
]);
const teams = computed(() => teamsData.value?.data ?? []);
const tournaments = computed(() => tourData.value?.data ?? []);

const form = reactive({
  opponentTeamId: "",
  date: "",
  time: "",
  playgroundId: null as string | null,
  competitionType: "FRIENDLY",
  tournamentId: "",
});
const loading = ref(false);
const error = ref("");

/**
 * Merges a date picker value (YYYY-MM-DD) and a time picker value (HH:mm)
 * into a full ISO 8601 datetime string with the browser's local UTC offset
 * (e.g. "2026-03-28T14:00:00-03:00"). This format is required by the API's
 * z.string().datetime({ offset: true }) validation. If no time is provided,
 * midnight (00:00) is used as the default.
 */
function buildIsoDateTime(date: string, time: string): string {
  const timeStr = time || "00:00";
  const local = new Date(`${date}T${timeStr}:00`);
  const offsetMin = -local.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const absMin = Math.abs(offsetMin);
  const hh = String(Math.floor(absMin / 60)).padStart(2, "0");
  const mm = String(absMin % 60).padStart(2, "0");
  return `${date}T${timeStr}:00${sign}${hh}:${mm}`;
}

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    const body: Record<string, any> = {
      opponentTeamId: form.opponentTeamId,
      date: buildIsoDateTime(form.date, form.time),
      competitionType: form.competitionType,
      playgroundId: form.playgroundId ?? null,
    };
    if (form.tournamentId) body.tournamentId = form.tournamentId;
    await $api("/api/v1/games", { method: "POST", body });
    await router.push("/admin/games");
  } catch (e: any) {
    error.value = e?.message ?? "Failed to create game.";
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
    <h2 class="text-lg font-bold text-gray-900 mb-6">Programar Partido</h2>
    <form
      class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4"
      @submit.prevent="submit"
    >
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1"
          >Equipo Rival *</label
        >
        <select
          v-model="form.opponentTeamId"
          required
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Seleccionar equipo…</option>
          <option v-for="t in teams" :key="t.id" :value="t.id">
            {{ t.name }}
          </option>
        </select>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1"
            >Fecha *</label
          >
          <input
            v-model="form.date"
            type="date"
            required
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
          >Ubicación (Cancha)</label
        >
        <PlaygroundSelect v-model="form.playgroundId" />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1"
          >Tipo de Partido</label
        >
        <select
          v-model="form.competitionType"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="LEAGUE">Liga</option>
          <option value="CUP">Copa</option>
          <option value="FRIENDLY">Amistoso</option>
          <option value="PLAYOFF">Playoff</option>
          <option value="SEASON">Temporada</option>
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1"
          >Torneo (opcional)</label
        >
        <select
          v-model="form.tournamentId"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Ninguno</option>
          <option v-for="t in tournaments" :key="t.id" :value="t.id">
            {{ t.name }}
          </option>
        </select>
      </div>
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
          {{ loading ? "Creando…" : "Crear Partido" }}
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
