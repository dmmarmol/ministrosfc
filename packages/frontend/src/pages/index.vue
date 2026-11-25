<script setup lang="ts">
import {
  GameStatus,
  type Game,
  type GameParticipant,
} from "@ministrosfc/shared";
import GameSheet from "~/components/pages/games/GameSheet.vue";
import HomeCopies from "~/components/pages/home/HomeCopies.vue";
import HomeArchive from "~/components/pages/home/HomeArchive.vue";

definePageMeta({ public: true, layout: "sheet" });
useHead({ title: "Inicio" });

const { $api } = useNuxtApp();
const config = useRuntimeConfig();
// Signup call to action stays off until the club adopts it (spec 023 FR-020/FR-021).
const ctaEnabled = computed(() => config.public.signupCtaEnabled === true);

const listGames = (status: GameStatus, limit: number) =>
  $api<{ data: Game[] }>("/api/v1/games", { query: { status, limit } }).then(
    (r) => r.data ?? [],
  );

// The next sheet: earliest upcoming game that is scheduled, live, or called off.
const { data: nextGame, pending: nextLoading } = await useAsyncData(
  "home-next-game",
  async () => {
    const [scheduled, live, cancelled] = await Promise.all([
      listGames(GameStatus.SCHEDULED, 5),
      listGames(GameStatus.IN_PROGRESS, 1),
      listGames(GameStatus.CANCELLED, 3),
    ]);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const candidates = [
      ...scheduled,
      ...live,
      ...cancelled.filter((g) => new Date(g.date) >= startOfToday),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return candidates[0] ?? null;
  },
);

const { data: participants } = await useAsyncData(
  "home-next-participants",
  async () => {
    if (!nextGame.value) return [] as GameParticipant[];
    const res = await $api<{ data: GameParticipant[] }>(
      `/api/v1/games/${nextGame.value.id}/participants`,
    ).catch(() => ({ data: [] as GameParticipant[] }));
    return res.data ?? [];
  },
  { watch: [nextGame] },
);

const { data: recentData, pending: recentLoading } = await useAsyncData(
  "home-recent",
  () => listGames(GameStatus.COMPLETED, 3),
);

const { data: scorersData, pending: scorersLoading } = await useAsyncData(
  "home-scorers",
  () =>
    $api<{ data: any[] }>("/api/v1/statistics/top-scorers", {
      query: { limit: 5 },
    }).then((r) => r.data ?? []),
);
</script>

<template>
  <div>
    <GameSheet
      v-if="nextGame"
      :game="nextGame"
      :participants="participants ?? []"
      :cta-enabled="ctaEnabled"
    />
    <section v-else class="sheet-paper" aria-labelledby="home-empty">
      <div class="mx-auto max-w-3xl px-4 pb-8 pt-6">
        <h1 id="home-empty" class="sheet-display text-[clamp(3rem,15vw,6rem)]">
          <template v-if="nextLoading">Cargando…</template>
          <template v-else>Sin partido programado</template>
        </h1>
        <p v-if="!nextLoading" class="mt-4 max-w-prose">
          Cuando se cargue el próximo partido vas a verlo acá.
        </p>
      </div>
    </section>

    <HomeCopies />
    <HomeArchive
      :results="recentData ?? []"
      :scorers="scorersData ?? []"
      :results-loading="recentLoading"
      :scorers-loading="scorersLoading"
    />
  </div>
</template>
