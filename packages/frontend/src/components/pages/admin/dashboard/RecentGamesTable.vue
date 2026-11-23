<script setup lang="ts">
import { useRouter } from "vue-router";
import {
  GameStatus,
  competitionTypeLabels,
  formatDate,
  type AdminGame,
} from "@ministrosfc/shared";
import type { ColumnDef } from "~/types/table";
import { cellActions } from "~/components/ui/Table/table-utils";

const props = defineProps<{
  games: AdminGame[];
}>();

const router = useRouter();

function getParticipants(game: AdminGame): string {
  const names = game.participants
    .map(({ player }) =>
      `${player.firstName} ${player.lastName}`.trim(),
    )
    .filter(Boolean);
  return names.length ? names.join(", ") : "—";
}

function getStatusLabel(status: GameStatus | string): string {
  const labels: Partial<Record<GameStatus, string>> = {
    [GameStatus.SCHEDULED]: "Programado",
    [GameStatus.IN_PROGRESS]: "En juego",
    [GameStatus.COMPLETED]: "Completado",
    [GameStatus.CANCELLED]: "Cancelado",
  };
  return labels[status as GameStatus] ?? "Sin estado";
}

const columns: ColumnDef<AdminGame>[] = [
  {
    accessorKey: "date",
    header: "Fecha",
    cell: ({ row }) =>
      formatDate(row.original.date, {
        dateStyle: "short",
        timeStyle: "short",
      }),
  },
  {
    id: "participants",
    header: "Participantes",
    cell: ({ row }) => getParticipants(row.original),
  },
  {
    id: "competition",
    header: "Competición",
    cell: ({ row }) =>
      competitionTypeLabels[row.original.competitionType] ?? "Sin tipo",
  },
  {
    id: "status",
    header: "Estado",
    cell: ({ row }) => getStatusLabel(row.original.status),
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) =>
      cellActions({
        items: [
          {
            label: "Editar partido",
            onClick: () => router.push(`/admin/games/${row.original.id}`),
          },
        ],
      }),
  },
];
</script>

<template>
  <div v-if="props.games.length" class="overflow-x-auto">
    <UTable :columns="columns" :data="props.games" />
  </div>
  <p v-else class="text-sm text-gray-500">No hay partidos recientes.</p>
</template>
