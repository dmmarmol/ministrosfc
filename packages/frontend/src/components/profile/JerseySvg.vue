<script setup lang="ts">
import { computed } from "vue";
import SoccerJersey from "soccer-jersey";
import { useSheetColors } from "~/composables/useSheetColors";


const { t } = useI18n();
const props = withDefaults(
  defineProps<{
    jerseyNumber: number | null;
    lastName: string;
    bgColor?: string;
    textColor?: string;
  }>(),
  { bgColor: undefined, textColor: undefined },
);

// Default shirt: sheet ink with a paper number, flipping in dark mode.
const sheet = useSheetColors(
  { shirt: "ink", number: "paper" },
  { shirt: "black", number: "white" },
);
const shirtColor = computed(() => props.bgColor ?? sheet.shirt.value);
const numberColor = computed(() => props.textColor ?? sheet.number.value);

const displayName = computed(() => props.lastName?.toUpperCase() ?? "");

const jerseyDataUri = computed(() =>
  SoccerJersey.draw({
    shirtText: props.jerseyNumber?.toString() ?? "",
    shirtColor: shirtColor.value,
    sleeveColor: shirtColor.value,
    shirtStyle: "plain",
    shirtStyleDirection: "vertical",
    textColor: numberColor.value,
    textOutlineColor: numberColor.value,
    isBack: true,
  }),
);
</script>

<template>
  <div class="relative w-full">
    <img :src="jerseyDataUri" class="w-full h-auto" :alt="t('profileJerseySvg.camiseta')" />
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
