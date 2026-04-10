import { ref, computed, type Ref } from "vue";
import { useNuxtApp } from "nuxt/app";
import type { GameSignupPageDTO, RosterEntry } from "@ministrosfc/shared";

export function useGameSignup(gameId: Ref<string>) {
  const { $api } = useNuxtApp();

  const data = ref<GameSignupPageDTO | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const roster = computed(() => data.value?.roster ?? []);
  const confirmedCount = computed(() => data.value?.confirmedCount ?? 0);
  const isFull = computed(() => data.value?.isFull ?? false);
  const currentPlayerStatus = computed(
    () => data.value?.currentPlayerStatus ?? "not_player_role",
  );
  const currentPlayerId = computed(() => data.value?.currentPlayerId ?? null);
  const game = computed(() => data.value?.game ?? null);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      const res = await $api<{ data: GameSignupPageDTO }>(
        `/api/v1/games/${gameId.value}/signup-page`,
      );
      data.value = res.data;
    } catch (e: any) {
      error.value = e?.message ?? "Error al cargar la convocatoria";
    } finally {
      loading.value = false;
    }
  }

  function applyResult(result: {
    entry: RosterEntry;
    confirmedCount: number;
    isFull: boolean;
  }) {
    if (!data.value) return;
    // Upsert roster entry
    const idx = data.value.roster.findIndex(
      (r) => r.participantId === result.entry.participantId,
    );
    if (idx >= 0) {
      data.value.roster.splice(idx, 1, result.entry);
    } else {
      data.value.roster.push(result.entry);
    }
    data.value.confirmedCount = result.confirmedCount;
    data.value.isFull = result.isFull;
    // Update currentPlayerStatus for self
    if (
      result.entry.player.id === currentPlayerId.value &&
      data.value.currentPlayerStatus === "not_signed_up"
    ) {
      data.value.currentPlayerStatus = "signed_up";
    }
  }

  async function signupSelf() {
    error.value = null;
    try {
      const res = await $api<{
        data: { entry: RosterEntry; confirmedCount: number; isFull: boolean };
      }>(`/api/v1/games/${gameId.value}/participants/signup`, {
        method: "POST",
        body: { mode: "self" },
      });
      applyResult(res.data);
    } catch (e: any) {
      error.value = e?.data?.message ?? e?.message ?? "Error al inscribirse";
      throw e;
    }
  }

  async function signupGuest(
    firstName: string,
    lastName: string,
    position?: string | null,
  ) {
    error.value = null;
    try {
      const res = await $api<{
        data: { entry: RosterEntry; confirmedCount: number; isFull: boolean };
      }>(`/api/v1/games/${gameId.value}/participants/signup`, {
        method: "POST",
        body: {
          mode: "guest",
          firstName,
          lastName,
          position: position ?? null,
        },
      });
      applyResult(res.data);
    } catch (e: any) {
      error.value =
        e?.data?.message ?? e?.message ?? "Error al agregar invitado";
      throw e;
    }
  }

  async function signupProxy(targetPlayerId: string) {
    error.value = null;
    try {
      const res = await $api<{
        data: { entry: RosterEntry; confirmedCount: number; isFull: boolean };
      }>(`/api/v1/games/${gameId.value}/participants/signup`, {
        method: "POST",
        body: { mode: "proxy", targetPlayerId },
      });
      applyResult(res.data);
    } catch (e: any) {
      error.value =
        e?.data?.message ?? e?.message ?? "Error al agregar jugador";
      throw e;
    }
  }

  async function removeParticipant(participantId: string) {
    error.value = null;
    try {
      await $api(
        `/api/v1/games/${gameId.value}/participants/${participantId}`,
        { method: "DELETE" },
      );
      if (!data.value) return;
      const idx = data.value.roster.findIndex(
        (r) => r.participantId === participantId,
      );
      if (idx >= 0) {
        const removed = data.value.roster[idx];
        data.value.roster.splice(idx, 1);
        data.value.confirmedCount = Math.max(0, data.value.confirmedCount - 1);
        data.value.isFull = false;
        if (removed.player.id === currentPlayerId.value) {
          data.value.currentPlayerStatus = "not_signed_up";
        }
      }
    } catch (e: any) {
      error.value =
        e?.data?.message ?? e?.message ?? "Error al eliminar al jugador";
      throw e;
    }
  }

  async function unregisterSelf() {
    error.value = null;
    try {
      await $api(`/api/v1/games/${gameId.value}/participants/self`, {
        method: "DELETE",
      });
      if (!data.value) return;
      const playerId = currentPlayerId.value;
      const idx = data.value.roster.findIndex((r) => r.player.id === playerId);
      if (idx >= 0) {
        data.value.roster.splice(idx, 1);
        data.value.confirmedCount = Math.max(0, data.value.confirmedCount - 1);
        data.value.isFull = false;
        data.value.currentPlayerStatus = "available";
      }
    } catch (e: any) {
      error.value =
        e?.data?.message ?? e?.message ?? "Error al cancelar inscripción";
    }
  }

  return {
    data,
    loading,
    error,
    roster,
    confirmedCount,
    isFull,
    currentPlayerStatus,
    currentPlayerId,
    game,
    load,
    signupSelf,
    signupGuest,
    signupProxy,
    removeParticipant,
    unregisterSelf,
  };
}
