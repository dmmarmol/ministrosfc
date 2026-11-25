<script setup lang="ts">
import {
  OPTION_FILTER_ALL,
  PlayerStatus,
  PlayerType,
  Position,
  PositionDisplayName,
  type PlayerPublic,
} from "@ministrosfc/shared";
import { filterRegisteredPlayers, resolveRosterStatus } from "~/utils/roster";
import PlayerFicha from "~/components/player/PlayerFicha.vue";
import { useAuthStore } from "~/stores/auth";


const { t } = useI18n();
definePageMeta({ public: true, layout: "sheet", sheetWide: true });
useHead({ title: t("common.plantilla") });

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
    $api<{ data: PlayerPublic[] }>("/api/v1/players", {
      query: {
        status: statusFilter.value,
        playerType: PlayerType.REGISTERED,
        search: search.value.trim() || undefined,
        limit: 100,
      },
    }),
  { watch: [statusFilter, search] },
);

// Searching looks across every status (behavior from main)
watch(search, (value) => {
  statusFilter.value = resolveRosterStatus(value, statusFilter.value);
});

function statusLabel(status: unknown): string {
  if (status === PlayerStatus.ACTIVE) return t("common.activo");
  if (status === PlayerStatus.INACTIVE) return t("common.inactivo");
  return t("common.sinEstado");
}

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

const positions = Object.values(Position).map((value) => ({
  value,
  label: PositionDisplayName[value],
}));

const filteredPlayers = computed(() =>
  filterRegisteredPlayers(
    data.value?.data ?? [],
    search.value,
    positionFilter.value,
    statusFilter.value,
  ),
);

const lines = [
  { title: t("roster.arco"), positions: ["GK"] },
  { title: t("roster.defensa"), positions: ["CB", "RB", "LB", "RWB", "LWB"] },
  { title: t("roster.mediocampo"), positions: ["DMF", "CMF", "AMF", "RMF", "LMF"] },
  { title: t("roster.ataque"), positions: ["SS", "CF", "RWF", "LWF"] },
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
  if (rest.length) out.push({ title: t("common.sinPosicion"), items: rest });
  return out;
});
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 pb-12 pt-6">
    <UiSheetTitle>{{ t("common.plantilla") }}</UiSheetTitle>

    <form
      class="mt-5 grid gap-3 border-y-[3px] border-[var(--sheet-ink)] py-4 sm:grid-cols-[1fr_auto_auto]"
      role="search"
      @submit.prevent
    >
      <label class="block">
        <span class="sheet-label">{{ t("roster.buscarJugador") }}</span>
        <input
          v-model="search"
          type="search"
          :placeholder="t('roster.nombreOApodo')"
          class="sheet-field mt-1"
        />
      </label>
      <label class="block">
        <span class="sheet-label">{{ t("roster.posicion") }}</span>
        <select v-model="positionFilter" class="sheet-field mt-1">
          <option value="">{{ t("common.todas") }}</option>
          <option v-for="p in positions" :key="p.value" :value="p.value">
            {{ p.label }}
          </option>
        </select>
      </label>
      <label v-if="authStore.isAuthenticated" class="block">
        <span class="sheet-label">{{ t("common.estado") }}</span>
        <select v-model="statusFilter" class="sheet-field mt-1">
          <option :value="PlayerStatus.ACTIVE">{{ t("common.activos") }}</option>
          <option :value="PlayerStatus.INACTIVE">{{ t("common.inactivos") }}</option>
          <option :value="OPTION_FILTER_ALL">{{ t("common.todos") }}</option>
        </select>
      </label>
    </form>

    <UiSheetMessage v-if="pending" class="mt-8">{{ t("roster.cargandoPlantilla") }}</UiSheetMessage>
    <template v-else-if="groups.length">
      <section
        v-for="g in groups"
        :key="g.title"
        class="mt-8"
        :aria-labelledby="`line-${g.title}`"
      >
        <UiSheetHeading :id="`line-${g.title}`" size="lg" :count="g.items.length" class="mb-3">{{ g.title }}</UiSheetHeading>
        <ul
          class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
        >
          <li v-for="p in g.items" :key="p.id" class="flex"><div class="w-full">
            <PlayerFicha
              :player="p"
              :stats="statsById.get(p.id) ?? null"
              :status-label="statusFilter === OPTION_FILTER_ALL ? statusLabel(p.status) : null"
            />
          </div></li>
        </ul>
      </section>
    </template>
    <UiSheetMessage v-else tone="empty" class="mt-8">{{ t("errors.noSeEncontraronJugadores") }}</UiSheetMessage>
  </div>
</template>
