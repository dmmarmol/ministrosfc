<script setup lang="ts">
import { useGameBySlug } from "~/composables/useGameBySlug";
import GameSheet from "~/components/pages/games/GameSheet.vue";

definePageMeta({ public: true, layout: "sheet" });

const route = useRoute();
const slug = route.params.slug as string;
const config = useRuntimeConfig();
// Signup call to action stays off until the club adopts it (spec 023 FR-020/FR-021).
const ctaEnabled = computed(() => config.public.signupCtaEnabled === true);

const { game, participants, pending } = useGameBySlug(slug);

useHead(() => ({
  title: game.value
    ? `vs ${game.value.opponentTeam?.name ?? "Rival a confirmar"}`
    : "Partido",
}));
</script>

<template>
  <div>
    <p v-if="pending" class="mx-auto max-w-3xl px-4 py-8">Cargando partido…</p>
    <GameSheet
      v-else-if="game"
      :game="game"
      :participants="participants"
      :cta-enabled="ctaEnabled"
      :signup-url="`/games/${game.slug || game.id}/signup`"
      detail
    />
    <section v-else class="sheet-paper">
      <div class="mx-auto max-w-3xl px-4 pb-8 pt-6">
        <NuxtLink to="/schedule" class="sheet-link inline-flex min-h-11 items-center"
          >← Calendario</NuxtLink
        >
        <h1 class="sheet-display mt-2 text-[clamp(3rem,15vw,6rem)]">
          Partido no encontrado
        </h1>
        <p class="mt-4 max-w-prose">
          Revisá el link o buscá el partido en el calendario.
        </p>
      </div>
    </section>
  </div>
</template>
