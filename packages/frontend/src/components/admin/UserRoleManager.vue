<script setup lang="ts">
import { ref, onMounted } from "vue";
import ConfirmationModal from "../ui/ConfirmationModal.vue";
import RegistrationStatusBadge from "../ui/RegistrationStatusBadge.vue";
import { useAuthStore } from "~/stores/auth";

import {
  type AdminUserListItem,
  type UserRole,
  OPTION_FILTER_ALL,
} from "@ministrosfc/shared";
import UsersTable from "./UsersTable.vue";

const authStore = useAuthStore();

interface EditableUserFields {
  firstName: string;
  lastName: string;
  email: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const { $api } = useNuxtApp();
const toast = useToast();

const users = ref<AdminUserListItem[]>([]);

// --- Shared confirmation-intent state and action descriptors ---
type AdminConfirmationActionType =
  | "change-role"
  | "toggle-status"
  | "delete-user"
  | "delete-player"
  | "edit-email";
interface AdminConfirmationIntent {
  actionType: AdminConfirmationActionType;
  targetUserId: string;
  targetUserLabel: string;
  targetPlayerLabel?: string;
  currentValue?: string;
  nextValue?: string;
  title: string;
  actionDescription: string;
}

const confirmationIntent = ref<AdminConfirmationIntent | null>(null);
const confirmationPending = ref<(() => Promise<void>) | null>(null);
const isConfirmationLoading = ref(false);

function requestConfirmation(
  intent: AdminConfirmationIntent,
  action: () => Promise<void>,
) {
  confirmationIntent.value = intent;
  confirmationPending.value = action;
}

async function executeConfirmation() {
  if (!confirmationPending.value) return;
  isConfirmationLoading.value = true;
  try {
    await confirmationPending.value();
    toast.add({
      description: "Cambio aplicado correctamente.",
      color: "success",
    });
  } catch (e: any) {
    cancelConfirmation();
    const status = e?.response?.status ?? e?.status;
    if (status === 409) {
      toast.add({
        description:
          "Otro administrador modificó este usuario. Recargá e intentá de nuevo.",
        color: "error",
      });
    } else if (status === 403) {
      toast.add({
        description: e?.data?.message ?? "No tenés permisos para esta acción.",
        color: "error",
      });
    } else {
      toast.add({
        description: "Ocurrió un error de red. Intentá de nuevo.",
        color: "error",
      });
    }
    return;
  } finally {
    isConfirmationLoading.value = false;
    confirmationIntent.value = null;
    confirmationPending.value = null;
  }
}

function cancelConfirmation() {
  confirmationIntent.value = null;
  confirmationPending.value = null;
}
const editingUserId = ref<string | null>(null);
const editFields = ref<EditableUserFields>({
  firstName: "",
  lastName: "",
  email: "",
});
function startEdit(user: AdminUserListItem) {
  editingUserId.value = user.id;
  editFields.value = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

async function saveEdit(userId: string) {
  const user = users.value.find((u) => u.id === userId);
  const emailChanged =
    user &&
    editFields.value.email.trim().toLowerCase() !== user.email.toLowerCase();

  if (emailChanged) {
    // Email changes are critical: require confirmation
    const newEmail = editFields.value.email.trim().toLowerCase();
    const fullName = `${user!.firstName} ${user!.lastName}`;
    requestConfirmation(
      {
        actionType: "edit-email",
        targetUserId: userId,
        targetUserLabel: fullName,
        currentValue: user!.email,
        nextValue: newEmail,
        title: "Cambiar email",
        actionDescription: `¿Cambiar el email de ${fullName} de "${user!.email}" a "${newEmail}"? Esto afecta sus credenciales de acceso.`,
      },
      async () => {
        await ($api as any)(`/api/v1/admin/users/${userId}`, {
          method: "PATCH",
          body: { ...editFields.value },
        });
        editingUserId.value = null;
        await fetchUsers();
      },
    );
  } else {
    // Non-critical edits (first/last name): inline save without confirmation
    try {
      await ($api as any)(`/api/v1/admin/users/${userId}`, {
        method: "PATCH",
        body: {
          firstName: editFields.value.firstName,
          lastName: editFields.value.lastName,
        },
      });
      editingUserId.value = null;
      toast.add({ description: "Perfil actualizado.", color: "success" });
      await fetchUsers();
    } catch (e: any) {
      const status = e?.response?.status ?? e?.status;
      if (status === 409) {
        toast.add({
          description: "Conflicto: el usuario fue modificado por otro proceso.",
          color: "error",
        });
      } else {
        toast.add({
          description: e?.data?.message ?? "Error al guardar cambios.",
          color: "error",
        });
      }
    }
  }
}

function cancelEdit() {
  editingUserId.value = null;
}
const meta = ref<Meta | null>(null);
const loading = ref(false);
const error = ref("");
const search = ref("");
const roleFilter = ref<UserRole | typeof OPTION_FILTER_ALL>(OPTION_FILTER_ALL);
const page = ref(1);
const deleteTarget = ref<AdminUserListItem | null>(null);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedFetch() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    page.value = 1;
    fetchUsers();
  }, 300);
}

