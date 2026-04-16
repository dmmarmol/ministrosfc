<script setup lang="ts">
import { ref, onMounted } from "vue";
import ConfirmationModal from "../ui/ConfirmationModal.vue";
import { useAuthStore } from "~/stores/auth";

import type { AdminUserListItem } from "@ministrosfc/shared/src/types/api";

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

// --- Toast feedback ---
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg;
  toastType.value = type;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = "";
  }, 3000);
}

async function executeConfirmation() {
  if (!confirmationPending.value) return;
  isConfirmationLoading.value = true;
  try {
    await confirmationPending.value();
    showToast("Cambio aplicado correctamente.");
  } catch (e: any) {
    cancelConfirmation();
    const status = e?.response?.status ?? e?.status;
    if (status === 409) {
      showToast(
        "Otro administrador modificó este usuario. Recargá e intentá de nuevo.",
        "error",
      );
    } else if (status === 403) {
      showToast(
        e?.data?.message ?? "No tenés permisos para esta acción.",
        "error",
      );
    } else {
      showToast("Ocurrió un error de red. Intentá de nuevo.", "error");
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
      showToast("Perfil actualizado.");
      await fetchUsers();
    } catch (e: any) {
      const status = e?.response?.status ?? e?.status;
      if (status === 409) {
        showToast(
          "Conflicto: el usuario fue modificado por otro proceso.",
          "error",
        );
      } else {
        showToast(e?.data?.message ?? "Error al guardar cambios.", "error");
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
const roleFilter = ref("");
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
      <input
        v-model="search"
        type="text"
        placeholder="Buscar por nombre o email…"
        class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        @input="debouncedFetch"
      />
      <select
        v-model="roleFilter"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        @change="fetchUsers"
      >
        <option value="">Todos los roles</option>
        <option value="ADMIN">Admin</option>
        <option value="EDITOR">Editor</option>
        <option value="DT">DT</option>
        <option value="PLAYER">Player</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-8 text-gray-400">Cargando…</div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-8 text-red-500">
      {{ error }}
    </div>

    <!-- User list -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th class="px-4 py-3 text-left">Usuario</th>
            <th class="px-4 py-3 text-left">Rol</th>
            <th class="px-4 py-3 text-left">Estado jugador</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="user in users" :key="user.id">
            <td class="px-4 py-3">
              <div v-if="editingUserId === user.id">
                <input
                  v-model="editFields.firstName"
                  class="border rounded px-1 py-0.5 text-xs w-20 mr-1"
                />
                <input
                  v-model="editFields.lastName"
                  class="border rounded px-1 py-0.5 text-xs w-20 mr-1"
                />
                <input
                  v-model="editFields.email"
                  class="border rounded px-1 py-0.5 text-xs w-36"
                />
                <button
                  class="ml-2 text-xs px-2 py-1 rounded bg-green-100 text-green-700"
                  @click="saveEdit(user.id)"
                >
                  Guardar
                </button>
                <button
                  class="ml-1 text-xs px-2 py-1 rounded bg-gray-100 text-gray-600"
                  @click="cancelEdit"
                >
                  Cancelar
                </button>
              </div>
              <div v-else>
                <span
                  class="font-medium text-gray-900 cursor-pointer underline decoration-dotted"
                  @click="startEdit(user)"
                >
                  {{ user.firstName }} {{ user.lastName }}
                </span>
                <div class="text-xs text-gray-400">{{ user.email }}</div>
              </div>
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                :class="roleBadgeClass(user.role)"
              >
                {{ user.role }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                v-if="user.player"
                class="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                :class="
                  user.player.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                "
              >
                {{ user.player.status === "ACTIVE" ? "Activo" : "Inactivo" }}
              </span>
              <span v-else class="text-xs text-gray-300">—</span>
            </td>
            <td class="px-4 py-3 text-right space-x-2">
              <!-- Role change: visible for all users, disabled for current user -->
              <select
                class="border border-gray-300 rounded px-2 py-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                :class="{
                  'opacity-40 cursor-not-allowed':
                    user.id === authStore.user?.id,
                }"
                :value="user.role"
                :disabled="user.id === authStore.user?.id"
                :title="
                  user.id === authStore.user?.id
                    ? 'No podés cambiar tu propio rol'
                    : undefined
                "
                @change="
                  requestRoleChange(
                    user,
                    ($event.target as HTMLSelectElement).value,
                  )
                "
              >
                <option value="PLAYER">Player</option>
                <option value="DT">DT</option>
                <option value="EDITOR">Editor</option>
                <option value="ADMIN">Admin</option>
              </select>

              <!-- Toggle player status -->
              <button
                v-if="user.player"
                class="text-xs px-2 py-1 rounded border"
                :class="
                  user.player.status === 'ACTIVE'
                    ? 'border-orange-300 text-orange-600 hover:bg-orange-50'
                    : 'border-green-300 text-green-600 hover:bg-green-50'
                "
                @click="requestStatusToggle(user)"
              >
                {{ user.player.status === "ACTIVE" ? "Desactivar" : "Activar" }}
              </button>

              <!-- Delete player -->
              <button
                v-if="user.player"
                class="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
                @click="confirmDelete(user)"
              >
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div
        v-if="meta && meta.totalPages > 1"
        class="flex items-center justify-between mt-4 text-sm text-gray-500"
      >
        <span>{{ meta.total }} usuarios</span>
        <div class="flex gap-2">
          <button
            :disabled="page <= 1"
            class="px-3 py-1 border rounded disabled:opacity-40"
            @click="goPage(page - 1)"
          >
            ← Anterior
          </button>
          <span class="px-2 py-1">{{ page }} / {{ meta.totalPages }}</span>
          <button
            :disabled="page >= meta.totalPages"
            class="px-3 py-1 border rounded disabled:opacity-40"
            @click="goPage(page + 1)"
          >
            Siguiente →
          </button>
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

    <!-- Toast feedback -->
    <transition name="fade">
      <div
        v-if="toastMessage"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 text-sm px-4 py-2 rounded-lg shadow-lg z-50"
        :class="
          toastType === 'error'
            ? 'bg-red-600 text-white'
            : 'bg-gray-900 text-white'
        "
      >
        {{ toastMessage }}
      </div>
    </transition>
  </div>
</template>
