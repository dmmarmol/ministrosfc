<script setup lang="ts">
import { computed } from "vue";

/** @TODO try to use existing types or type values to enforce typing here */
const props = withDefaults(
  defineProps<{
    jerseyNumber: number | null;
    lastName: string;
    bgColor?: string;
    textColor?: string;
  }>(),
  {
    bgColor: "#1a1a1a",
    textColor: "#FFFFFF",
  },
);

const displayName = computed(() => props.lastName?.toUpperCase() ?? "");
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 240"
    class="w-full h-auto"
  >
    <!-- Jersey body -->
    <path
      d="M40 60 L20 80 L20 220 L80 230 L120 230 L180 220 L180 80 L160 60 L140 70 Q120 85 100 85 Q80 85 60 70 Z"
      :fill="bgColor"
      stroke="#333"
      stroke-width="2"
    />
    <!-- Left sleeve -->
    <path
      d="M40 60 L5 90 L15 120 L20 80 Z"
      :fill="bgColor"
      stroke="#333"
      stroke-width="2"
    />
    <!-- Right sleeve -->
    <path
      d="M160 60 L195 90 L185 120 L180 80 Z"
      :fill="bgColor"
      stroke="#333"
      stroke-width="2"
    />
    <!-- Collar -->
    <path
      d="M60 70 Q80 85 100 85 Q120 85 140 70 Q130 55 100 50 Q70 55 60 70 Z"
      fill="#333"
      stroke="#333"
      stroke-width="1"
    />
    <!-- Last name -->
    <text
      x="100"
      y="135"
      text-anchor="middle"
      :fill="textColor"
      font-size="18"
      font-weight="bold"
      font-family="Arial, sans-serif"
    >
      {{ displayName }}
    </text>
    <!-- Number -->
    <text
      v-if="jerseyNumber != null"
      x="100"
      y="185"
      text-anchor="middle"
      :fill="textColor"
      font-size="48"
      font-weight="bold"
      font-family="Arial, sans-serif"
    >
      {{ jerseyNumber }}
    </text>
  </svg>
</template>
