<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useNuxtApp, useAsyncData, useHead } from "nuxt/app";
import type { AdminGame } from "@ministrosfc/shared";
import { GameStatus, OPTION_FILTER_ALL, formatDate } from "@ministrosfc/shared";

import ConfirmationModal from "~/components/ui/ConfirmationModal.vue";
// import GameStatusSelect from "~/components/pages/games/GameStatusSelect.vue";
// import GameStatusBadge from "~/components/pages/games/GameStatusBadge.vue";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
  pageTitle: "Partidos",
});
useHead({ title: "Games – Admin" });

const { $api } = useNuxtApp();

const statusFilter = ref<GameStatus | typeof OPTION_FILTER_ALL>(
  OPTION_FILTER_ALL,
);
const opponentFilter = ref("");

const { data: teamsData } = await useAsyncData("admin-teams", () =>
  $api<{ data: any[] }>("/api/v1/teams"),
);
const teams = computed(() => teamsData.value?.data ?? []);

const { data, pending, refresh } = await useAsyncData("admin-games", () =>
  $api<{ data: AdminGame[] }>("/api/v1/games", {
    query: {
      ...(statusFilter.value ? { status: statusFilter.value } : {}),
      ...(opponentFilter.value ? { opponentTeamId: opponentFilter.value } : {}),
      limit: 100,
    },
  }),
);
watch([statusFilter, opponentFilter], () => refresh());
const games = computed(() => data.value?.data ?? []);
const gameToDelete = ref<any | null>(null);
const deleteModalOpen = ref(false);
const deleteInvoker = ref<HTMLElement | null>(null);

watch(deleteModalOpen, (isOpen) => {
  if (!isOpen && deleteInvoker.value) {
    nextTick(() => deleteInvoker.value?.focus());
  }
});

function askDeleteGame(game: any, event: Event) {
  gameToDelete.value = game;
  deleteInvoker.value = event.currentTarget as HTMLElement;
  deleteModalOpen.value = true;
}

function getDeleteGameDescription(game: any | null): string {
  if (!game) return "";
  return "¿Eliminar este partido? Esta acción no se puede deshacer.";
}

async function deleteGame() {
  if (!gameToDelete.value) return;
  const gameId = gameToDelete.value.id;
  await $api(`/api/v1/games/${gameId}`, { method: "DELETE" });
  deleteModalOpen.value = false;
  gameToDelete.value = null;
  await refresh();
}

const toastMessage = ref("");
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

function showToast(msg: string) {
  toastMessage.value = msg;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastMessage.value = "";
  }, 2500);
}

async function shareLink(url: string, label: string) {
  if (navigator.share) {
    try {
      await navigator.share({ url, title: label });
      return;
    } catch {
      // Fall through to clipboard
    }
  }
  await navigator.clipboard.writeText(url);
  showToast("¡Link copiado al portapapeles!");
}

function baseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

function canShareSignup(g: any): boolean {
  return (
    g.status === GameStatus.SCHEDULED &&
    !!g.slug &&
    (g.maxPlayers == null || (g.confirmedCount ?? 0) < g.maxPlayers)
  );
}

function getResultState(game: AdminGame): "G" | "E" | "P" | "—" {
  if (game.status !== GameStatus.COMPLETED) return "—";
  const home = game.homeTeamScore ?? 0;
  const away = game.awayTeamScore ?? 0;
  if (home === away) return "E";
  return home > away ? "G" : "P";
}

function getResultTitle(game: AdminGame): string {
  const state = getResultState(game);
  if (state === "G") return "Ganado";
  if (state === "E") return "Empate";
  if (state === "P") return "Perdido";
  return "Resultado pendiente";
}

function getResultTone(game: AdminGame): string {
  const state = getResultState(game);
  if (state === "G") return "bg-green-100 text-green-700";
  if (state === "E") return "bg-yellow-100 text-yellow-700";
  if (state === "P") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-500";
}
</script>

