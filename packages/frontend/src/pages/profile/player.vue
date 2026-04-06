<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useProfile } from "~/composables/useProfile";
import ProfileHeader from "~/components/profile/ProfileHeader.vue";
import ProfileEditForm from "~/components/profile/ProfileEditForm.vue";
import JerseySvg from "~/components/profile/JerseySvg.vue";
import InvitedGuestsList from "~/components/profile/InvitedGuestsList.vue";

definePageMeta({ middleware: "auth" });
useHead({ title: "Perfil de Jugador – Ministros FC" });

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
  status: profile.value?.player.status ?? "ACTIVE",
}));

onMounted(async () => {
  await fetchProfile();
  if (profile.value) {
    takenJerseys.value = await fetchJerseyAvailability(profile.value.player.id);
    previewJerseyNumber.value = profile.value.player.jerseyNumber;
    previewLastName.value = profile.value.player.lastName;
  }
});

async function handleSave(data: Record<string, unknown>) {
  await updateProfile(data);
}

async function handlePhotoUpload(file: File) {
  await uploadPhoto(file);
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8 space-y-8">
    <div v-if="loading && !profile" class="text-center py-16 text-gray-400">
      Cargando perfil…
    </div>

    <template v-else-if="profile">
      <div class="flex flex-col md:flex-row gap-8">
        <!-- Left: Header + Edit Form -->
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

        <!-- Right: Jersey SVG -->
        <div class="w-48 shrink-0 self-start hidden md:block">
          <JerseySvg
            :jersey-number="previewJerseyNumber"
            :last-name="previewLastName"
          />
        </div>
      </div>

      <InvitedGuestsList :guests="profile.invitedGuests" />
    </template>

    <div v-else class="text-center py-16 text-red-500">
      {{ error || "No se pudo cargar el perfil" }}
    </div>
  </div>
</template>
