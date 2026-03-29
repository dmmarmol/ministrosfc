import { ref } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useRuntimeConfig } from "nuxt/app";

export interface ProfileData {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    hasPassword: boolean;
    hasGoogle: boolean;
    createdAt: string;
  };
  player: {
    id: string;
    firstName: string;
    lastName: string;
    nickname: string | null;
    position: string | null;
    jerseyNumber: number | null;
    dateOfBirth: string | null;
    address: string | null;
    photoUrl: string | null;
    status: string;
    playerType: string;
  };
  contact: {
    phone: string | null;
    whatsapp: string | null;
    emergencyContact: string | null;
  };
  invitedGuests: Array<{
    id: string;
    firstName: string;
    lastName: string;
    game: { id: string; date: string; opponent: string | null } | null;
  }>;
}

export function useProfile() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const profile = ref<ProfileData | null>(null);
  const loading = ref(false);
  const error = ref("");

  async function fetchProfile() {
    loading.value = true;
    error.value = "";
    try {
      const res = await $fetch<{ data: ProfileData }>(
        `${config.public.apiBaseUrl}/api/v1/profile`,
        { headers: { Authorization: `Bearer ${authStore.accessToken}` } },
      );
      profile.value = res.data;
    } catch (e: any) {
      error.value = e?.message ?? "Error al cargar el perfil";
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(data: Record<string, unknown>) {
    loading.value = true;
    error.value = "";
    try {
      const res = await $fetch<{ data: ProfileData }>(
        `${config.public.apiBaseUrl}/api/v1/profile`,
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
        `${config.public.apiBaseUrl}/api/v1/profile/photo`,
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
    try {
      const params = excludePlayerId ? `?exclude=${excludePlayerId}` : "";
      const res = await $fetch<{ data: { taken: number[] } }>(
        `${config.public.apiBaseUrl}/api/v1/profile/jersey-availability${params}`,
        { headers: { Authorization: `Bearer ${authStore.accessToken}` } },
      );
      return res.data.taken;
    } catch {
      return [];
    }
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
