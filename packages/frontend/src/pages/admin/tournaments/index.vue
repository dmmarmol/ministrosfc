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
import TournamentCompetitionType from "~/components/ui/TournamentCompetitionType.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Torneos",
});
useHead({ title: "Tournaments – Admin" });

type TournamentRow = Pick<
  Tournament,
  "id" | "name" | "startDate" | "endDate" | "competitionType"
>;

const { tournaments, fetchTournaments, deleteTournament } = useTournaments();
const tournamentToDelete = ref<TournamentRow | null>(null);
const deleteModalOpen = ref(false);
const deleteInvoker = ref<HTMLElement | null>(null);

watch(deleteModalOpen, (isOpen) => {
  if (!isOpen && deleteInvoker.value) {
    nextTick(() => deleteInvoker.value?.focus());
  }
});

onMounted(async () => {
  await fetchTournaments();
});

/**
 * Delete Tournament
 */
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

async function confirmDeleteTournament() {
  if (!tournamentToDelete.value) return;
  await deleteTournament(tournamentToDelete.value.id);

  deleteModalOpen.value = false;
  tournamentToDelete.value = null;
  await fetchTournaments();
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
    accessorKey: "competitionType",
    header: "Tipo de competición",
    title: "Tipo de competición del torneo",
    sortable: true,
    cell: ({ row }) => {
      const value: CompetitionType = row.getValue("competitionType");
      return h(TournamentCompetitionType, { type: value });
    },
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
            label: "Editar torneo",
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
      :on-confirm="confirmDeleteTournament"
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
        icon="mdi:trophy"
        to="/admin/tournaments/create"
      >
        Nuevo torneo
      </UButton>
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
