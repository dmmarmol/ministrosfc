<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import { useAuthStore } from "~/stores/auth";
import { usePlaygrounds } from "~/composables/usePlaygrounds";
import PlaygroundMap from "~/components/PlaygroundMap.vue";
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";
import type { Playground } from "@ministrosfc/shared";
import type { ColumnDef, ColumnPin, ColumnSort } from "~/types/table";
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
  noPadding: true,
});
useHead({ title: "Canchas – Admin" });

type PlaygroundRow = Pick<
  Playground,
  "id" | "name" | "address" | "gameCount"
> & { actions: boolean | null };

const authStore = useAuthStore();
const { playgrounds, loading, fetchPlaygrounds, deletePlayground } =
  usePlaygrounds();

const mapRef = ref<InstanceType<typeof PlaygroundMap> | null>(null);
const highlightedId = ref<string | null>(null);
const playgroundToDelete = ref<PlaygroundRow | null>(null);
const deleteModalOpen = ref(false);
const deleteInvoker = ref<HTMLElement | null>(null);

onMounted(() => {
  fetchPlaygrounds();
});

function onRowClick(pg: Playground) {
  mapRef.value?.centerOn(pg.id);
  highlightedId.value = pg.id;
}

function onPinClick(id: string) {
  highlightedId.value = id;
}

watch(deleteModalOpen, (isOpen) => {
  if (!isOpen && deleteInvoker.value) {
    nextTick(() => deleteInvoker.value?.focus());
  }
});

function askDeletePlayground(playgroundRow: PlaygroundRow, event: Event) {
  playgroundToDelete.value = playgroundRow;
  deleteInvoker.value = event.currentTarget as HTMLElement;
  deleteModalOpen.value = true;
}

function onCancelDelete() {
  deleteModalOpen.value = false;
  playgroundToDelete.value = null;
}

async function confirmDeletePlayground() {
  if (!playgroundToDelete.value) return;
  await deletePlayground(playgroundToDelete.value.id);
  deleteModalOpen.value = false;
  playgroundToDelete.value = null;
}

function getDeletePlaygroundDescription(
  playgroundRow: PlaygroundRow | null,
): string {
  if (!playgroundRow) return "";
  if (playgroundRow.gameCount > 0) {
    return `La cancha \'${playgroundRow.name}\' está en uso por ${playgroundRow.gameCount} partido(s). No se puede eliminar hasta que se reasignen o eliminen esos partidos.`;
  }
  return `¿Eliminar la cancha \'${playgroundToDelete.name}\'? Esta acción no se puede deshacer.`;
}

/* Table Data */
const columns: ColumnDef<PlaygroundRow>[] = [
  {
    accessorKey: "id",
  },
  {
    accessorKey: "name",
    header: "Nombre",
    title: "Nombre de la cancha",
    sortable: true,
    cell: ({ row }) => {
      const playgroundId: string = row.getValue("id");
      const value: string = `${row.getValue("name")}`;
      return cellLink(value, `/admin/playgrounds/${playgroundId}`);
    },
  },
  {
    accessorKey: "address",
    header: "Dirección",
    title: "Dirección de la cancha",
    sortable: true,
    cell: ({ row }) => {
      const value: string = row.getValue("address");
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
      const playgroundId: string = row.getValue("id");
      return cellActions({
        items: [
          {
            type: "label",
            label: "Acciones",
          },
          {
            label: "Editar cancha",
            onClick: (event: Event) =>
              navigateTo(`/admin/playgrounds/${playgroundId}`),
          },
          {
            label: "Borrar cancha",
            onClick: (event: Event) => askDeletePlayground(row.original, event),
          },
        ],
      });
    },
  },
];

const columnVisibility = ref<Partial<Record<keyof PlaygroundRow, boolean>>>({
  id: false,
  address: true,
  gameCount: true,
  actions: authStore.isAdmin,
});

const columnSorting = ref<ColumnSort<keyof PlaygroundRow>[]>([
  { id: "name", desc: true },
]);

const columnPinning = ref<ColumnPin<(keyof PlaygroundRow)[]>>({
  left: ["name"],
});

const tableRows = computed((): PlaygroundRow[] => {
  return playgrounds.value.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    gameCount: p.gameCount,
    actions: null,
  }));
});
</script>

<template>
  <div class="flex flex-col h-full">
    <ConfirmationModal
      :description="getDeletePlaygroundDescription(playgroundToDelete)"
      :open="deleteModalOpen"
      title="Eliminar cancha"
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      :on-confirm="confirmDeletePlayground"
      :on-cancel="onCancelDelete"
      @update:open="(value) => (deleteModalOpen = value)"
    />

    <header
      class="flex items-center justify-between p-6 shadow-md bg-gray-100 z-50 relative"
    >
      <h2 class="text-base font-semibold text-gray-700">Canchas</h2>
      <UButton
        color="primary"
        variant="solid"
        size="md"
        class="font-semibold"
        to="/admin/playgrounds/create"
      >
        Nueva cancha
      </UButton>
    </header>

    <div class="h-full relative flex items-stretch">
      <div v-if="loading" class="text-sm text-gray-500">Cargando canchas…</div>
      <div v-else class="lg:absolute lg:left-0 lg:top-0 lg:p-4 z-50">
        <div class="w-3/4 max-w-[50%] bg-white rounded shadow-md">
          <!-- UTable -->
          <UTable
            :columns="columns"
            :data="tableRows"
            :column-visibility="columnVisibility"
            :column-pinning="columnPinning"
            :sorting="columnSorting"
          />
        </div>
      </div>

      <!-- Map -->
      <div class="hidden lg:flex lg:grow w-full h-full relative z-0">
        <PlaygroundMap
          ref="mapRef"
          :playgrounds="playgrounds"
          class="h-[500px]"
          @pin-click="onPinClick"
        />
      </div>
    </div>
  </div>
</template>
