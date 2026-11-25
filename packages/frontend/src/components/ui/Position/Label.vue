<script lang="ts" setup>
import { computed } from "vue";
import { Position, PositionDisplayName } from "@ministrosfc/shared";

const { t } = useI18n();

/**
 * Position badge in the spirit of the old PES6 position tags: a dark block with
 * the code in display type and a thick bottom edge colored by the line of play
 * (goalkeeper yellow, defense blue, midfield green, attack red). The readable
 * Spanish name comes from the shared enum and sits in the title and for screen
 * readers; color is never the only carrier of the meaning.
 */
type Line = "gk" | "def" | "mid" | "fwd";

const props = withDefaults(
  defineProps<{
    position?: Position | string | null;
    size?: "sm" | "md";
  }>(),
  { position: null, size: "md" },
);

const LINE: Record<Position, Line> = {
  [Position.GK]: "gk",
  [Position.CB]: "def",
  [Position.RB]: "def",
  [Position.LB]: "def",
  [Position.RWB]: "mid",
  [Position.LWB]: "mid",
  [Position.DMF]: "mid",
  [Position.CMF]: "mid",
  [Position.AMF]: "mid",
  [Position.RMF]: "mid",
  [Position.LMF]: "mid",
  [Position.SS]: "fwd",
  [Position.CF]: "fwd",
  [Position.RWF]: "fwd",
  [Position.LWF]: "fwd",
};

const known = computed(
  () => !!props.position && props.position in PositionDisplayName,
);
const displayName = computed(() =>
  known.value
    ? PositionDisplayName[props.position as Position]
    : props.position
      ? String(props.position)
      : t("common.sinPosicion"),
);
const line = computed(() =>
  known.value ? LINE[props.position as Position] : undefined,
);
</script>

<template>
  <span
    class="sheet-pos"
    :data-line="line"
    :data-size="size"
    :data-empty="position ? undefined : ''"
    :title="displayName"
  >
    <span aria-hidden="true">{{ position || "–" }}</span>
    <span class="sr-only">{{ displayName }}</span>
  </span>
</template>
