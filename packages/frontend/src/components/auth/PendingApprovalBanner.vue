<script setup lang="ts">
const { t } = useI18n();

defineProps<{
  message: string;
}>();
</script>

<template>
  <div class="sheet-notice" role="status">
    <p class="sheet-label">{{ t("authPendingApprovalBanner.solicitudEnviada") }}</p>
    <p class="mt-1 font-normal">
      {{ message }}
    </p>
  </div>
</template>
