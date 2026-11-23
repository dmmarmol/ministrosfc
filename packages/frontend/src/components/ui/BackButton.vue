<script setup lang="ts">
import { computed } from "vue";
import { useQueryParams } from "~/composables/useQueryParams";
import { resolveReturnUrl } from "~/utils/returnUrl";

const props = withDefaults(
  defineProps<{
    to?: string;
    label?: string;
  }>(),
  {
    to: "/",
    label: "Volvé",
  },
);

const queryParams = useQueryParams();
const destination = computed(() =>
  resolveReturnUrl(queryParams.get("returnUrl"), props.to),
);
</script>

<template>
  <NuxtLink
    :to="destination"
    class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
    :aria-label="props.label"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M15 19l-7-7 7-7"
      />
    </svg>
    {{ props.label }}
  </NuxtLink>
</template>
