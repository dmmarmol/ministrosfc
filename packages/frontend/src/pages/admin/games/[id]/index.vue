<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: "auth",
  requiresAuth: true,
  requiresRole: "editor",
});

const { $api } = useNuxtApp();
const route = useRoute();
const id = route.params.id as string;

const { data, pending } = await useAsyncData(`admin-game-detail-${id}`, () =>
  $api<{ data: any }>(`/api/v1/games/${id}`),
);
const game = computed(() => data.value?.data ?? null);

useHead(() => ({
  title: game.value
    ? `vs ${game.value.opponentTeam?.name} – Admin`
    : "Game Detail",
}));

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("es-AR", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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

async function copySignupLink() {
  if (!game.value?.slug) return;
  const url = `${window.location.origin}/games/${game.value.slug}/signup`;
  if (navigator.share) {
    try {
      await navigator.share({ url, title: "Convocatoria" });
      return;
    } catch {
      // fallthrough to clipboard
    }
  }
  await navigator.clipboard.writeText(url);
  showToast("¡Link de convocatoria copiado!");
}
</script>

<template>
  <div>
    <!-- Toast -->
    <transition name="fade">
      <div
        v-if="toastMessage"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50"
      >
        {{ toastMessage }}
      </div>
    </transition>

    <!-- Back link + actions -->
    <div class="flex items-center justify-between mb-6">
      <NuxtLink to="/admin/games" class="text-sm text-gray-500 hover:text-brand"
        >← Volver a Partidos</NuxtLink
      >
      <div v-if="game" class="flex items-center gap-3">
        <!-- T011: share-signup link — SCHEDULED only + slug present -->
        <button
          v-if="game.status === 'SCHEDULED' && game.slug"
          class="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
          @click="copySignupLink"
        >
          📋 Copiar link de convocatoria
        </button>
        <NuxtLink
          :to="`/admin/games/${id}/edit`"
          class="text-sm text-brand hover:underline font-medium"
          >Editar</NuxtLink
        >
      </div>
    </div>

    <div v-if="pending" class="space-y-4">
      <div class="h-32 bg-gray-200 animate-pulse rounded-xl" />
      <div class="h-48 bg-gray-200 animate-pulse rounded-xl" />
    </div>

    <template v-else-if="game">
      <!-- Game header card -->
      <div class="bg-gray-900 text-white rounded-2xl p-6 mb-6">
        <p class="text-xs text-gray-400 uppercase tracking-wider mb-2">
          {{ formatDate(game.date) }}
          <span v-if="game.playground?.name">
            · {{ game.playground.name }}</span
          >
        </p>
        <div class="flex items-center justify-between gap-4">
          <span class="text-xl font-bold">Ministros FC</span>
          <div class="text-center">
            <p v-if="game.status === 'COMPLETED'" class="text-3xl font-bold">
              {{ game.homeTeamScore ?? 0 }} – {{ game.awayTeamScore ?? 0 }}
            </p>
            <p v-else class="text-lg text-gray-400">vs</p>
            <span
              class="text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block"
              :class="{
                'bg-blue-500/20 text-blue-300': game.status === 'SCHEDULED',
                'bg-green-500/20 text-green-300': game.status === 'IN_PROGRESS',
                'bg-gray-500/20 text-gray-300': game.status === 'COMPLETED',
                'bg-red-500/20 text-red-300': game.status === 'CANCELLED',
              }"
            >
              {{
                {
                  SCHEDULED: "Programado",
                  IN_PROGRESS: "En juego",
                  COMPLETED: "Completado",
                  CANCELLED: "Cancelado",
                }[game.status] ?? game.status
              }}
            </span>
          </div>
          <span class="text-xl font-bold">{{ game.opponentTeam?.name }}</span>
        </div>
      </div>

      <!-- Details -->
      <div
        class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 space-y-3 text-sm"
      >
        <div class="flex gap-2">
          <span class="text-gray-500 w-32 flex-shrink-0">Cupo máximo</span>
          <span class="text-gray-900">{{
            game.maxPlayers ?? "Sin límite"
          }}</span>
        </div>
        <div class="flex gap-2">
          <span class="text-gray-500 w-32 flex-shrink-0">Formación</span>
          <span class="text-gray-900">{{ game.lineup ?? "—" }}</span>
        </div>
        <div v-if="game.slug" class="flex gap-2">
          <span class="text-gray-500 w-32 flex-shrink-0">Slug</span>
          <span class="text-gray-700 font-mono text-xs">{{ game.slug }}</span>
        </div>
        <div v-if="game.notes" class="flex gap-2">
          <span class="text-gray-500 w-32 flex-shrink-0">Notas</span>
          <span class="text-gray-900">{{ game.notes }}</span>
        </div>
      </div>

      <!-- Participants -->
      <h3 class="text-sm font-semibold text-gray-700 mb-3">
        Convocados
        <span
          v-if="game.confirmedCount != null"
          class="text-gray-400 font-normal"
        >
          ({{ game.confirmedCount
          }}{{ game.maxPlayers ? ` / ${game.maxPlayers}` : "" }})
        </span>
      </h3>
      <div
        v-if="game.participants?.length"
        class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div
          v-for="p in game.participants"
          :key="p.id"
          class="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 text-sm"
        >
          <span class="text-gray-400 w-6 text-right text-xs">
            {{ p.player?.jerseyNumber ?? "—" }}
          </span>
          <span
            class="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
            :class="
              p.player?.playerType === 'GUEST'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
            "
          >
            {{ p.player?.playerType === "GUEST" ? "Inv." : "Reg." }}
          </span>
          <span class="flex-1 font-medium text-gray-900">
            {{ p.player?.firstName }}
            {{ p.player?.playerType === "GUEST" ? "" : p.player?.lastName }}
          </span>
          <span class="text-xs text-gray-400">{{
            p.player?.position ?? "—"
          }}</span>
        </div>
      </div>
      <p v-else class="text-sm text-gray-500">Sin convocados aún.</p>
    </template>

    <div v-else class="text-center py-16 text-gray-500">
      Partido no encontrado.
    </div>
  </div>
</template>
