<script setup lang="ts">
import {
  CompetitionType,
  DEFAULT_MAX_PLAYERS,
  formatDateInput,
  formatTimeInput,
  type Game,
  type GameCreatePayload,
  type GameUpdatePayload,
} from "@ministrosfc/shared";
import GameFormFields from "./GameFormFields.vue";
import GameParticipantsFields from "./GameParticipantsFields.vue";

export type GameFormData = GameCreatePayload &
  GameUpdatePayload & {
    expectedUpdatedAt: string;
  };

const props = withDefaults(
  defineProps<{
    game?: Game | null;
    submitLabel?: string;
    cancelTo?: string;
    loading?: boolean;
    error?: string;
  }>(),
  {
    game: null,
    submitLabel: "Guardar partido",
    cancelTo: "/admin/games",
    loading: false,
    error: "",
  },
);
const emit = defineEmits<{
  (e: "submit", payload: GameFormData): void;
}>();

const form = reactive<GameFormData>({
  opponentTeamId: "",
  date: "",
  time: "",
  playgroundId: null as string | null,
  maxPlayers: DEFAULT_MAX_PLAYERS as number | null,
  competitionType: CompetitionType.FRIENDLY as CompetitionType,
  tournamentId: "",
  expectedUpdatedAt: "",
  participants: [],
});

watch(
  () => props.game,
  (game) => {
    if (!game) {
      form.opponentTeamId = "";
      form.date = "";
      form.time = "";
      form.playgroundId = null;
      form.maxPlayers = DEFAULT_MAX_PLAYERS;
      form.competitionType = CompetitionType.FRIENDLY;
      form.tournamentId = "";
      form.participants = [];
      return;
    }

    form.opponentTeamId = game.opponentTeamId ?? "";
    form.date = formatDateInput(game.date);
    form.time = formatTimeInput(game.date);
    form.playgroundId = game.playgroundId ?? null;
    form.maxPlayers = game.maxPlayers ?? DEFAULT_MAX_PLAYERS;
    form.competitionType = game.competitionType;
    form.tournamentId = game.tournamentId ?? "";
    form.participants = game.participants;
    form.expectedUpdatedAt = game.updatedAt ?? "";
  },
  { immediate: true },
);

const router = useRouter();
const { fetchTournaments } = useTournaments();
const { fetchOpponentTeams } = useOpponentTeams();
const { createGame } = useGames();

const [teamsData, tournamentData] = await Promise.all([
  fetchOpponentTeams(),
  fetchTournaments(),
]);

const loading = ref(false);
const error = ref("");

/**
 * Merges a date picker value (YYYY-MM-DD) and a time picker value (HH:mm)
 * into a full ISO 8601 datetime string with the browser's local UTC offset
 * (e.g. "2026-03-28T14:00:00-03:00"). This format is required by the API's
 * z.string().datetime({ offset: true }) validation. If no time is provided,
 * midnight (00:00) is used as the default.
 */
function buildIsoDateTime(date: string, time: string): string {
  const timeStr = time || "00:00";
  const local = new Date(`${date}T${timeStr}:00`);
  const offsetMin = -local.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const absMin = Math.abs(offsetMin);
  const hh = String(Math.floor(absMin / 60)).padStart(2, "0");
  const mm = String(absMin % 60).padStart(2, "0");
  return `${date}T${timeStr}:00${sign}${hh}:${mm}`;
}

async function handleSubmit() {
  error.value = "";
  loading.value = true;
  try {
    const body: GameCreatePayload = {
      opponentTeamId: form.opponentTeamId,
      date: buildIsoDateTime(form.date, form.time),
      competitionType: form.competitionType,
      playgroundId: form.playgroundId ?? null,
      maxPlayers: Number.isNaN(form.maxPlayers as any)
        ? null
        : (form.maxPlayers ?? null),
      participants: form.participants,
    };
    if (form.tournamentId) body.tournamentId = form.tournamentId;

    await createGame(body);
    await router.push("/admin/games");
  } catch (e: any) {
    error.value = e?.message ?? "No se pudo crear el partido.";
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <form @submit.prevent="handleSubmit">
    <div class="grid xl:grid-cols-6 gap-4">
      <div
        class="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4"
      >
        <p
          v-if="error"
          class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"
        >
          {{ error }}
        </p>
        <GameFormFields
          :form="form"
          :teamsData="teamsData"
          :tournament-data="tournamentData"
        />
      </div>
      <div class="xl:col-span-4">
        <div
          class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4"
        >
          <div class="mb-4">
            <h3 class="text-md font-semibold text-gray-800">Participantes</h3>
          </div>
          <GameParticipantsFields :form="form" />
        </div>
      </div>
    </div>
    <div class="flex gap-3 pt-2 justify-end">
      <div class="flex gap-3 pt-2 justify-end">
        <UButton
          type="submit"
          color="primary"
          variant="solid"
          size="md"
          :disabled="loading"
          class="font-semibold"
        >
          {{ loading ? "Guardando…" : "Guardar Partido" }}
        </UButton>
        <UButton to="/admin/games" variant="outline">Cancelar</UButton>
      </div>
    </div>
  </form>
</template>
