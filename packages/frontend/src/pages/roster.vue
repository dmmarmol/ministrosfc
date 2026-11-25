<script setup lang="ts">
import { OPTION_FILTER_ALL, PlayerStatus } from "@ministrosfc/shared";
import PlayerFicha from "~/components/player/PlayerFicha.vue";
import { useAuthStore } from "~/stores/auth";

definePageMeta({ public: true, layout: "sheet", sheetWide: true });
useHead({ title: "Plantilla" });

const { $api } = useNuxtApp();
const authStore = useAuthStore();

const search = ref("");
const positionFilter = ref("");
const statusFilter = ref<PlayerStatus | typeof OPTION_FILTER_ALL>(
  PlayerStatus.ACTIVE,
);

const { data, pending } = await useAsyncData(
  "roster",
  () =>
    $api<{ data: any[] }>("/api/v1/players", {
      query: { status: statusFilter.value, limit: 100 },
    }),
  { watch: [statusFilter] },
);

// Career totals per player (public endpoint); the roster still works without them.
const { data: statsData } = await useAsyncData("roster-stats", () =>
  $api<{ data: any[] }>("/api/v1/statistics/players")
    .then((r) => r.data ?? [])
    .catch(() => [] as any[]),
);
const statsById = computed(() => {
  const m = new Map<string, { gamesPlayed: number; goals: number; assists: number }>();
  for (const s of statsData.value ?? [])
    m.set(s.playerId, {
      gamesPlayed: s.gamesPlayed,
      goals: s.goals,
      assists: s.assists,
    });
  return m;
});

const players = computed(() =>
  (data.value?.data ?? []).filter((p: any) => p.playerType !== "GUEST"),
);

const positions = [
  { value: "GK", label: "Portero" },
  { value: "CB", label: "Defensa Central" },
  { value: "RB", label: "Lateral Derecho" },
  { value: "LB", label: "Lateral Izquierdo" },
  { value: "RWB", label: "Carrilero Derecho" },
  { value: "LWB", label: "Carrilero Izquierdo" },
  { value: "DMF", label: "Mediocampista Defensivo" },
  { value: "CMF", label: "Mediocampista Central" },
  { value: "AMF", label: "Mediocampista Ofensivo" },
  { value: "RMF", label: "Mediocampista Derecho" },
  { value: "LMF", label: "Mediocampista Izquierdo" },
  { value: "SS", label: "Segundo Delantero" },
  { value: "CF", label: "Delantero Centro" },
  { value: "RWF", label: "Extremo Derecho" },
  { value: "LWF", label: "Extremo Izquierdo" },
];

const filteredPlayers = computed(() => {
  let list = players.value;
  if (positionFilter.value)
    list = list.filter((p: any) => p.position === positionFilter.value);
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    list = list.filter((p: any) =>
      [p.firstName, p.lastName, p.nickname].some((v) =>
        v?.toLowerCase().includes(q),
      ),
    );
  }
  return list;
});

const lines = [
  { title: "Arco", positions: ["GK"] },
  { title: "Defensa", positions: ["CB", "RB", "LB", "RWB", "LWB"] },
  { title: "Mediocampo", positions: ["DMF", "CMF", "AMF", "RMF", "LMF"] },
  { title: "Ataque", positions: ["SS", "CF", "RWF", "LWF"] },
];

const groups = computed(() => {
  const byDorsal = (a: any, b: any) =>
    (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999) ||
    a.lastName.localeCompare(b.lastName, "es");
  const used = new Set<string>();
  const out = lines
    .map((l) => {
      const items = filteredPlayers.value
        .filter((p: any) => l.positions.includes(p.position))
        .sort(byDorsal);
      items.forEach((p: any) => used.add(p.id));
      return { title: l.title, items };
    })
    .filter((g) => g.items.length);
  const rest = filteredPlayers.value
    .filter((p: any) => !used.has(p.id))
    .sort(byDorsal);
  if (rest.length) out.push({ title: "Sin posición", items: rest });
  return out;
});
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 pb-12 pt-6">
    <h1 class="sheet-display text-[clamp(3rem,15vw,6rem)]">Plantilla</h1>

    <form
      class="mt-5 grid gap-3 border-y-[3px] border-[var(--sheet-ink)] py-4 sm:grid-cols-[1fr_auto_auto]"
      role="search"
      @submit.prevent
    >
      <label class="block">
        <span class="sheet-label">Buscar jugador</span>
        <input
          v-model="search"
          type="search"
          placeholder="Nombre o apodo"
          class="sheet-field mt-1"
        />
      </label>
      <label class="block">
        <span class="sheet-label">Posición</span>
        <select v-model="positionFilter" class="sheet-field mt-1">
          <option value="">Todas</option>
          <option v-for="p in positions" :key="p.value" :value="p.value">
            {{ p.label }}
          </option>
        </select>
      </label>
      <label v-if="authStore.isAuthenticated" class="block">
        <span class="sheet-label">Estado</span>
        <select v-model="statusFilter" class="sheet-field mt-1">
          <option :value="PlayerStatus.ACTIVE">Activos</option>
          <option :value="PlayerStatus.INACTIVE">Inactivos</option>
          <option :value="OPTION_FILTER_ALL">Todos</option>
        </select>
      </label>
    </form>

    <p v-if="pending" class="mt-8">Cargando plantilla…</p>
    <template v-else-if="groups.length">
      <section
        v-for="g in groups"
        :key="g.title"
        class="mt-8"
        :aria-labelledby="`line-${g.title}`"
      >
        <h2
          :id="`line-${g.title}`"
          class="sheet-display mb-3 flex items-baseline gap-3 text-4xl"
        >
          {{ g.title }}
          <span class="sheet-num font-[var(--sheet-type)] text-base font-bold text-[var(--sheet-blue)]">{{
            g.items.length
          }}</span>
        </h2>
        <ul
          class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
        >
          <li v-for="p in g.items" :key="p.id" class="flex"><div class="w-full">
            <PlayerFicha :player="p" :stats="statsById.get(p.id) ?? null" />
          </div></li>
        </ul>
      </section>
    </template>
    <p v-else class="mt-8 text-lg">No se encontraron jugadores.</p>
  </div>
</template>
