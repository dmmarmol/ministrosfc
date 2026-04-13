<script setup lang="ts">
import { ref } from "vue";
import type { CurrentPlayerStatus } from "@ministrosfc/shared";
import SignupSelfSection from "./SignupSelfSection.vue";

const props = defineProps<{
  currentPlayerStatus: CurrentPlayerStatus;
  isFull: boolean;
}>();

const emit = defineEmits<{
  "signup-self": [];
  dismiss: [];
  "cancel-self": [];
}>();

// --- Self signup ---
const selfLoading = ref(false);

async function handleSelf() {
  selfLoading.value = true;
  try {
    emit("signup-self");
  } finally {
    selfLoading.value = false;
  }
}
</script>

<template>
  <!-- Capacity full -->
  <div
    v-if="props.isFull"
    class="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg text-center font-medium"
  >
    El cupo está completo.
  </div>

  <template v-else>
    <!-- Self signup -->
    <SignupSelfSection
      :status="props.currentPlayerStatus"
      :loading="selfLoading"
      @confirm="handleSelf"
      @cancel-self="$emit('cancel-self')"
    />
  </template>
</template>
