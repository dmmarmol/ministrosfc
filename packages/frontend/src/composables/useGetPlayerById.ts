import { computed } from "vue";
import { useNuxtApp, useAsyncData } from "nuxt/app";

export interface PlayerContactInfo {
  id: string;
  phone?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string | null;
  jerseyNumber?: number | null;
  position?: string | null;
  photoUrl?: string | null;
  status?: string | null;
  playerType?: string | null;
  birthDate?: string | null;
  nationality?: string | null;
  contactInfo?: PlayerContactInfo | null;
  user?: { id: string; email: string; role: string } | null;
}

export function useGetPlayerById(id: string) {
  const { $api } = useNuxtApp();

  const { data, pending, error } = useAsyncData(`player-${id}`, () =>
    $api<{ data: Player }>(`/api/v1/players/${id}`),
  );

  const player = computed<Player | null>(() => data.value?.data ?? null);

  return { player, pending, error };
}
