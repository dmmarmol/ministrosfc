<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "auth" });
useHead({ title: "Tournaments – Admin" });

const { $api } = useNuxtApp();
const showCreate = ref(false);
const newT = reactive({
  name: "",
  format: "SEASON",
  startDate: "",
  endDate: "",
});
const createLoading = ref(false);
const createError = ref("");

const { data, pending, refresh } = await useAsyncData("admin-tournaments", () =>
  $api<{ data: any[] }>("/api/v1/tournaments"),
);
const tournaments = computed(() => data.value?.data ?? []);

function formatDateRange(start: string, end: string | null): string {
  const s = new Date(start).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  if (!end) return `Since ${s}`;
  return `${s} – ${new Date(end).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

async function createTournament() {
  if (!newT.name || !newT.startDate) {
    createError.value = "Name and start date are required.";
    return;
  }
  createError.value = "";
  createLoading.value = true;
  try {
    await $api("/api/v1/tournaments", {
      method: "POST",
      body: {
        name: newT.name,
        format: newT.format,
        startDate: newT.startDate,
        endDate: newT.endDate || undefined,
      },
    });
    showCreate.value = false;
    Object.assign(newT, {
      name: "",
      format: "SEASON",
      startDate: "",
      endDate: "",
    });
    await refresh();
  } catch (e: any) {
    createError.value = e?.message ?? "Failed to create tournament.";
  } finally {
    createLoading.value = false;
  }
}

async function deleteTournament(t: any) {
  if (!confirm(`Delete "${t.name}"?`)) return;
  try {
    await $api(`/api/v1/tournaments/${t.id}`, { method: "DELETE" });
    await refresh();
  } catch (e: any) {
    alert(e?.message ?? "Cannot delete: tournament may have associated games.");
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-base font-semibold text-gray-700">Tournaments</h2>
      <button
        class="bg-brand text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90"
        @click="showCreate = true"
      >
        + Add Tournament
      </button>
    </div>

    <!-- Create modal -->
    <div
      v-if="showCreate"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <h3 class="font-bold text-gray-900">Create Tournament</h3>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1"
            >Name *</label
          >
          <input
            v-model="newT.name"
            required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1"
            >Format</label
          >
          <select
            v-model="newT.format"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="LEAGUE">League</option>
            <option value="CUP">Cup</option>
            <option value="SEASON">Season</option>
            <option value="FRIENDLY_SERIES">Friendly Series</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >Start Date *</label
            >
            <input
              v-model="newT.startDate"
              type="date"
              required
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1"
              >End Date</label
            >
            <input
              v-model="newT.endDate"
              type="date"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
        <div class="flex gap-3">
          <button
            :disabled="createLoading"
            class="bg-brand text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-60"
            @click="createTournament"
          >
            {{ createLoading ? "Creating…" : "Create" }}
          </button>
          <button
            class="text-sm text-gray-500"
            @click="
              showCreate = false;
              createError = '';
            "
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div
      class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div v-if="pending" class="p-6 space-y-3">
        <div
          v-for="i in 4"
          :key="i"
          class="h-10 bg-gray-100 animate-pulse rounded"
        />
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th class="px-4 py-3 text-left">Name</th>
            <th class="px-4 py-3 text-left hidden sm:table-cell">Format</th>
            <th class="px-4 py-3 text-left hidden sm:table-cell">Dates</th>
            <th class="px-4 py-3 text-center hidden sm:table-cell">Record</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="t in tournaments"
            :key="t.id"
            class="border-t border-gray-100 hover:bg-gray-50"
          >
            <td class="px-4 py-3 font-medium text-gray-900">{{ t.name }}</td>
            <td class="px-4 py-3 text-gray-600 capitalize hidden sm:table-cell">
              {{ t.format?.replace(/_/g, " ").toLowerCase() }}
            </td>
            <td class="px-4 py-3 text-gray-600 text-xs hidden sm:table-cell">
              {{ formatDateRange(t.startDate, t.endDate) }}
            </td>
            <td class="px-4 py-3 text-center hidden sm:table-cell">
              <span
                v-if="t.ministrosRecord"
                class="text-xs font-medium text-gray-700"
              >
                {{ t.ministrosRecord.wins }}W–{{ t.ministrosRecord.draws }}D–{{
                  t.ministrosRecord.losses
                }}L
              </span>
            </td>
            <td class="px-4 py-3 text-right space-x-3">
              <NuxtLink
                :to="`/tournaments/${t.id}`"
                class="text-xs text-blue-500 hover:underline"
                >View</NuxtLink
              >
              <button
                class="text-xs text-red-400 hover:text-red-600 transition-colors"
                @click="deleteTournament(t)"
              >
                Delete
              </button>
            </td>
          </tr>
          <tr v-if="!tournaments.length">
            <td colspan="5" class="px-4 py-8 text-center text-gray-500">
              No tournaments yet.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
