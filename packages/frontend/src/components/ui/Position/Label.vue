<script lang="ts" setup>
import { Position, PositionDisplayName } from "@ministrosfc/shared";

type Props = {
  position: Position | null;
};

const pesPositionClassMap = {
  [Position.GK]: "border-yellow-500",
  [Position.CB]: "border-blue-500",
  [Position.RB]: "border-blue-500",
  [Position.LB]: "border-blue-500",
  [Position.RWB]: "border-green-500",
  [Position.LWB]: "border-green-500",
  [Position.DMF]: "border-green-500",
  [Position.CMF]: "border-green-500",
  [Position.AMF]: "border-green-500",
  [Position.RMF]: "border-green-500",
  [Position.LMF]: "border-green-500",
  [Position.SS]: "border-red-500",
  [Position.CF]: "border-red-500",
  [Position.RWF]: "border-red-500",
  [Position.LWF]: "border-red-500",
};

const props = defineProps<Props>();

const displayName = props.position
  ? PositionDisplayName[props.position]
  : "Sin posición";
</script>
<template>
  <span
    :class="[
      'inline-block w-10 flex-shrink-0 mt-0.5 py-0.5 rounded',
      'text-white text-[14px] text-center font-bold',
      'bg-gray-900 border-b-4',
      `${props.position ? pesPositionClassMap[props.position] : 'text-gray-500'}`,
    ]"
    :title="displayName"
  >
    <template v-if="props.position">
      {{ props.position }}
    </template>
    <template v-else>-</template>
  </span>
</template>
