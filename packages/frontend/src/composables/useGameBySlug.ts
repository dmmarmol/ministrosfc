import { computed } from "vue";
import { useNuxtApp, useAsyncData, createError } from "nuxt/app";

export function useGameBySlug(slug: string) {
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
        $api<{ data: any }>(`/api/v1/games/${id}`),
        $api<{ data: any[] }>(`/api/v1/games/${id}/participants`),
      ]);
      return {
        gameId: id,
        game: gameRes.data,
        participants: partRes.data as any[],
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

  return { gameId, game, participants, pending, error };
}
