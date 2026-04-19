<script setup lang="ts">
const props = defineProps<{
  open?: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();
</script>

<template>
  <div class="border rounded-lg overflow-hidden">
    <button
      class="w-full bg-gray-50 text-left hover:bg-gray-100 transition-colors flex items-center"
      @click="emit('toggle')"
    >
      <slot name="header" />
      <svg
        class="w-4 h-4 shrink-0 ml-auto mr-4 transition-transform"
        :class="{ 'rotate-180': props.open }"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    <div v-if="props.open" class="bg-gray-100 border-t">
      <slot name="content" />
    </div>
  </div>
</template>
