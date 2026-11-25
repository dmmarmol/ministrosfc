<script setup lang="ts">
import { useGameBySlug } from "~/composables/useGameBySlug";
import GameSheet from "~/components/pages/games/GameSheet.vue";


const { t } = useI18n();
definePageMeta({ public: true, layout: "sheet" });

const route = useRoute();
const slug = route.params.slug as string;
const config = useRuntimeConfig();
// Signup call to action stays off until the club adopts it (spec 023 FR-020/FR-021).
const ctaEnabled = computed(() => config.public.signupCtaEnabled === true);

const { game, participants, pending } = useGameBySlug(slug);

useHead(() => ({
  title: game.value
    ? `vs ${game.value.opponentTeam?.name ?? t("common.rivalAConfirmar")}`
    : t("common.partido"),
}));
</script>

<template>
  <div>
    <p v-if="pending" class="mx-auto max-w-3xl px-4 py-8">{{ t("gamesDetail.cargandoPartido") }}</p>
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
        <UiBackButton to="/schedule" :label="t('common.calendario')" />
        <UiSheetTitle class="mt-2">
          {{ t("gamesDetail.partidoNoEncontrado") }}
        </UiSheetTitle>
        <p class="mt-4 max-w-prose">
          {{ t("gamesDetail.revisaElLinkO") }}
        </p>
      </div>
    </section>
  </div>
</template>
