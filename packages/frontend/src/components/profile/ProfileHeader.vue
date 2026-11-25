<script setup lang="ts">
import { computed } from "vue";
import {
  UserRole,
  PlayerStatus,
  DEFAULT_DATE_LOCALE,
} from "@ministrosfc/shared";

const props = defineProps<{
  firstName: string;
  lastName: string;
  role: UserRole;
  status: PlayerStatus;
  photoUrl: string | null;
  createdAt: string;
}>();

defineEmits<{ uploadPhoto: [] }>();

const fullName = computed(() => `${props.firstName} ${props.lastName}`);

const initials = computed(() =>
  `${props.firstName.charAt(0)}${props.lastName.charAt(0)}`.toUpperCase(),
);

const memberSince = computed(() => {
  const d = new Date(props.createdAt);
  return d.toLocaleDateString(DEFAULT_DATE_LOCALE, {
    month: "long",
    year: "numeric",
  });
});

</script>

<template>
  <div class="flex items-center gap-4">
    <div class="grid size-24 shrink-0 place-items-center overflow-hidden border-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-ink)] text-[var(--sheet-paper)]">
      <img
        v-if="photoUrl"
        :src="photoUrl"
        :alt="`Foto de ${fullName}`"
        class="size-full object-cover grayscale"
      />
      <span v-else class="sheet-display text-4xl" aria-hidden="true">{{ initials }}</span>
    </div>
    <div class="min-w-0">
      <h2 class="sheet-display break-words text-3xl">{{ fullName }}</h2>
      <p class="mt-1 flex flex-wrap items-center gap-2">
        <span class="border border-[var(--sheet-blue)] px-1.5 text-xs font-bold text-[var(--sheet-blue)]">{{ role }}</span>
        <span class="border border-[var(--sheet-ink)] px-1.5 text-xs font-bold">{{ status === "ACTIVE" ? "Activo" : "Inactivo" }}</span>
      </p>
      <p class="mt-1 text-sm text-[var(--sheet-ink-soft)]">Miembro desde {{ memberSince }}</p>
      <button type="button" class="sheet-link mt-1 inline-flex min-h-11 items-center" @click="$emit('uploadPhoto')">
        Cambiar foto
      </button>
    </div>
  </div>
</template>
