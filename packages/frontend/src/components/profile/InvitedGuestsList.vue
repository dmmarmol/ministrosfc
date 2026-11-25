<script setup lang="ts">
import { formatDate } from "@ministrosfc/shared";


const { t } = useI18n();
interface GuestGame {
  id: string;
  date: string;
  opponent: string | null;
}

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  game: GuestGame | null;
}

defineProps<{
  guests: Guest[];
}>();
</script>

<template>
  <section v-if="guests.length > 0">
    <h3 class="sheet-display text-3xl">{{ t("profileInvitedGuestsList.invitados") }}</h3>
    <ul class="mt-2 border-t-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)]">
      <li
        v-for="guest in guests"
        :key="guest.id"
        class="flex items-center justify-between gap-3 border-b border-[var(--sheet-rule)] px-3 py-3"
      >
        <div class="min-w-0">
          <p class="font-bold">{{ guest.firstName }} {{ guest.lastName }}</p>
          <p v-if="guest.game" class="sheet-num text-sm text-[var(--sheet-ink-soft)]">
            {{ t("common.vs", { name: guest.game.opponent }) }} · {{ formatDate(guest.game.date) }}
          </p>
        </div>
        <NuxtLink
          v-if="guest.game"
          :to="guest.game.slug ? `/games/${guest.game.slug}` : `/games/${guest.game.id}`"
          class="sheet-link inline-flex min-h-11 items-center text-sm"
        >
          {{ t("profileInvitedGuestsList.verPartido") }}
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
