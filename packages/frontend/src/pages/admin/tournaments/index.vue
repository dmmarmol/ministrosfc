<script setup lang="ts">
import { nextTick } from "vue";
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";
import type { ColumnDef, ColumnSort } from "~/types/table";
import { CompetitionType, type Tournament } from "@ministrosfc/shared";
import { formatDateRange } from "~/utils/stats";
import {
  cellActions,
  cellLink,
  cellName,
} from "~/components/ui/Table/table-utils";

type TournamentRow = Pick<
  Tournament,
  "id" | "name" | "startDate" | "endDate" | "competitionType"
>;

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Torneos",
});
useHead({ title: "Tournaments – Admin" });

const { $api } = useNuxtApp();
const showCreate = ref(false);
const newT = reactive({
  name: "",
  format: CompetitionType.SEASON,
  startDate: "",
  endDate: "",
});
const createLoading = ref(false);
const createError = ref("");
const tournamentToDelete = ref<TournamentRow | null>(null);
const deleteModalOpen = ref(false);
const deleteInvoker = ref<HTMLElement | null>(null);

const { data, pending, refresh } = await useAsyncData("admin-tournaments", () =>
  $api<{ data: any[] }>("/api/v1/tournaments"),
);
const tournaments = computed<Tournament[]>(() => data.value?.data ?? []);

watch(deleteModalOpen, (isOpen) => {
  if (!isOpen && deleteInvoker.value) {
    nextTick(() => deleteInvoker.value?.focus());
  }
});

function handleShowCreateModal(visibility: boolean): undefined {
  showCreate.value = visibility;
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
    createError.value = e?.message ?? "No se pudo crear el torneo.";
  } finally {
    createLoading.value = false;
  }
}

function askDeleteTournament(tournamentRow: TournamentRow, event: Event) {
  tournamentToDelete.value = tournamentRow;
  deleteInvoker.value = event.currentTarget as HTMLElement;
  deleteModalOpen.value = true;
}

function getDeleteTournamentDescription(
  tournamentRow: TournamentRow | null,
): string {
  if (!tournamentRow) return "";
  return `¿Eliminar "${tournamentRow.name}"?`;
}

async function deleteTournament() {
  if (!tournamentToDelete.value) return;
  await $api(`/api/v1/tournaments/${tournamentToDelete.value.id}`, {
    method: "DELETE",
  });
  deleteModalOpen.value = false;
  tournamentToDelete.value = null;
  await refresh();
}

const columns: ColumnDef<TournamentRow>[] = [
  {
    accessorKey: "id",
  },
  {
    accessorKey: "name",
    header: "Nombre",
    title: "Nombre del torneo",
    sortable: true,
    cell: ({ row }) => {
      const tournamentId: string = row.getValue("id");
      const value: string = `${row.getValue("name")}`;
      return cellLink(value, `/admin/tournaments/${tournamentId}`);
    },
  },
  {
    accessorKey: "startDate",
    header: "Fecha",
    title: "Duracion del torneo",
    sortable: true,
    cell: ({ row }) => {
      const startDate: string = row.getValue("startDate");
      const endDate: string = row.getValue("endDate");
      const value = formatDateRange(startDate, endDate);
      return cellName(value);
    },
  },
  {
    accessorKey: "endDate",
  },
  {
    id: "actions",
    header: "Acciones",
    meta: {
      class: {
        th: "text-right",
        td: "text-right",
      },
    },
    cell: ({ row }) => {
      const tournamentId: string = row.getValue("id");
      return cellActions({
        items: [
          {
            type: "label",
            label: "Acciones",
          },
          {
            label: "Ver torneo",
            onClick: (event: Event) =>
              navigateTo(`/admin/tournaments/${tournamentId}`),
          },
          {
            label: "Borrar torneo",
            onClick: (event: Event) => askDeleteTournament(row.original, event),
          },
        ],
      });
    },
  },
];

const columnVisibility = ref<Partial<Record<keyof TournamentRow, boolean>>>({
  id: false,
  endDate: false,
});

const columnSorting = ref<ColumnSort<keyof TournamentRow>[]>([
  { id: "startDate", desc: true },
]);

const tableRows = computed((): TournamentRow[] => {
  return tournaments.value.map((t) => ({
    id: t.id,
    name: t.name,
    startDate: t.startDate,
    endDate: t.endDate,
    competitionType: t.competitionType,
  }));
});
</script>

<template>
  <div>
    <ConfirmationModal
      :open="deleteModalOpen"
      title="Eliminar torneo"
      :description="getDeleteTournamentDescription(tournamentToDelete)"
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      :on-confirm="deleteTournament"
      :on-cancel="
        () => {
          deleteModalOpen = false;
          tournamentToDelete = null;
        }
      "
      @update:open="(value) => (deleteModalOpen = value)"
    />

    <div class="flex items-center justify-between mb-6">
      <h2 class="text-base font-semibold text-gray-700">Torneos</h2>
      <UButton
        color="primary"
        variant="solid"
        size="md"
        class="font-semibold"
        @click="handleShowCreateModal"
      >
        + Nuevo torneo
      </UButton>
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
          <UButton
            :disabled="createLoading"
            color="primary"
            variant="solid"
            size="md"
            class="font-semibold"
            @click="createTournament"
          >
            {{ createLoading ? "Creating…" : "Create" }}
          </UButton>
          <UButton
            variant="ghost"
            color="gray"
            size="md"
            @click="
              showCreate = false;
              createError = '';
            "
          >
            Cancel
          </UButton>
        </div>
      </div>
    </div>

    <!-- UTable -->
    <UTable
      :columns="columns"
      :data="tableRows"
      :column-visibility="columnVisibility"
      :sorting="columnSorting"
    />
  </div>
</template>
