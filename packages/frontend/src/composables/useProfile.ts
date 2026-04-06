import { ref } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useRuntimeConfig } from "nuxt/app";
import { useJerseyAvailability } from "~/composables/useJerseyAvailability";
import {
  type PlayerProfileResponse,
  type UpdatePlayerProfilePayload,
} from "@ministrosfc/shared";

export type { PlayerProfileResponse };

export function useProfile() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const profile = ref<PlayerProfileResponse | null>(null);
  const loading = ref(false);
  const error = ref("");

  async function fetchProfile() {
    loading.value = true;
    error.value = "";
    try {
      const res = await $fetch<{ data: PlayerProfileResponse }>(
        `${config.public.apiBaseUrl}/api/v1/profile/player`,
        { headers: { Authorization: `Bearer ${authStore.accessToken}` } },
      );
      profile.value = res.data;
    } catch (e: any) {
      error.value = e?.message ?? "Error al cargar el perfil";
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(data: UpdatePlayerProfilePayload) {
    loading.value = true;
    error.value = "";
    try {
      const res = await $fetch<{ data: PlayerProfileResponse }>(
        `${config.public.apiBaseUrl}/api/v1/profile/player`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${authStore.accessToken}` },
          body: data,
        },
      );
      profile.value = res.data;
    } catch (e: any) {
      error.value = e?.message ?? "Error al actualizar el perfil";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function uploadPhoto(file: File) {
    loading.value = true;
    error.value = "";
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await $fetch<{ data: { photoUrl: string } }>(
        `${config.public.apiBaseUrl}/api/v1/profile/player/photo`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${authStore.accessToken}` },
          body: formData,
        },
      );
      if (profile.value) {
        profile.value.player.photoUrl = res.data.photoUrl;
      }
      return res.data.photoUrl;
    } catch (e: any) {
      error.value = e?.message ?? "Error al subir la foto";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchJerseyAvailability(excludePlayerId?: string) {
    const jerseyAvailability = useJerseyAvailability();
    await jerseyAvailability.fetch(excludePlayerId);
    return jerseyAvailability.taken.value;
  }

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    uploadPhoto,
    fetchJerseyAvailability,
  };
}
