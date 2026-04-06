<script setup lang="ts">
import { computed } from "vue";
import SoccerJersey from "soccer-jersey";

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

const jerseyDataUri = computed(() =>
  SoccerJersey.draw({
    shirtText: props.jerseyNumber?.toString() ?? "",
    shirtColor: props.bgColor,
    sleeveColor: props.bgColor,
    shirtStyle: "plain",
    textColor: props.textColor,
    isBack: false,
  }),
);
</script>

<template>
  <div class="relative w-full">
    <img :src="jerseyDataUri" class="w-full h-auto" alt="Camiseta" />
    <div
      class="absolute inset-x-0 top-[38%] flex flex-col items-center leading-none pointer-events-none"
    >
      <span
        class="text-[0.6rem] font-bold tracking-widest"
        :style="{ color: textColor }"
        >{{ displayName }}</span
      >
    </div>
  </div>
</template>

</template>