async function fetchUsers() {
  loading.value = true;
  error.value = "";
  try {
    const params = new URLSearchParams();
    params.set("page", String(page.value));
    params.set("limit", "20");
    if (roleFilter.value) params.set("role", roleFilter.value);
    if (search.value) params.set("search", search.value);

    const res = await ($api as any)(`/api/v1/admin/users?${params.toString()}`);
    users.value = res.data;
    meta.value = res.meta;
  } catch (e: any) {
    error.value = e?.message ?? "Error al cargar usuarios";
  } finally {
    loading.value = false;
  }
}

function requestRoleChange(user: AdminUserListItem, newRole: string) {
  // Idempotent: same role → skip confirmation and do nothing
  if (user.role === newRole) return;
  const fullName = `${user.firstName} ${user.lastName}`;
  const roleLabel: Record<string, string> = {
    ADMIN: "Admin",
    EDITOR: "Editor",
    DT: "DT",
    PLAYER: "Player",
  };
  requestConfirmation(
    {
      actionType: "change-role",
      targetUserId: user.id,
      targetUserLabel: fullName,
      currentValue: user.role,
      nextValue: newRole,
      title: "Cambiar rol",
      actionDescription: `¿Cambiar el rol de ${fullName} de ${roleLabel[user.role] ?? user.role} a ${roleLabel[newRole] ?? newRole}?`,
    },
    async () => {
      await ($api as any)(`/api/v1/admin/users/${user.id}/role`, {
        method: "PATCH",
        body: { role: newRole },
      });
      await fetchUsers();
    },
  );
}

function requestStatusToggle(user: AdminUserListItem) {
  if (!user.player) return;
  const newStatus = user.player.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  const fullName = `${user.firstName} ${user.lastName}`;
  const isDeactivating = newStatus === "INACTIVE";
  requestConfirmation(
    {
      actionType: "toggle-status",
      targetUserId: user.id,
      targetUserLabel: fullName,
      targetPlayerLabel: fullName,
      title: isDeactivating ? "Desactivar jugador" : "Activar jugador",
      actionDescription: isDeactivating
        ? `¿Desactivar a ${fullName}? Esto impedirá que participe en nuevos partidos.`
        : `¿Activar a ${fullName}? Volverá a poder inscribirse en partidos.`,
    },
    async () => {
      await ($api as any)(`/api/v1/admin/users/${user.id}/player-status`, {
        method: "PATCH",
        body: { status: newStatus },
      });
      await fetchUsers();
    },
  );
}

function confirmDelete(user: AdminUserListItem) {
  deleteTarget.value = user;
  const fullName = `${user.firstName} ${user.lastName}`;
  requestConfirmation(
    {
      actionType: "delete-user",
      targetUserId: user.id,
      targetUserLabel: fullName,
      targetPlayerLabel: user.player ? `jugador` : undefined,
      title: "Eliminar usuario y jugador",
      actionDescription: `¿Eliminar a ${fullName} y su perfil de jugador? Esta acción no se puede deshacer.`,
    },
    async () => {
      await ($api as any)(`/api/v1/admin/users/${user.id}/player`, {
        method: "DELETE",
      });
      deleteTarget.value = null;
      await fetchUsers();
    },
  );
}

function goPage(p: number) {
  page.value = p;
  fetchUsers();
}

function roleBadgeClass(role: string) {
  switch (role) {
    case "ADMIN":
      return "bg-red-100 text-red-700";
    case "EDITOR":
      return "bg-blue-100 text-blue-700";
    case "DT":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

onMounted(fetchUsers);
</script>

<template>
  <div>
    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <UInput
        v-model="search"
        type="text"
        placeholder="Buscar por nombre o email…"
        class="flex-1"
        @input="debouncedFetch"
        size="lg"
      />
      <UiUserRoleSelect
        v-model="roleFilter"
        class="w-48"
        size="lg"
        include-all
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-8 text-gray-400">Cargando…</div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-8 text-red-500">
      {{ error }}
    </div>

    <!-- User list -->
    <div v-else class="overflow-x-auto">
      <UsersTable
        :users="users"
        :current-user-id="authStore.user?.id"
        @role-change="requestRoleChange"
      />

      <!-- Pagination -->
      <div
        v-if="meta && meta.totalPages > 1"
        class="flex items-center justify-between mt-4 text-sm text-gray-500"
      >
        <span>{{ meta.total }} usuarios</span>
        <div class="flex gap-2">
          <UButton
            :disabled="page <= 1"
            variant="outline"
            color="neutral"
            @click="goPage(page - 1)"
          >
            ← Anterior
          </UButton>
          <span class="px-2 py-1">{{ page }} / {{ meta.totalPages }}</span>
          <UButton
            :disabled="page >= meta.totalPages"
            variant="outline"
            color="neutral"
            @click="goPage(page + 1)"
          >
            Siguiente →
          </UButton>
        </div>
      </div>
    </div>

    <!-- Unified confirmation modal for all sensitive actions -->
    <ConfirmationModal
      v-if="confirmationIntent !== null"
      :open="confirmationIntent !== null"
      :title="confirmationIntent?.title ?? 'Confirmar acción'"
      :description="confirmationIntent?.actionDescription"
      confirm-text="Confirmar"
      cancel-text="Cancelar"
      :onConfirm="executeConfirmation"
      :onCancel="cancelConfirmation"
      @update:open="
        (v) => {
          if (!v) cancelConfirmation();
        }
      "
    />
  </div>
</template>
