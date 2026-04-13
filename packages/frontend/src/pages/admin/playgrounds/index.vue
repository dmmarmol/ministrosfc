<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "~/stores/auth";
import { usePlaygrounds } from "~/composables/usePlaygrounds";
import PlaygroundMap from "~/components/PlaygroundMap.vue";
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

async function confirmDelete(pg: Playground) {
  if (!confirm(`¿Eliminar "${pg.name}"? Esta acción no se puede deshacer.`))
    return;
  try {
    await deletePlayground(pg.id);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al eliminar cancha";
    alert(msg);
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
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
                      @click.stop="confirmDelete(pg)"
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
