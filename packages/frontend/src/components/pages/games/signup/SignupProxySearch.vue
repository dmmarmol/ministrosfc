<script setup lang="ts">
import { ref } from "vue";
import { useNuxtApp } from "nuxt/app";
import type { ApiResponse, PlayerPublic } from "@ministrosfc/shared";
import { PlayerStatus, PlayerType } from "@ministrosfc/shared";
const props = defineProps<{
  confirmedPlayerIds: string[];
}>();

const emit = defineEmits<{
  confirm: [playerId: string];
}>();

const { $api } = useNuxtApp();

const proxySearch = ref("");
const proxyLoading = ref(false);
const proxyPlayers = ref<PlayerPublic[]>([]);
const proxyError = ref<string | null>(null);

async function search() {
  if (!proxySearch.value.trim()) return;
  proxyLoading.value = true;
  proxyError.value = null;
  try {
    const res = await $api<ApiResponse<PlayerPublic[]>>("/api/v1/players", {
      query: {
        status: PlayerStatus.ACTIVE,
        playerType: PlayerType.REGISTERED,
        search: proxySearch.value.trim(),
        limit: 10,
      },
    });
    const confirmed = new Set(props.confirmedPlayerIds);
    proxyPlayers.value = (res.data ?? []).filter((p: PlayerPublic) => !confirmed.has(p.id));
  } catch (e: any) {
    proxyError.value = e?.message ?? "Error al buscar";
  } finally {
    proxyLoading.value = false;
  }
}

function confirm(playerId: string) {
  proxyError.value = null;
  emit("confirm", playerId);
  proxySearch.value = "";
  proxyPlayers.value = [];
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4 mb-4">
    <p class="text-sm font-medium text-gray-700 mb-3">
      Agregar a otro jugador
    </p>
    <div class="flex gap-2 mb-2">
      <input
        v-model="proxySearch"
        type="text"
        placeholder="Buscar jugador…"
        class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
        @keyup.enter="search"
      />
      <button
        class="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        :disabled="proxyLoading"
        @click="search"
      >
        Buscar
      </button>
    </div>
    <p v-if="proxyError" class="text-xs text-red-600 mb-2">
      {{ proxyError }}
    </p>
    <div v-if="proxyPlayers.length" class="space-y-1">
      <div
        v-for="p in proxyPlayers"
        :key="p.id"
        class="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm"
      >
        <span>{{ p.firstName }} {{ p.lastName }}</span>
        <button
          class="text-xs text-brand hover:underline font-medium"
          @click="confirm(p.id)"
        >
          Agregar
        </button>
      </div>
    </div>
  </div>
</template>
