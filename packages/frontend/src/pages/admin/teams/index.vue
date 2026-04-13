<script setup lang="ts">
import { nextTick } from "vue";
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
});
useHead({ title: "Teams – Admin" });

const { $api } = useNuxtApp();
const showCreate = ref(false);
const newTeam = reactive({ name: "", colors: "" });
const createLoading = ref(false);
const createError = ref("");
const teamToDelete = ref<any | null>(null);
const deleteModalOpen = ref(false);
const deleteInvoker = ref<HTMLElement | null>(null);

const { data, pending, refresh } = await useAsyncData("admin-teams-page", () =>
  $api<{ data: any[] }>("/api/v1/teams"),
);
const teams = computed(() => data.value?.data ?? []);

watch(deleteModalOpen, (isOpen) => {
  if (!isOpen && deleteInvoker.value) {
    nextTick(() => deleteInvoker.value?.focus());
  }
});

async function createTeam() {
  if (!newTeam.name) return;
  createError.value = "";
  createLoading.value = true;
  try {
    await $api("/api/v1/teams", {
      method: "POST",
      body: { name: newTeam.name, colors: newTeam.colors || undefined },
    });
    showCreate.value = false;
    newTeam.name = "";
    newTeam.colors = "";
    await refresh();
  } catch (e: any) {
    createError.value = e?.message ?? "Failed to create team.";
  } finally {
    createLoading.value = false;
  }
}

function askDeleteTeam(team: any, event: Event) {
  teamToDelete.value = team;
  deleteInvoker.value = event.currentTarget as HTMLElement;
  deleteModalOpen.value = true;
}

function getDeleteTeamDescription(team: any | null): string {
  if (!team) return "";
  return `Delete "${team.name}"? This will fail if the team has games.`;
}

async function deleteTeam() {
  if (!teamToDelete.value) return;
  await $api(`/api/v1/teams/${teamToDelete.value.id}`, { method: "DELETE" });
  deleteModalOpen.value = false;
  teamToDelete.value = null;
  await refresh();
}
</script>

<template>
  <div>
    <ConfirmationModal
      :open="deleteModalOpen"
      title="Delete team"
      :description="getDeleteTeamDescription(teamToDelete)"
      confirm-text="Delete"
      cancel-text="Cancel"
      :on-confirm="deleteTeam"
      :on-cancel="
        () => {
          deleteModalOpen = false;
          teamToDelete = null;
        }
      "
      @update:open="(value) => (deleteModalOpen = value)"
    />

    <div class="flex items-center justify-between mb-6">
      <h2 class="text-base font-semibold text-gray-700">Opponent Teams</h2>
      <button
        class="bg-brand text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90"
        @click="showCreate = true"
      >
        + Add Team
      </button>
    </div>

    <!-- Create modal -->
    <div
      v-if="showCreate"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <h3 class="font-bold text-gray-900">Add Team</h3>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1"
            >Team Name *</label
          >
          <input
            v-model="newTeam.name"
            required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="FC Riviera"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1"
            >Colors</label
          >
          <input
            v-model="newTeam.colors"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Red & White"
          />
        </div>
        <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
        <div class="flex gap-3">
          <button
            :disabled="createLoading"
            class="bg-brand text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-60"
            @click="createTeam"
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
          v-for="i in 5"
          :key="i"
          class="h-10 bg-gray-100 animate-pulse rounded"
        />
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th class="px-4 py-3 text-left">Team</th>
            <th class="px-4 py-3 text-left hidden sm:table-cell">Colors</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="t in teams"
            :key="t.id"
            class="border-t border-gray-100 hover:bg-gray-50"
          >
            <td class="px-4 py-3 font-medium text-gray-900">{{ t.name }}</td>
            <td class="px-4 py-3 text-gray-600 hidden sm:table-cell">
              {{ t.colors ?? "—" }}
            </td>
            <td class="px-4 py-3 text-right">
              <button
                class="text-xs text-red-400 hover:text-red-600 transition-colors"
                @click="askDeleteTeam(t, $event)"
              >
                Delete
              </button>
            </td>
          </tr>
          <tr v-if="!teams.length">
            <td colspan="3" class="px-4 py-8 text-center text-gray-500">
              No teams yet.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
