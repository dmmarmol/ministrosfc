<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useProfile } from "~/composables/useProfile";
import ProfileHeader from "~/components/profile/ProfileHeader.vue";
import ProfileEditForm from "~/components/profile/ProfileEditForm.vue";
import JerseySvg from "~/components/profile/JerseySvg.vue";
import InvitedGuestsList from "~/components/profile/InvitedGuestsList.vue";
import {
  PlayerStatus,
  type UpdatePlayerProfilePayload,
} from "@ministrosfc/shared";


const { t } = useI18n();
definePageMeta({
  layout: "sheet",
  middleware: "auth",
  requiresAuth: true,
  skipOnboardingCheck: true,
});
useHead({ title: t("profilePlayer.perfilDelJugador") });

const {
  profile,
  loading,
  error,
  fetchProfile,
  updateProfile,
  uploadPhoto,
  fetchJerseyAvailability,
} = useProfile();

const takenJerseys = ref<number[]>([]);
const previewJerseyNumber = ref<number | null>(null);
const previewLastName = ref<string>("");

const editableProfile = computed(() => ({
  firstName: profile.value?.user.firstName ?? "",
  lastName: profile.value?.user.lastName ?? "",
  nickname: profile.value?.player.nickname ?? "",
  position: profile.value?.player.position ?? "",
  jerseyNumber: profile.value?.player.jerseyNumber ?? null,
  dateOfBirth: profile.value?.player.dateOfBirth ?? "",
  address: profile.value?.player.address ?? "",
  phone: profile.value?.contact.phone ?? "",
  whatsapp: profile.value?.contact.whatsapp ?? "",
  emergencyContact: profile.value?.contact.emergencyContact ?? "",
  status: profile.value?.player.status ?? PlayerStatus.ACTIVE,
}));

onMounted(async () => {
  await fetchProfile();
  if (profile.value) {
    takenJerseys.value = await fetchJerseyAvailability(profile.value.player.id);
    previewJerseyNumber.value = profile.value.player.jerseyNumber;
    previewLastName.value = profile.value.player.lastName;
  }
});

async function handleSave(data: UpdatePlayerProfilePayload) {
  await updateProfile(data);
  if (profile.value) {
    previewJerseyNumber.value = profile.value.player.jerseyNumber;
    previewLastName.value = profile.value.player.lastName;
  }
}

async function handlePhotoUpload(file: File) {
  await uploadPhoto(file);
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 pb-16 pt-6">
    <UiSheetTitle size="md">{{ t("profilePlayer.perfilDeJugador") }}</UiSheetTitle>

    <UiSheetMessage v-if="loading && !profile" class="mt-6">{{ t("profilePlayer.cargandoPerfil") }}</UiSheetMessage>

    <template v-else-if="profile">
      <div class="mt-6 flex flex-col gap-8 md:flex-row">
        <!-- Left: header + edit form -->
        <div class="flex-1 space-y-6">
          <ProfileHeader
            :photo-url="profile.player.photoUrl"
            :first-name="profile.user.firstName"
            :last-name="profile.user.lastName"
            :role="profile.user.role"
            :status="profile.player.status"
            :created-at="profile.user.createdAt"
            @upload-photo="handlePhotoUpload"
          />

          <div class="border-[3px] border-[var(--sheet-ink)] bg-[var(--sheet-paper)] p-5">
            <ProfileEditForm
              :profile="editableProfile"
              :taken-jerseys="takenJerseys"
              :loading="loading"
              :error="error"
              @save="handleSave"
              @jersey-change="previewJerseyNumber = $event"
              @last-name-change="previewLastName = $event"
            />
          </div>
        </div>

        <!-- Right: jersey preview -->
        <div class="hidden w-48 shrink-0 self-start md:block md:sticky md:top-4">
          <JerseySvg
            :jersey-number="previewJerseyNumber"
            :last-name="previewLastName"
          />
        </div>
      </div>

      <div class="mt-8">
        <InvitedGuestsList :guests="profile.invitedGuests" />
      </div>
    </template>

    <p v-else class="sheet-notice mt-6" data-tone="error" role="alert">
      {{ error || t("errors.noSePudoCargarEl") }}
    </p>
  </div>
</template>
