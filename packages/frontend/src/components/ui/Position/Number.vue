<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import SoccerJersey from "soccer-jersey";

type Props = {
  jerseyNumber: number | null;
  isGuest?: boolean;
  isJersey?: boolean;
  class?: string;
};
const props = defineProps<Props>();

const bgColor = "#1a1a1a";
const textColor = "#FFFFFF";

const emptyBgColor = "#FFFFFF";
const emptyTextColor = "#1a1a1a";

const jerseyDataUri = ref("");

function updateJerseyUri() {
  // soccer-jersey relies on DOM APIs; avoid SSR evaluation.
  if (import.meta.server) {
    jerseyDataUri.value = "";
    return;
  }

  try {
    if (props.jerseyNumber) {
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
    } else {
      jerseyDataUri.value = SoccerJersey.draw({
        shirtText: "",
        shirtColor: emptyBgColor,
        sleeveColor: emptyBgColor,
        shirtStyle: "plain",
        shirtStyleDirection: "vertical",
        textColor: emptyTextColor,
        textOutlineColor: emptyTextColor,
        isBack: true,
      });
    }
  } catch {
    jerseyDataUri.value = "";
  }
}

onMounted(updateJerseyUri);
watch(() => props.jerseyNumber, updateJerseyUri);
</script>
<template>
  <div v-if="!props.isGuest">
    <img
      v-if="props.isJersey"
      :src="jerseyDataUri"
      :class="['w-8 h-8', props.class]"
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
