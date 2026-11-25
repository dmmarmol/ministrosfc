<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import SoccerJersey from "soccer-jersey";
import { useSheetColors } from "~/composables/useSheetColors";

const { t } = useI18n();

type Props = {
  jerseyNumber: number | null;
  isGuest?: boolean;
  isJersey?: boolean;
  class?: string;
};
const props = defineProps<Props>();

const sheet = useSheetColors(
  { shirt: "ink", number: "paper" },
  { shirt: "black", number: "white" },
);

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
        shirtColor: sheet.shirt.value,
        sleeveColor: sheet.shirt.value,
        shirtStyle: "plain",
        shirtStyleDirection: "vertical",
        textColor: sheet.number.value,
        textOutlineColor: sheet.number.value,
        isBack: true,
      });
    } else {
      jerseyDataUri.value = SoccerJersey.draw({
        shirtText: "",
        shirtColor: sheet.number.value,
        sleeveColor: sheet.number.value,
        shirtStyle: "plain",
        shirtStyleDirection: "vertical",
        textColor: sheet.number.value,
        textOutlineColor: sheet.number.value,
        isBack: true,
      });
    }
  } catch {
    jerseyDataUri.value = "";
  }
}

onMounted(updateJerseyUri);
watch(() => props.jerseyNumber, updateJerseyUri);
watch([sheet.shirt, sheet.number], updateJerseyUri);
</script>
<template>
  <div v-if="!props.isGuest">
    <img
      v-if="props.isJersey"
      :src="jerseyDataUri"
      :class="['w-8 h-8', props.class]"
      :alt="t('positionNumber.camiseta')"
    />
    <span
      v-else
      :class="[
        'text-xs rounded-full text-center flex items-center justify-center font-normal',
        'border border-sheet-ink text-sheet-ink-soft',
        'w-6 h-6',
      ]"
      >{{ props.jerseyNumber }}</span
    >
  </div>
</template>
