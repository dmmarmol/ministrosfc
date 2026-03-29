<script setup lang="ts">
import { computed } from "vue";

/** @TODO try to use existing types or type values to enforce typing here */
const props = defineProps<{
  firstName: string;
  lastName: string;
  role: string;
  status: string;
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
  return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
});

const roleBadgeClass = computed(() => {
  /** @TODO try to use existing types to enforce typing here instead of Record<string, string> */
  const classes: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-800",
    EDITOR: "bg-purple-100 text-purple-800",
    DT: "bg-blue-100 text-blue-800",
    PLAYER: "bg-green-100 text-green-800",
  };
  return classes[props.role] ?? "bg-gray-100 text-gray-800";
});

const statusBadgeClass = computed(() =>
  props.status === "ACTIVE"
    ? "bg-emerald-100 text-emerald-800"
    : "bg-gray-100 text-gray-500",
);
</script>

<template>
  <div class="flex items-center gap-4">
    <div class="relative">
      <div
        class="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center"
      >
        <img
          v-if="photoUrl"
          :src="photoUrl"
          :alt="`Foto de ${fullName}`"
          class="w-full h-full object-cover"
        />
        <span v-else class="text-2xl font-bold text-gray-400">
          {{ initials }}
        </span>
      </div>
      <button
        type="button"
        class="absolute bottom-0 right-0 bg-brand text-gray-900 rounded-full w-7 h-7 flex items-center justify-center shadow text-sm hover:opacity-90"
        title="Cambiar foto"
        @click="$emit('uploadPhoto')"
      >
        📷
      </button>
    </div>
    <div>
      <h2 class="text-xl font-bold text-gray-900">{{ fullName }}</h2>
      <div class="flex items-center gap-2 mt-1">
        <span
          class="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
          :class="roleBadgeClass"
        >
          {{ role }}
        </span>
        <span
          class="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
          :class="statusBadgeClass"
        >
          {{ status === "ACTIVE" ? "Activo" : "Inactivo" }}
        </span>
      </div>
      <p class="text-sm text-gray-500 mt-1">Miembro desde {{ memberSince }}</p>
    </div>
  </div>
</template>
