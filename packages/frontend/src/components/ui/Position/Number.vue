<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import SoccerJersey from "soccer-jersey";

type Props = {
  jerseyNumber: number | null;
  isGuest?: boolean;
  isJersey?: boolean;
};
const props = defineProps<Props>();

const bgColor = "#1a1a1a";
const textColor = "#FFFFFF";

const jerseyDataUri = ref("");

function updateJerseyUri() {
  // soccer-jersey relies on DOM APIs; avoid SSR evaluation.
  if (import.meta.server || !props.jerseyNumber) {
    jerseyDataUri.value = "";
    return;
  }

  try {
    jerseyDataUri.value = SoccerJersey.draw({
      shirtText: props.jerseyNumber.toString(),
      shirtColor: bgColor,
      sleeveColor: bgColor,
      shirtStyle: "plain",
      shirtStyleDirection: "vertical",
      textColor: textColor,
      textOutlineColor: textColor,
      isBack: true,
    });
  } catch {
    jerseyDataUri.value = "";
  }
}

onMounted(updateJerseyUri);
watch(() => props.jerseyNumber, updateJerseyUri);
</script>
<template>
  <div v-if="!props.isGuest && props.jerseyNumber">
    <img
      v-if="props.isJersey && jerseyDataUri"
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
