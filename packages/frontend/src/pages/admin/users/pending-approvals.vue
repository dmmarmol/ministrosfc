<script setup lang="ts">
import type {
  OrphanPlayerItem,
  PendingApprovalQueueItem,
} from "@ministrosfc/shared";
import PendingApprovalQueue from "~/components/pages/admin/users/PendingApprovalQueue.vue";
import PendingApprovalReviewPanel from "~/components/pages/admin/users/PendingApprovalReviewPanel.vue";
import { useGetOrphanPlayers } from "~/composables/admin/useGetOrphanPlayers";
import { useQueryParams } from "~/composables/useQueryParams";

const queryParams = useQueryParams();
const route = useRoute();
const { $api } = useNuxtApp();
const { fetchPendingUserOrphanPlayers } = useGetOrphanPlayers();

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Aprobaciones Pendientes",
});

const queue = ref<PendingApprovalQueueItem[]>([]);
const selected = ref<PendingApprovalQueueItem | null>(null);
const orphanPlayers = ref<OrphanPlayerItem[]>([]);

const loading = ref(false);
const actionLoading = ref(false);
const error = ref("");

const search = ref(queryParams.get("search"));
const page = ref(Number(queryParams.get("page") || "1") || 1);
const limit = ref(Number(queryParams.get("limit") || "20") || 20);
const orphanSearch = ref(queryParams.get("orphanSearch"));

async function fetchQueue() {
  loading.value = true;
  error.value = "";
  try {
    const params = new URLSearchParams();
    params.set("page", String(page.value));
    params.set("limit", String(limit.value));
    if (search.value.trim()) {
      params.set("search", search.value.trim());
    }

    const response = await ($api as any)(
      `/api/v1/admin/users/pending-approvals?${params.toString()}`,
    );

    queue.value = response.data ?? [];
    if (
      selected.value &&
      !queue.value.find((row) => row.userId === selected.value?.userId)
    ) {
      selected.value = null;
      orphanPlayers.value = [];
    }
  } catch (e: any) {
    error.value =
      e?.data?.message ?? "No se pudo cargar la cola de aprobación.";
  } finally {
    loading.value = false;
  }
}

async function fetchOrphanPlayers(searchQuery = "") {
  if (!selected.value) return;

  const normalizedSearch = searchQuery.trim();
  orphanSearch.value = normalizedSearch;
  await queryParams.set("orphanSearch", normalizedSearch);

  orphanPlayers.value = await fetchPendingUserOrphanPlayers(
    selected.value.userId,
    {
      page: 1,
      limit: 20,
      search: normalizedSearch,
    },
  );
}

async function applyQuery() {
  await queryParams.set("search", search.value.trim());
  await queryParams.set("page", String(page.value));
  await queryParams.set("limit", String(limit.value));
}

async function handleSearch() {
  page.value = 1;
  await applyQuery();
}

function selectItem(item: PendingApprovalQueueItem) {
  selected.value = item;
  orphanPlayers.value = [];
  void fetchOrphanPlayers(orphanSearch.value);
}

async function approveWithoutMerge() {
  if (!selected.value) return;

  actionLoading.value = true;
  try {
    await ($api as any)(
      `/api/v1/admin/users/pending-approvals/${selected.value.userId}/approve`,
      {
        method: "POST",
        body: { expectedUpdatedAt: selected.value.updatedAt },
      },
    );
    selected.value = null;
    orphanPlayers.value = [];
    await fetchQueue();
  } finally {
    actionLoading.value = false;
  }
}

async function approveWithMerge(mergePlayerId: string) {
  if (!selected.value) return;

  actionLoading.value = true;
  try {
    await ($api as any)(
      `/api/v1/admin/users/pending-approvals/${selected.value.userId}/approve-merge`,
      {
        method: "POST",
        body: {
          mergePlayerId,
          expectedUpdatedAt: selected.value.updatedAt,
        },
      },
    );
    selected.value = null;
    orphanPlayers.value = [];
    await fetchQueue();
  } finally {
    actionLoading.value = false;
  }
}

async function deny(reason: string) {
  if (!selected.value) return;

  actionLoading.value = true;
  try {
    await ($api as any)(
      `/api/v1/admin/users/pending-approvals/${selected.value.userId}/deny`,
      {
        method: "POST",
        body: {
          reason,
          expectedUpdatedAt: selected.value.updatedAt,
        },
      },
    );
    selected.value = null;
    orphanPlayers.value = [];
    await fetchQueue();
  } finally {
    actionLoading.value = false;
  }
}

watch(
  () => route.query,
  () => {
    search.value = queryParams.get("search");
    page.value = Number(queryParams.get("page") || "1") || 1;
    limit.value = Number(queryParams.get("limit") || "20") || 20;
    orphanSearch.value = queryParams.get("orphanSearch");
    void fetchQueue();
  },
);

await fetchQueue();
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-end gap-3">
      <div class="flex-1 min-w-64">
        <label
          class="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500"
        >
          Buscar
        </label>
        <input
          v-model="search"
          type="text"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Nombre, apellido o email"
          @keyup.enter="handleSearch"
        />
      </div>

      <UButton
        variant="outline"
        color="primary"
        size="sm"
        @click="handleSearch"
      >
        Aplicar filtros
      </UButton>
    </div>

    <p
      v-if="loading"
      class="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700"
    >
      Cargando...
    </p>
    <p
      v-else-if="error"
      class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ error }}
    </p>

    <div class="grid gap-4 lg:grid-cols-2">
      <PendingApprovalQueue
        :rows="queue"
        :selected-user-id="selected?.userId ?? null"
        :loading="loading"
        @select="selectItem"
      />

      <PendingApprovalReviewPanel
        :selected="selected"
        :orphan-players="orphanPlayers"
        :action-loading="actionLoading"
        @approve="approveWithoutMerge"
        @approve-merge="approveWithMerge"
        @deny="deny"
        @search-orphans="fetchOrphanPlayers"
      />
    </div>
  </div>
</template>