<template>
  <div>
    <ConfirmationModal
      :open="deleteModalOpen"
      title="Eliminar partido"
      :description="getDeleteGameDescription(gameToDelete)"
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      :on-confirm="deleteGame"
      :on-cancel="
        () => {
          deleteModalOpen = false;
          gameToDelete = null;
        }
      "
      @update:open="(value) => (deleteModalOpen = value)"
    />

    <!-- Toast -->
    <transition name="fade">
      <div
        v-if="toastMessage"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50"
      >
        {{ toastMessage }}
      </div>
    </transition>

    <div class="flex items-center justify-between mb-6">
      <h2 class="text-base font-semibold text-gray-700">Partidos</h2>
      <UButton
        to="/admin/games/create"
        color="primary"
        variant="solid"
        icon="mdi:plus"
      >
        Programar Partido</UButton
      >
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <!-- <GameStatusSelect
        v-model="statusFilter"
        placeholder="Todos los estados"
      /> -->
      <select
        v-model="opponentFilter"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm"
      >
        <option value="">Todos los rivales</option>
        <option v-for="t in teams" :key="t.id" :value="t.id">
          {{ t.name }}
        </option>
      </select>
    </div>

    <!-- Table -->
    <div
      class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div v-if="pending" class="p-6 space-y-3">
        <div
          v-for="i in 8"
          :key="i"
          class="h-10 bg-gray-100 animate-pulse rounded"
        />
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th class="px-2 py-3 text-left" title="Resultado"></th>
            <th class="px-4 py-3 text-left">Rival</th>
            <th class="px-4 py-3 text-center hidden sm:table-cell">Marcador</th>
            <th class="px-4 py-3 text-left hidden sm:table-cell">Fecha</th>
            <th class="px-4 py-3 text-left hidden sm:table-cell">Torneo</th>
            <th class="px-4 py-3 text-left hidden sm:table-cell">Cancha</th>
            <th class="px-4 py-3 text-center">Estado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="game in games"
            :key="game.id"
            class="border-t border-gray-100 hover:bg-gray-50"
          >
            <!-- Resultado -->
            <td
              class="px-4 py-3 text-center text-gray-700 hidden sm:table-cell"
              title="Resultado"
            >
              <span
                class="block"
                :class="[
                  getResultTone(game),
                  'text-xs px-2 py-0.5 rounded-sm font-medium',
                ]"
                :title="getResultTitle(game)"
              >
                {{ getResultState(game) }}
              </span>
            </td>
            <!-- Rival -->
            <td class="px-2 py-3 font-medium text-gray-900">
              <UButton
                class="truncate"
                variant="link"
                color="neutral"
                :to="`/admin/games/${game.id}/edit`"
              >
                {{ game.opponentTeam?.name ?? "—" }}
              </UButton>
            </td>

            <!-- Marcador -->
            <td
              class="px-4 py-3 text-center text-gray-700 hidden sm:table-cell"
            >
              {{
                game.status === GameStatus.COMPLETED
                  ? `${game.homeTeamScore ?? 0} – ${game.awayTeamScore ?? 0}`
                  : "—"
              }}
            </td>
            <!-- Fecha -->
            <td class="px-4 py-3 text-gray-600 hidden sm:table-cell">
              {{
                formatDate(game.date, {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              }}
            </td>
            <!-- Torneo -->
            <td class="px-4 py-3 text-gray-600 hidden sm:table-cell">
              {{ game.tournament?.name ?? "—" }}
            </td>
            <!-- Cancha -->
            <td class="px-4 py-3 text-gray-600 hidden sm:table-cell">
              <p class="truncate max-w-45">
                {{ game.playground?.name ?? "—" }}
              </p>
            </td>

            <td class="px-4 py-3 text-center">
              <!-- <GameStatusBadge :status="game.status" /> -->
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2 flex-wrap">
                <!-- T012: share-signup link (SCHEDULED + not full) -->
                <UButton
                  v-if="canShareSignup(game)"
                  variant="link"
                  color="success"
                  size="xs"
                  :title="'Copiar link de convocatoria'"
                  @click="
                    shareLink(
                      `${baseUrl()}/games/${game.slug}/signup`,
                      'Convocatoria',
                    )
                  "
                >
                  📋 Convocatoria
                </UButton>
                <!-- T013: share-detail link (all statuses with slug) -->
                <UButton
                  v-if="game.slug"
                  variant="ghost"
                  color="primary"
                  :title="'Copiar link del partido'"
                  icon="mdi:link"
                  @click="
                    shareLink(`${baseUrl()}/games/${game.slug}`, 'Partido')
                  "
                />
                <UButton
                  data-testid="delete-game-btn"
                  variant="ghost"
                  color="error"
                  icon="mdi:trash-can-outline"
                  title="Eliminar partido"
                  @click="askDeleteGame(game, $event)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!games.length">
            <td colspan="5" class="px-4 py-8 text-center text-gray-500">
              No se encontraron partidos.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
