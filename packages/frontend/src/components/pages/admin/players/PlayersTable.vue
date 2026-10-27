<script setup lang="ts">
import { h, resolveComponent } from "vue";
import { type Player, PlayerStatus } from "@ministrosfc/shared";
import type { ColumnDef } from "~/types/table";
import { useAuthStore } from "~/stores/auth";
import {
  cellButton,
  cellJerseyNumber,
  cellLink,
  cellName,
  cellPosition,
} from "../../../ui/Table/table-utils";

export type ExtendAdminPlayerAttr = {
  invitedById?: string | null;
  invitedByName?: string | null;
};
export type AdminPlayer = Player & ExtendAdminPlayerAttr;

const props = defineProps<{
  players: AdminPlayer[];
  loading: boolean;
}>();

const emit = defineEmits<{
  toggleStatus: [player: AdminPlayer, event: Event];
  delete: [player: AdminPlayer];
}>();

const authStore = useAuthStore();

const classesToHideColumnsInSmallScreens = {
  th: "hidden xl:table-cell",
  td: "hidden xl:table-cell",
};

const columns: ColumnDef<AdminPlayer>[] = [
  {
    accessorKey: "position",
    header: "Pos",
    meta: {
      class: {
        th: "w-16 text-center",
      },
    },
    cell: ({ row }) => cellPosition(row.getValue("position")),
  },
  {
    id: "photo",
    header: "📷",
    meta: {
      class: {
        ...classesToHideColumnsInSmallScreens,
        th: `${classesToHideColumnsInSmallScreens.th} text-center w-12`,
      },
    },
    cell: ({ row }) => {
      const p = row.original;
      return h(
        "div",
        {
          class:
            "w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0",
        },
        [
          p.photoUrl
            ? h("img", {
                src: p.photoUrl,
                alt: `${p.firstName} ${p.lastName}`,
                class: "w-full h-full object-cover",
              })
            : h(
                "span",
                {
                  class:
                    "w-full h-full flex items-center justify-center text-xs text-gray-400",
                },
                "👤",
              ),
        ],
      );
    },
  },
  {
    id: "name",
    header: "Jugador",
    cell: ({ row }) => {
      const p = row.original;
      return h("div", { class: "min-w-0" }, [
        cellButton(`${p.firstName} ${p.lastName}`, {
          to: `/admin/players/${p.id}/edit`,
          class: "truncate",
          variant: "link",
          color: "neutral",
        }),
        p.nickname
          ? cellName(p.nickname, {
              class: "text-sm text-gray-400 hidden md:inline",
            })
          : null,
        p.playerType === "GUEST"
          ? cellName("Invitado", {
              class:
                "text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full ml-1",
            })
          : null,
      ]);
    },
  },
  {
    id: "invitedBy",
    header: "Invitado por",
    meta: {
      class: classesToHideColumnsInSmallScreens,
    },
    cell: ({ row }) => {
      const p = row.original;
      if (!p.invitedById) return null;
      if (p.invitedByName) {
        return cellLink(
          p.invitedByName,
          `/admin/players/${p.invitedById}/edit`,
        );
      }
      return cellName("Invitante eliminado", {
        class: "text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full",
      });
    },
  },
  {
    accessorKey: "jerseyNumber",
    header: "Dorsal",
    meta: {
      class: classesToHideColumnsInSmallScreens,
    },
    cell: ({ row }) => {
      const p = row.original;
      return cellJerseyNumber({
        jerseyNumber: p.jerseyNumber ?? null,
        isGuest: p.playerType === "GUEST",
      });
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const p = row.original;
      return h(
        resolveComponent("UButton"),
        {
          variant: "soft",
          color: p.status === PlayerStatus.ACTIVE ? "success" : "neutral",
          size: "xs",
          class: "font-medium",
          title:
            p.status === PlayerStatus.ACTIVE
              ? "Presiona para desactivar jugador"
              : "Presiona para activar jugador",
          onClick: (event: Event) => emit("toggleStatus", p, event),
        },
        () => (p.status === PlayerStatus.ACTIVE ? "Activo" : "Inactivo"),
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const p = row.original;
      if (!authStore.isAdmin) return null;
      return cellButton("Eliminar", {
        "data-testid": "delete-player-btn",
        size: "xs",
        variant: "ghost",
        color: "error",
        icon: "mdi:trash-can-outline",
        title: "Eliminar jugador",
        onClick: () => emit("delete", p),
      });
    },
  },
];
</script>

<template>
  <div
    class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
  >
    <div v-if="loading" class="p-6 space-y-3">
      <div
        v-for="i in 8"
        :key="i"
        class="h-10 bg-gray-100 animate-pulse rounded"
      />
    </div>
    <UTable v-else :data="players" :columns="columns">
      <template #empty>
        <div class="px-2 py-8 text-center text-gray-500">
          No se encontraron jugadores.
        </div>
      </template>
    </UTable>
  </div>
</template>
