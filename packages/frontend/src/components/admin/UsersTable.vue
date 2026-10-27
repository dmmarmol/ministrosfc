<script setup lang="ts">
import { h, resolveComponent } from "vue";
import {
  UButton,
  UiPlayerStatusBadge,
  UiRegistrationStatusBadge,
  UiUserRoleSelect,
} from "#components";
import { OPTION_FILTER_ALL, PlayerStatus } from "@ministrosfc/shared";
import {
  RegistrationStatus,
  type AdminUserListItem,
  type UserRole,
} from "@ministrosfc/shared";
import type { ColumnDef } from "~/types/table";
import { cellActions } from "../ui/Table/table-utils";

type Props = {
  users: AdminUserListItem[];
  loading?: boolean;
  currentUserId?: string;
};
const props = defineProps<Props>();

const emit = defineEmits<{
  delete: [user: AdminUserListItem];
  roleChange: [user: AdminUserListItem, newRole: UserRole];
}>();

const columns: ColumnDef<AdminUserListItem>[] = [
  {
    accessorKey: "email",
    header: "Usuario",
    cell: ({ row }) => {
      const email = row.getValue("email") as string;
      const registrationStatus = row.original
        .registrationStatus as RegistrationStatus;
      let to: string = `users/${row.original.id}`;
      if (registrationStatus === RegistrationStatus.PENDING_APPROVAL) {
        to = `/admin/users/pending-approvals`;
      }

      return h(
        UButton,
        {
          to,
          variant: "link",
          color: "primary",
        },
        email,
      );
    },
  },
  {
    accessorKey: "firstName",
    header: "Nombre",
    cell: ({ row }) => {
      const { firstName, lastName } = row.original;
      return h("span", {}, `${firstName} ${lastName}`);
    },
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => {
      const user = row.original;
      const isSelfRoleChange = user.id === props.currentUserId;
      return h(UiUserRoleSelect, {
        modelValue: user.role,
        size: "sm",
        class: "w-32",
        disabled: isSelfRoleChange,
        title: isSelfRoleChange ? "No podés cambiar tu propio rol" : undefined,
        singular: true,
        "onUpdate:modelValue": (
          value: UserRole | typeof OPTION_FILTER_ALL | undefined,
        ) => {
          if (!value || value === user.role) return;
          emit("roleChange", user, value as UserRole);
        },
      });
    },
  },
  {
    accessorKey: "registrationStatus",
    header: "Activación",
    cell: ({ row }) => {
      const registrationStatus = row.getValue(
        "registrationStatus",
      ) as RegistrationStatus;
      if (registrationStatus === RegistrationStatus.PENDING_APPROVAL) {
        return h(
          resolveComponent("NuxtLink"),
          {
            to: "/admin/users/pending-approvals",
            class: "inline-flex",
          },
          {
            default: () =>
              h(UiRegistrationStatusBadge, { status: registrationStatus }),
          },
        );
      }
      return h(UiRegistrationStatusBadge, { status: registrationStatus });
    },
  },
  {
    accessorKey: "playerStatus",
    header: "Estado como jugador",
    cell: ({ row }) => {
      const registrationStatus = row.getValue(
        "registrationStatus",
      ) as RegistrationStatus;
      const playerStatus = row.original.player?.status as
        | PlayerStatus
        | undefined;
      if (registrationStatus === RegistrationStatus.PENDING_APPROVAL) {
        return h("span", {}, "Aun no esta registrado");
      }
      if (!playerStatus) {
        return h("span", { class: "text-xs text-gray-300" }, "—");
      }
      return h(UiPlayerStatusBadge, { status: playerStatus });
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
      return cellActions({
        items: [
          {
            label: "Eliminar usuario",
            onClick: (event: Event) => emit("delete", row.original),
            "data-testid": "delete-user-btn",
          },
        ],
      });
    },
  },
];

const sorting = ref([{ id: "games", desc: true }]);
</script>
<template>
  <UTable
    v-model:sorting="sorting"
    :data="users"
    :columns="columns"
    :loading="loading"
  />
</template>
