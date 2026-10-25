<script setup lang="ts">
import { h } from "vue";
import {
  type GameParticipant,
  PlayerType,
  type Position,
} from "@ministrosfc/shared";
import type { GameFormData } from "./GameForm.vue";
import type { ColumnDef, ColumnSort } from "../../../../types/table.js";
import {
  cellActions,
  cellButton,
  cellJerseyNumber,
  cellLink,
  cellName,
  cellPosition,
  sortByPositionEnumOrder,
  sortableHeader,
} from "../../../ui/Table/table-utils.js";
import { useAdminGamesStore } from "../../../../stores/admin-games.js";

export type GameParticipantsFormData = Partial<GameFormData>;
type GameParticipantRow = Pick<
  GameParticipant,
  "id" | "goalsScored" | "yellowCards" | "redCards" | "player"
> & {
  jerseyNumber: number | null;
  position: string;
  playerName: string;
  playerNickname: string;
  playerType: PlayerType;
  invitedByName: string;
};

const props = withDefaults(
  defineProps<{
    form: GameParticipantsFormData | null;
    gameId?: string | null;
    loading?: boolean;
    error?: string;
  }>(),
  {
    form: null,
    gameId: null,
    loading: false,
    error: "",
  },
);

const store = useAdminGamesStore();

const columns: ColumnDef<GameParticipantRow>[] = [
  {
    accessorKey: "id",
  },
  {
    id: "actions",
    meta: {
      class: {
        // th: "text-right",
        th: "text-xs",
        // td: "text-right",
      },
    },
    cell: ({ row }) => {
      return cellButton("", {
        size: "sm",
        variant: "ghost",
        color: "neutral",
        icon: "mdi:trash-can-outline",
        title: "Eliminar jugador",
        onClick: (event: Event) => {
          const participantId: string = row.original.id;
          store.askRemoveParticipant(participantId);
        },
      });
    },
  },
  {
    accessorKey: "playerName",
    header: sortableHeader("Jugador"),
    title: "Nombre del jugador",
    enableSorting: true,
    meta: {
      class: {
        th: "text-xs",
      },
    },
    cell: ({ row }) => {
      const playerName: string = row.getValue("playerName") ?? "";
      const invitedByName: string = row.original.invitedByName ?? "";
      const invitedByLabel: string = invitedByName
        ? `Invitado por: ${invitedByName}`
        : "";
      const playerId: string = row.original.player.id;

      return h("div", {}, [
        cellLink(playerName, `/admin/players/${playerId}/edit`),
        h("br"),
        cellName(invitedByLabel, {
          class: "text-xs text-gray-500 text-[10px]",
        }),
      ]);
    },
  },
  {
    accessorKey: "playerNickname",
    header: "Apodo",
    title: "Apodo del jugador",
    enableSorting: true,
    meta: {
      class: {
        th: "text-xs",
      },
    },
    cell: ({ row }) => {
      const playerNickname: string = row.getValue("playerNickname") ?? "";
      return cellName(playerNickname, {
        class: "text-xs text-gray-500 italic",
      });
    },
  },
  {
    accessorKey: "position",
    header: sortableHeader("Posición"),
    title: "Posición",
    enableSorting: true,
    meta: {
      class: {
        th: "text-xs",

        td: "text-center",
      },
    },
    sortingFn: sortByPositionEnumOrder,
    cell: ({ row }) => {
      const position: Position = row.getValue("position");
      return cellPosition(position);
    },
  },
  {
    accessorKey: "goalsScored",
    header: sortableHeader("⚽ Gol"),
    title: "Goles anotados por el jugador",
    enableSorting: true,
    meta: {
      class: {
        th: "text-xs",
        td: "text-center",
      },
    },
    cell: ({ row }) => {
      const value: number = row.getValue("goalsScored");
      return cellName(value.toString());
    },
  },
  {
    accessorKey: "assist",
    header: sortableHeader("🎯 Asist."),
    title: "Asistencias del jugador",
    enableSorting: true,
    meta: {
      class: {
        th: "text-xs",
        td: "text-center",
      },
    },
    cell: ({ row }) => {
      const value: number = row.getValue("assist");
      return cellName(value ? value?.toString() : "-");
    },
  },
  {
    accessorKey: "yellowCards",
    header: sortableHeader("🟨"),
    title: "Tarjetas amarillas recibidas por el jugador",
    enableSorting: true,
    meta: {
      class: {
        th: "text-xs",
        td: "text-center",
      },
    },
    cell: ({ row }) => {
      const value: number = row.getValue("yellowCards");
      return cellName(value.toString());
    },
  },
  {
    accessorKey: "redCards",
    header: sortableHeader("🟥"),
    title: "Tarjetas rojas recibidas por el jugador",
    enableSorting: true,
    meta: {
      class: {
        th: "text-xs",
        td: "text-center",
      },
    },
    cell: ({ row }) => {
      const value: number = row.getValue("redCards");
      return cellName(value.toString());
    },
  },
  {
    accessorKey: "jerseyNumber",
    header: "Dorsal",
    title: "Dorsal",
    enableSorting: true,
    meta: {
      class: {
        td: "text-center flex items-center justify-center",
      },
    },
    cell: ({ row }) => {
      const jerseyNumber: number = row.getValue("jerseyNumber") ?? null;
      const playerType: PlayerType = row.original.playerType;

      return cellJerseyNumber({
        jerseyNumber: jerseyNumber,
        isGuest: playerType === PlayerType.GUEST,
      });
    },
  },
];

const columnVisibility = ref<
  Partial<Record<keyof GameParticipantRow, boolean>>
>({
  id: false,
});

const columnSorting = ref<ColumnSort<keyof GameParticipantRow>[]>([
  { id: "position", desc: false },
]);

const tableRows = computed((): GameParticipantRow[] => {
  return (props.form?.participants ?? []).map((t) => ({
    id: t.id,
    player: t.player,
    goalsScored: t.goalsScored,
    yellowCards: t.yellowCards,
    redCards: t.redCards,
    jerseyNumber: t.player?.jerseyNumber ?? null,
    position: t.player?.position ?? "",
    playerName: `${t.player?.firstName ?? ""} ${t.player?.lastName ?? ""}`,
    playerNickname: t.player?.nickname ?? "",
    playerType: t.player?.playerType ?? PlayerType.GUEST,
    invitedByName: t.player?.invitedByName ?? "",
  }));
});
</script>
<template>
  <div>
    <!-- <div>
      <label class="block text-xs font-medium text-gray-700 mb-1"
        >Fecha <span class="text-red-500">*</span></label
      >
      <UInput v-model="null" type="date" required class="w-full" />
    </div> -->

    <UTable
      :columns="columns"
      :data="tableRows"
      :column-visibility="columnVisibility"
      v-model:sorting="columnSorting"
    />
  </div>
</template>
