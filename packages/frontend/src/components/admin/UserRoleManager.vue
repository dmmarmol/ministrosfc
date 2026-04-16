<script setup lang="ts">
import { ref, onMounted } from "vue";
import ConfirmationModal from "../ui/ConfirmationModal.vue";

import type { AdminUserListItem } from "@ministrosfc/shared/src/types/api";

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
type AdminConfirmationActionType = 'change-role' | 'toggle-status' | 'delete-user-player';
interface AdminConfirmationIntent {
  actionType: AdminConfirmationActionType;
  targetUserId: string;
  targetUserLabel: string;
  nextValue?: string;
}

const confirmationIntent = ref<AdminConfirmationIntent | null>(null);
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
  try {
    await ($api as any)(`/api/v1/admin/users/${userId}`, {
      method: "PATCH",
      body: { ...editFields.value },
    });
    editingUserId.value = null;
    await fetchUsers();
  } catch (e: any) {
    alert(e?.data?.message ?? "Error al guardar cambios");
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
const deleteTarget = ref<AdminUser | null>(null);
const showDeleteModal = ref(false);

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

async function changeRole(userId: string, newRole: string) {
  try {
    await ($api as any)(`/api/v1/admin/users/${userId}/role`, {
      method: "PATCH",
      body: { role: newRole },
    });
    await fetchUsers();
  } catch (e: any) {
    alert(e?.data?.message ?? "Error al cambiar rol");
  }
}

async function toggleStatus(userId: string, status: string) {
  try {
    await ($api as any)(`/api/v1/admin/users/${userId}/player-status`, {
      method: "PATCH",
      body: { status },
    });
    await fetchUsers();
  } catch (e: any) {
    alert(e?.data?.message ?? "Error al cambiar estado");
  }
}

function confirmDelete(user: AdminUser) {
  deleteTarget.value = user;
  showDeleteModal.value = true;
}

async function doDelete() {
  if (!deleteTarget.value) return;
  try {
    await ($api as any)(`/api/v1/admin/users/${deleteTarget.value.id}/player`, {
      method: "DELETE",
    });
    deleteTarget.value = null;
    showDeleteModal.value = false;
    await fetchUsers();
  } catch (e: any) {
    alert(e?.data?.message ?? "Error al eliminar jugador");
  }
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
              <!-- Role change -->
              <select
                v-if="user.role !== 'ADMIN'"
                class="border border-gray-300 rounded px-2 py-1 text-xs"
                :value="user.role"
                @change="
                  changeRole(
                    user.id,
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
                @click="
                  toggleStatus(
                    user.id,
                    user.player.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                  )
                "
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

    <!-- Delete confirmation modal using reusable component -->
    <ConfirmationModal
      v-if="deleteTarget && showDeleteModal"
      :open="showDeleteModal"
      :title="'Eliminar jugador'"
      :description="`¿Seguro que querés eliminar el perfil de jugador de ${deleteTarget.firstName} ${deleteTarget.lastName}? Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      :onConfirm="doDelete"
      :onCancel="
        () => {
          showDeleteModal.value = false;
          deleteTarget.value = null;
        }
      "
      @update:open="
        (v) => {
          showDeleteModal.value = v;
          if (!v) deleteTarget.value = null;
        }
      "
    />
  </div>
</template>
