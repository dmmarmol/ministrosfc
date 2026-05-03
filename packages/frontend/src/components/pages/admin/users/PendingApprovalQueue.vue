<script setup lang="ts">
import type { PendingApprovalQueueItem } from "@ministrosfc/shared";

defineProps<{
  rows: PendingApprovalQueueItem[];
  selectedUserId: string | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  select: [item: PendingApprovalQueueItem];
}>();
</script>

<template>
  <div
    class="relative rounded-xl border border-gray-200 bg-white overflow-hidden"
  >
    <div class="px-4 py-3 border-b border-gray-100">
      <h3 class="text-sm font-semibold text-gray-800">
        Solicitudes pendientes
      </h3>
    </div>

    <UiLoadingOverlay v-if="loading" />
    <div v-else-if="rows.length === 0" class="p-4 text-sm text-gray-500">
      No hay solicitudes pendientes.
    </div>

    <table v-else class="w-full text-sm">
      <thead class="bg-gray-50 text-xs uppercase text-gray-500">
        <tr>
          <th class="px-4 py-3 text-left">Usuario</th>
          <th class="px-4 py-3 text-left">Fecha</th>
          <th class="px-4 py-3 text-left">Sugerencia top</th>
          <th class="px-4 py-3 text-right">Acción</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr
          v-for="item in rows"
          :key="item.userId"
          :class="selectedUserId === item.userId ? 'bg-amber-50' : ''"
        >
          <td class="px-4 py-3">
            <p class="font-medium text-gray-800">
              {{ item.firstName }} {{ item.lastName }}
            </p>
            <p class="text-xs text-gray-500">{{ item.email }}</p>
          </td>
          <td class="px-4 py-3 text-gray-600">
            {{ new Date(item.submittedAt).toLocaleDateString("es-AR") }}
          </td>
          <td class="px-4 py-3">
            <template v-if="item.suggestions.length > 0">
              <p class="text-gray-800">
                {{ item.suggestions[0]!.firstName }}
                {{ item.suggestions[0]!.lastName }}
              </p>
              <p class="text-xs text-gray-500">
                score {{ item.suggestions[0]!.matchScore }}
              </p>
            </template>
            <span v-else class="text-xs text-gray-400">Sin sugerencias</span>
          </td>
          <td class="px-4 py-3 text-right">
            <UButton
              variant="solid"
              color="primary"
              size="xs"
              @click="emit('select', item)"
            >
              Revisar
            </UButton>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
