<script setup lang="ts">
import { reactive } from "vue";
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
import GameAddParticipant from "./GameAddParticipant.vue";
import { useGames } from "~/composables/useGames";
import { useOpponentTeams } from "~/composables/useOpponentTeams";
import { useTournaments } from "~/composables/useTournaments";

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

const participantCount = computed(() => form.participants?.length);

function handleSubmit() {
  emit("submit", form);
  router.push("/admin/games");
}
</script>
<template>
  <form @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 max-w-full xl:grid-cols-6 gap-4">
      <div class="xl:col-span-2">
        <div
          class="bg-white justify-start rounded-xl shadow-sm border border-gray-100 p-6 space-y-4"
        >
          <p
            v-if="error"
            class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"
          >
            {{ error }}
          </p>
          <div class="flex flex-col gap-y-4">
            <GameFormFields
              :form="form"
              :teamsData="teamsData"
              :tournament-data="tournamentData"
            />
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
          </div>
          <hr class="border-gray-300" />
          <div>
            <GameAddParticipant :game="props.game" />
          </div>
        </div>
      </div>
      <div class="xl:col-span-4">
        <div
          class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4"
        >
          <div class="mb-4">
            <h3 class="text-md font-semibold text-gray-800">
              Participantes ({{ participantCount }})
            </h3>
          </div>
          <GameParticipantsFields
            :form="form"
            :game-id="props.game?.id ?? null"
          />
        </div>
      </div>
    </div>
  </form>
</template>
