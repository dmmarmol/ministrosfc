<script setup lang="ts">
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

/** @TODO consider moving this generic date formatting function to a utility file */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
</script>

<template>
  <section v-if="guests.length > 0">
    <h3 class="text-lg font-semibold text-gray-800 mb-3">Invitados</h3>
    <ul class="divide-y divide-gray-100">
      <li
        v-for="guest in guests"
        :key="guest.id"
        class="py-3 flex items-center justify-between"
      >
        <div>
          <p class="text-sm font-medium text-gray-900">
            {{ guest.firstName }} {{ guest.lastName }}
          </p>
          <p v-if="guest.game" class="text-xs text-gray-500">
            vs {{ guest.game.opponent }} —
            {{ formatDate(guest.game.date) }}
          </p>
        </div>
        <NuxtLink
          v-if="guest.game"
          :to="`/games/${guest.game.id}`"
          class="text-xs text-brand hover:underline"
        >
          Ver partido
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
