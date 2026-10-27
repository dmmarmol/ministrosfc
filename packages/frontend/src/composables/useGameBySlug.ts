import { computed, type Ref } from "vue";
import { useNuxtApp, useAsyncData, createError } from "nuxt/app";
import type { Game, GameParticipant } from "@ministrosfc/shared";

type GameBySlug = {
  gameId: Ref<string>;
  game: Ref<Game | null>;
  participants: Ref<GameParticipant[]>;
  pending: Ref<boolean>;
  error: Ref<unknown>;
};

export function useGameBySlug(slug: string): GameBySlug {
  const { $api } = useNuxtApp();

  const { data, pending, error } = useAsyncData(
    `game-by-slug-${slug}`,
    async () => {
      const slugRes = await $api<{ data: { id: string; slug: string } }>(
        `/api/v1/games/slug/${slug}`,
      );
      if (!slugRes.data?.id) {
        throw createError({ statusCode: 404, statusMessage: "Game not found" });
      }
      const id = slugRes.data.id;
      const [gameRes, partRes] = await Promise.all([
        $api<{ data: Game }>(`/api/v1/games/${id}`),
        $api<{ data: GameParticipant[] }>(`/api/v1/games/${id}/participants`),
      ]);
      return {
        gameId: id as string,
        game: gameRes.data as Game,
        participants: partRes.data as GameParticipant[],
      };
    },
  );

  const gameId = computed(() => data.value?.gameId ?? "");
  const game = computed(() => data.value?.game ?? null);
  const participants = computed(() =>
    [...(data.value?.participants ?? [])].sort(
      (a, b) =>
        new Date(a.confirmedAt ?? 0).getTime() -
        new Date(b.confirmedAt ?? 0).getTime(),
    ),
  );

  return {
    gameId: gameId,
    game: game,
    participants: participants,
    pending: pending,
    error: error,
  };
}
