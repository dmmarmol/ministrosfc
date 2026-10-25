<script setup lang="ts">
import {
  PlayerType,
  type GameParticipant,
  type Player,
} from "@ministrosfc/shared";
import type { ColumnDef, ColumnSort } from "../../../types/table";
import {
  cellButton,
  cellJerseyNumber,
  cellLink,
  cellName,
  cellPosition,
  sortableHeader,
  sortByPositionEnumOrder,
} from "../../ui/Table/table-utils";
import type { Position } from "postcss";

/** Do not export this one to avoid conflicts with GameParticipantRow from admin */
type PublicGameParticipantRow = {
  id: string;
  player: GameParticipant["player"];
  goalsScored: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  jerseyNumber: number | null;
  position: string;
  playerName: string;
  playerNickname: string;
  playerType: PlayerType;
  invitedByName: string;
};

const props = withDefaults(
  defineProps<{
    participants: GameParticipant[];
  }>(),
  {
    participants: () => [],
  },
);

const store = useAdminGamesStore();
const authStore = useAuthStore();

const columns: ColumnDef<PublicGameParticipantRow>[] = [
  {
    accessorKey: "id",
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
      const playerType: PlayerType = row.original.player.playerType;

      return cellJerseyNumber({
        jerseyNumber: jerseyNumber,
        isGuest: playerType === PlayerType.GUEST,
      });
    },
  },
  {
    accessorKey: "registered",
    header: "",
    cell: ({ row }) => {
      const playerType = row.original.player?.playerType;
      console.log({ playerType });
      return h(
        "span",
        {
          class: [
            "text-xs px-2 py-0.5 rounded-full flex-shrink-0",
            playerType === PlayerType.GUEST
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700",
          ],
        },
        playerType === PlayerType.GUEST ? "Inv." : "Reg.",
      );
    },
  },
  {
    accessorKey: "position",
    header: sortableHeader("Posición"),
    title: "Posición",
    enableSorting: true,
    meta: {
      class: {
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
    accessorKey: "playerName",
    header: "Jugador",
    title: "Nombre del jugador",
    enableSorting: true,
    meta: {
      class: {},
    },
    cell: ({ row }) => {
      const playerName: string = row.getValue("playerName") ?? "";
      const invitedByName: string = row.original.invitedByName ?? "";
      const invitedByLabel: string = invitedByName
        ? `Invitado por: ${invitedByName}`
        : "";
      const playerId: string = row.original.player.id;

      return cellLink(playerName, `/admin/players/${playerId}/edit`);
      //   return h("div", {}, [
      //     h("br"),
      //     cellName(invitedByLabel, {
      //       class: "text-xs text-gray-500 text-[10px]",
      //     }),
      //   ]);
    },
  },
  {
    accessorKey: "playerNickname",
    header: "Apodo",
    title: "Apodo del jugador",
    enableSorting: true,
    meta: {
      class: {},
    },
    cell: ({ row }) => {
      const playerNickname: string = row.getValue("playerNickname") ?? "";
      return cellName(playerNickname, {
        class: "text-xs text-gray-500 italic",
      });
    },
  },
  {
    accessorKey: "goalsScored",
    header: sortableHeader("⚽ Gol"),
    title: "Goles anotados por el jugador",
    enableSorting: true,
    meta: {
      class: {
        td: "text-center",
      },
    },
    cell: ({ row }) => {
      const value: number = row.getValue("goalsScored");
      const children =
        Number(value) > 0 ? Array(Number(value)).fill("⚽") : [""];
      return cellName(children.join(""));
    },
  },
  {
    accessorKey: "assists",
    header: sortableHeader("🎯 Asist."),
    title: "Asistencias del jugador",
    enableSorting: true,
    meta: {
      class: {
        td: "text-center",
      },
    },
    cell: ({ row }) => {
      const value: number = row.getValue("assists");
      const children =
        Number(value) > 0 ? Array(Number(value)).fill("🎯") : [""];
      return cellName(children.join(""));
    },
  },
  {
    accessorKey: "yellowCards",
    header: sortableHeader("🟨"),
    title: "Tarjetas amarillas recibidas por el jugador",
    enableSorting: true,
    meta: {
      class: {
        td: "text-center",
      },
    },
    cell: ({ row }) => {
      const value: number = row.getValue("yellowCards");
      const children = Number(value) > 0 ? Array(Number(value)).fill("🟨") : [];
      return cellName(children.join(""));
    },
  },
  {
    accessorKey: "redCards",
    header: sortableHeader("🟥"),
    title: "Tarjetas rojas recibidas por el jugador",
    enableSorting: true,
    meta: {
      class: {
        td: "text-center",
      },
    },
    cell: ({ row }) => {
      const value: number = row.getValue("redCards");
      const children = Number(value) > 0 ? Array(Number(value)).fill("🟥") : [];
      return cellName(children.join(""));
    },
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
];

const columnVisibility = ref<
  Partial<Record<keyof PublicGameParticipantRow & "actions", boolean>>
>({
  id: false,
  // Not yet implemented
  actions: false, // authStore.isAuthenticated,
});

const columnSorting = ref<ColumnSort<keyof PublicGameParticipantRow>[]>([
  { id: "position", desc: false },
]);

const tableRows = computed((): PublicGameParticipantRow[] => {
  return (props.participants ?? []).map((t) => ({
    id: t.id,
    player: t.player,
    goalsScored: t.goalsScored,
    assists: t.assists,
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
  <div class="bg-white rounded-xl shadow-sm border border-gray-100">
    <UTable
      :columns="columns"
      :data="tableRows"
      :column-visibility="columnVisibility"
      v-model:sorting="columnSorting"
    />
  </div>
</template>
