<script setup lang="ts">
import { nextTick } from "vue";
import type { OpponentTeam, CompetitionType } from "@ministrosfc/shared";
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";
import type { ColumnDef, ColumnSort } from "~/types/table";
import {
  cellActions,
  cellLink,
  cellName,
} from "~/components/ui/Table/table-utils";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Equipos",
});
useHead({ title: "Teams – Admin" });

type OpponentTeamRow = Pick<OpponentTeam, "id" | "name" | "colors">;

const loading = ref(true);
const teamToDelete = ref<any | null>(null);
const deleteModalOpen = ref<boolean>(false);
const deleteInvoker = ref<HTMLElement | null>(null);

const { opponentTeams, fetchOpponentTeams, deleteOpponentTeam } =
  useOpponentTeams();
onMounted(async () => {
  await fetchOpponentTeams();
  loading.value = false;
});

watch(deleteModalOpen, (isOpen) => {
  if (!isOpen && deleteInvoker.value) {
    nextTick(() => deleteInvoker.value?.focus());
  }
});

/**
 * Delete Opposite Team
 */
function askDeleteTeam(team: any, event: Event) {
  teamToDelete.value = team;
  deleteInvoker.value = event.currentTarget as HTMLElement;
  deleteModalOpen.value = true;
}

function getDeleteTeamDescription(team: any | null): string {
  if (!team) return "";
  return `¿Eliminar "${team.name}"? Esta acción fallará si el equipo tiene partidos.`;
}

async function confirmDeleteOpponentTeam() {
  if (!teamToDelete.value) return;
  await deleteOpponentTeam(teamToDelete.value.id);

  deleteModalOpen.value = false;
  teamToDelete.value = null;
  await fetchOpponentTeams();
}

/**
 * Table Data
 */
const columns: ColumnDef<OpponentTeamRow>[] = [
  {
    accessorKey: "id",
  },
  {
    accessorKey: "name",
    header: "Nombre",
    title: "Nombre del equipo",
    sortable: true,
    cell: ({ row }) => {
      const teamId: string = row.getValue("id");
      const value: string = `${row.getValue("name")}`;
      return cellLink(value, `/admin/teams/${teamId}`);
    },
  },
  {
    accessorKey: "colors",
    header: "Colores",
    title: "Colores del equipo",
    sortable: true,
    cell: ({ row }) => {
      const value: string = row.getValue("colors");
      if (!value) return cellName("-");
      return cellName(value);
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
      const teamId: string = row.getValue("id");
      return cellActions({
        items: [
          {
            type: "label",
            label: "Acciones",
          },
          {
            label: "Editar equipo",
            onClick: (event: Event) => navigateTo(`/admin/teams/${teamId}`),
          },
          {
            label: "Borrar equipo",
            onClick: (event: Event) => askDeleteTeam(row.original, event),
          },
        ],
      });
    },
  },
];

const columnVisibility = ref<Partial<Record<keyof OpponentTeamRow, boolean>>>({
  id: false,
});

const columnSorting = ref<ColumnSort<keyof OpponentTeamRow>[]>([
  { id: "name", desc: true },
]);

const tableRows = computed((): OpponentTeamRow[] => {
  return opponentTeams.value.map((t) => ({
    id: t.id,
    name: t.name,
    colors: t.colors,
  }));
});
</script>

<template>
  <div>
    <ConfirmationModal
      :open="deleteModalOpen"
      title="Eliminar equipo"
      :description="getDeleteTeamDescription(teamToDelete)"
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      :on-confirm="confirmDeleteOpponentTeam"
      :on-cancel="
        () => {
          deleteModalOpen.value = false;
          teamToDelete.value = null;
        }
      "
      @update:open="(value) => (deleteModalOpen.value = value)"
    />

    <PageLoading
      v-if="loading"
      :loading="loading"
      :data="opponentTeams"
      loadingMessage="Cargando equipos…"
      emptyMessage="No se encontraron equipos."
    />

    <div v-else class="flex items-center justify-between mb-6">
      <h2 class="text-base font-semibold text-gray-700">Equipos</h2>
      <UButton
        color="primary"
        variant="solid"
        size="md"
        class="font-semibold"
        icon="mdi:shield-plus-outline"
        to="/admin/teams/create"
      >
        Nuevo Equipo
      </UButton>
    </div>

    <!-- UTable -->
    <UTable
      v-if="opponentTeams.length"
      :columns="columns"
      :data="tableRows"
      :column-visibility="columnVisibility"
      :sorting="columnSorting"
    />
    <div v-else class="text-center text-gray-500 py-8">
      No se encontraron equipos
    </div>
  </div>
</template>
