<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import { useAuthStore } from "~/stores/auth";
import { usePlaygrounds } from "~/composables/usePlaygrounds";
import PlaygroundMap from "~/components/PlaygroundMap.vue";
import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";
import type { Playground } from "@ministrosfc/shared";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  noPadding: true,
});
useHead({ title: "Canchas – Admin" });

const authStore = useAuthStore();
const { playgrounds, loading, fetchPlaygrounds, deletePlayground } =
  usePlaygrounds();

const mapRef = ref<InstanceType<typeof PlaygroundMap> | null>(null);
const highlightedId = ref<string | null>(null);
const playgroundToDelete = ref<Playground | null>(null);
const deleteModalOpen = ref(false);
const deleteInvoker = ref<HTMLElement | null>(null);

onMounted(() => {
  fetchPlaygrounds();
});

function onRowClick(pg: Playground) {
  mapRef.value?.centerOn(pg.id);
  highlightedId.value = pg.id;
}

function onPinClick(id: string) {
  highlightedId.value = id;
}

watch(deleteModalOpen, (isOpen) => {
  if (!isOpen && deleteInvoker.value) {
    nextTick(() => deleteInvoker.value?.focus());
  }
});

function askDeletePlayground(pg: Playground, event: Event) {
  playgroundToDelete.value = pg;
  deleteInvoker.value = event.currentTarget as HTMLElement;
  deleteModalOpen.value = true;
}

function onCancelDelete() {
  deleteModalOpen.value = false;
  playgroundToDelete.value = null;
}

async function confirmDelete() {
  if (!playgroundToDelete.value) return;
  await deletePlayground(playgroundToDelete.value.id);
  deleteModalOpen.value = false;
  playgroundToDelete.value = null;
}

function getConfirmationDescription(
  playgroundToDelete: Playground | null,
): string {
  if (!playgroundToDelete) return "";
  if (playgroundToDelete.gameCount > 0) {
    return `La cancha \'${playgroundToDelete.name}\' está en uso por ${playgroundToDelete.gameCount} partido(s). No se puede eliminar hasta que se reasignen o eliminen esos partidos.`;
  }
  return `¿Eliminar la cancha \'${playgroundToDelete.name}\'? Esta acción no se puede deshacer.`;
}
</script>

<template>
  <div class="flex flex-col h-full">
    <ConfirmationModal
      :open="deleteModalOpen"
      title="Eliminar cancha"
      :description="getConfirmationDescription(playgroundToDelete)"
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      :on-confirm="confirmDelete"
      :on-cancel="onCancelDelete"
      @update:open="(value) => (deleteModalOpen = value)"
    />

    <header
      class="flex items-center justify-between p-6 shadow-md bg-gray-100 z-50 relative"
    >
      <h2 class="text-base font-semibold text-gray-700">Canchas</h2>
      <NuxtLink
        to="/admin/playgrounds/create"
        class="bg-brand text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90"
      >
        Nueva cancha
      </NuxtLink>
    </header>

    <div class="h-full relative flex items-stretch">
      <div v-if="loading" class="text-sm text-gray-500">Cargando canchas…</div>
      <div v-else class="lg:absolute lg:left-0 lg:top-0 lg:p-4 z-50">
        <div class="w-full bg-white rounded py-4 shadow-md">
          <!-- Table -->
          <table class="w-full text-sm text-gray-700 border-collapse">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-2 px-4 pr-3 font-medium">Nombre</th>
                <th class="text-left py-2 px-4 pr-3 font-medium">Dirección</th>
                <th
                  v-if="authStore.isAdmin"
                  class="text-right py-2 px-4 font-medium"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="pg in playgrounds"
                :key="pg.id"
                class="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                :class="{ 'bg-brand/10': highlightedId === pg.id }"
                @click="onRowClick(pg)"
              >
                <td class="py-2 px-4 pr-3">
                  <NuxtLink
                    :to="`/admin/playgrounds/${pg.id}/edit`"
                    class="text-brand hover:underline"
                    @click.stop
                  >
                    {{ pg.name }}
                  </NuxtLink>
                </td>
                <td class="py-2 px-4 pr-3 text-gray-500 truncate max-w-[160px]">
                  {{ pg.address }}
                </td>
                <td v-if="authStore.isAdmin" class="py-2 px-4 text-right">
                  <span :title="pg.gameCount > 0 ? 'Cancha en uso' : undefined">
                    <button
                      class="text-xs text-red-600 hover:text-red-800 disabled:opacity-40 disabled:pointer-events-none"
                      :disabled="pg.gameCount > 0"
                      @click.stop="askDeletePlayground(pg, $event)"
                    >
                      Eliminar
                    </button>
                  </span>
                </td>
              </tr>
              <tr v-if="!playgrounds.length">
                <td colspan="3" class="py-4 text-center text-gray-400 text-sm">
                  No hay canchas registradas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Map -->
      <div class="hidden lg:flex lg:grow w-full h-full relative z-0">
        <PlaygroundMap
          ref="mapRef"
          :playgrounds="playgrounds"
          class="h-[500px]"
          @pin-click="onPinClick"
        />
      </div>
    </div>
  </div>
</template>
