<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "auth" });
useHead({ title: "Games – Admin" });

const { $api } = useNuxtApp();
const statusFilter = ref("");
const opponentFilter = ref("");

const { data: teamsData } = await useAsyncData("admin-teams", () =>
  $api<{ data: any[] }>("/api/v1/teams"),
);
const teams = computed(() => teamsData.value?.data ?? []);

const { data, pending, refresh } = await useAsyncData("admin-games", () =>
  $api<{ data: any[] }>("/api/v1/games", {
    query: {
      ...(statusFilter.value ? { status: statusFilter.value } : {}),
      ...(opponentFilter.value ? { opponentTeamId: opponentFilter.value } : {}),
      limit: 100,
    },
  }),
);
watch([statusFilter, opponentFilter], () => refresh());
const games = computed(() => data.value?.data ?? []);

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function statusClass(s: string): string {
  const map: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-gray-100 text-gray-500",
  };
  return map[s] ?? "bg-gray-100 text-gray-500";
}

async function deleteGame(id: string) {
  if (!confirm("¿Eliminar este partido? Esta acción no se puede deshacer."))
    return;
  try {
    await $api(`/api/v1/games/${id}`, { method: "DELETE" });
    await refresh();
  } catch (e: any) {
    alert(e?.message ?? "Failed to delete game.");
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-base font-semibold text-gray-700">Partidos</h2>
      <NuxtLink
        to="/admin/games/create"
        class="bg-brand text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90"
        >+ Programar Partido</NuxtLink
      >
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <select
        v-model="statusFilter"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm"
      >
        <option value="">Todos los estados</option>
        <option value="SCHEDULED">Programado</option>
        <option value="COMPLETED">Completado</option>
        <option value="CANCELLED">Cancelado</option>
      </select>
      <select
        v-model="opponentFilter"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm"
      >
        <option value="">Todos los rivales</option>
        <option v-for="t in teams" :key="t.id" :value="t.id">
          {{ t.name }}
        </option>
      </select>
    </div>

    <!-- Table -->
    <div
      class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div v-if="pending" class="p-6 space-y-3">
        <div
          v-for="i in 8"
          :key="i"
          class="h-10 bg-gray-100 animate-pulse rounded"
        />
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th class="px-4 py-3 text-left">Rival</th>
            <th class="px-4 py-3 text-left hidden sm:table-cell">Fecha</th>
            <th class="px-4 py-3 text-center">Estado</th>
            <th class="px-4 py-3 text-right hidden sm:table-cell">Marcador</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="g in games"
            :key="g.id"
            class="border-t border-gray-100 hover:bg-gray-50"
          >
            <td class="px-4 py-3 font-medium text-gray-900">
              {{ g.opponentTeam?.name ?? "—" }}
            </td>
            <td class="px-4 py-3 text-gray-600 hidden sm:table-cell">
              {{ formatDate(g.date) }}
            </td>
            <td class="px-4 py-3 text-center">
              <span
                :class="statusClass(g.status)"
                class="text-xs px-2 py-0.5 rounded-full font-medium"
                >{{
                  {
                    SCHEDULED: "Programado",
                    COMPLETED: "Completado",
                    CANCELLED: "Cancelado",
                    IN_PROGRESS: "En juego",
                  }[g.status] ?? g.status
                }}</span
              >
            </td>
            <td class="px-4 py-3 text-right text-gray-700 hidden sm:table-cell">
              {{
                g.status === "COMPLETED"
                  ? `${g.homeTeamScore ?? 0}–${g.awayTeamScore ?? 0}`
                  : "—"
              }}
            </td>
            <td class="px-4 py-3 text-right space-x-3">
              <NuxtLink
                :to="`/admin/games/${g.id}/edit`"
                class="text-xs text-brand hover:underline"
                >Editar</NuxtLink
              >
              <button
                class="text-xs text-red-400 hover:text-red-600 transition-colors"
                @click="deleteGame(g.id)"
              >
                Eliminar
              </button>
            </td>
          </tr>
          <tr v-if="!games.length">
            <td colspan="5" class="px-4 py-8 text-center text-gray-500">
              No se encontraron partidos.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
