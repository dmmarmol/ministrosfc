<script lang="ts" setup>
import { computed } from "vue";
import SoccerJersey from "soccer-jersey";
import { Position } from "@ministrosfc/shared";

type Props = {
  jerseyNumber: number | null;
  isGuest?: boolean;
  isJersey?: boolean;
};
const props = defineProps<Props>();

const bgColor = "#1a1a1a";
const textColor = "#FFFFFF";

const jerseyDataUri = computed(() =>
  SoccerJersey.draw({
    shirtText: props.jerseyNumber ? props.jerseyNumber.toString() : "-",
    shirtColor: bgColor,
    sleeveColor: bgColor,
    shirtStyle: "plain",
    shirtStyleDirection: "vertical",
    textColor: textColor,
    textOutlineColor: textColor,
    isBack: true,
  }),
);
</script>
<template>
  <div v-if="!props.isGuest && props.jerseyNumber">
    <img
      v-if="props.isJersey"
      :src="jerseyDataUri"
      class="w-8 h-8"
      alt="Camiseta"
    />
    <span
      v-else
      :class="[
        'text-xs rounded-full text-center flex items-center justify-center font-normal',
        'border border-[#1a1a1a] text-gray-700',
        'w-6 h-6',
      ]"
      >{{ props.jerseyNumber }}</span
    >
  </div>
</template>
