<script setup lang="ts">
import { computed } from "vue";
import { useQueryParams } from "~/composables/useQueryParams";
import { resolveReturnUrl } from "~/utils/returnUrl";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    to?: string;
    label?: string;
  }>(),
  {
    to: "/",
  },
);

const label = computed(() => props.label ?? t("common.volve"));
const queryParams = useQueryParams();
const destination = computed(() =>
  resolveReturnUrl(queryParams.get("returnUrl"), props.to),
);
</script>

<template>
  <NuxtLink
    :to="destination"
    class="sheet-link inline-flex min-h-11 items-center"
    :aria-label="label"
  >
    ← {{ label }}
  </NuxtLink>
</template>
