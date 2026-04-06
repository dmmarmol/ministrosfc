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
    shirtStyleDirection: "vertical",
    textColor: props.textColor,
    textOutlineColor: props.textColor,
    isBack: true,
  }),
);
</script>

<template>
  <div class="relative w-full">
    <img :src="jerseyDataUri" class="w-full h-auto" alt="Camiseta" />
    <div
      class="absolute inset-x-0 w-1/2 top-[60%] left-[50%] transform -translate-x-1/2 flex flex-col items-center leading-none pointer-events-none"
    >
      <p
        class="text-[1rem] font-bold tracking-widest text-center"
        :style="{ color: textColor }"
      >
        {{ displayName }}
      </p>
    </div>
  </div>
</template>
