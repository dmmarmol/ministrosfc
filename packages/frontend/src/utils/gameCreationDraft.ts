import type { CompetitionType } from "@ministrosfc/shared";

const STORAGE_KEY = "admin-game-creation-draft";

export interface GameCreationDraft {
  opponentTeamId: string;
  date: string;
  time: string;
  playgroundId: string | null;
  maxPlayers: number | null;
  competitionType: CompetitionType;
  tournamentId: string;
  participantIds: string[];
  newOpponentTeamId?: string;
  returnUrl?: string;
}

interface GameCreationDraftInput {
  opponentTeamId?: string;
  date?: string;
  time?: string;
  playgroundId?: string | null;
  maxPlayers?: number | null;
  competitionType?: CompetitionType;
  tournamentId?: string;
  participantIds?: readonly string[];
  participants?: readonly { playerId: string }[];
  returnUrl?: string;
}

function readStoredDraft(): GameCreationDraft | null {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as GameCreationDraft;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveGameCreationDraft(input: GameCreationDraftInput): void {
  const draft: GameCreationDraft = {
    opponentTeamId: input.opponentTeamId ?? "",
    date: input.date ?? "",
    time: input.time ?? "",
    playgroundId: input.playgroundId ?? null,
    maxPlayers: input.maxPlayers ?? null,
    competitionType: input.competitionType ?? "FRIENDLY",
    tournamentId: input.tournamentId ?? "",
    participantIds:
      input.participantIds?.slice() ??
      (input.participants ?? []).map((participant) => participant.playerId),
    returnUrl: input.returnUrl,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function attachCreatedTeamToGameDraft(teamId: string): void {
  const draft = readStoredDraft();
  if (!draft) return;

  draft.newOpponentTeamId = teamId;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function consumeGameCreationDraft(): GameCreationDraft | null {
  const draft = readStoredDraft();
  sessionStorage.removeItem(STORAGE_KEY);
  return draft;
}
