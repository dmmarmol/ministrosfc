import { defineStore } from "pinia";
import { type GameParticipant, type Game } from "@ministrosfc/shared";

interface AdminGamesState {
  selectedGame: Game | null;
  selectedParticipantId: string | null;
  confirmationModalOpen: boolean;
}

export const useAdminGamesStore = defineStore("admin-games", {
  state: (): AdminGamesState => ({
    selectedGame: null,
    selectedParticipantId: null,
    confirmationModalOpen: false,
  }),
  getters: {
    getParticipantFromGame: (state) => (participantId: string | null) => {
      return (
        state.selectedGame?.participants.find((p) => p.id === participantId) ??
        null
      );
    },
    isGameParticipantsFull: (state) => {
      if (!state.selectedGame) return false;
      if (typeof state.selectedGame.maxPlayers !== "number") return false;
      return (
        state.selectedGame.participants.length >= state.selectedGame.maxPlayers
      );
    },
  },
  actions: {
    setSelectedGame(game: Game | null) {
      this.selectedGame = game;
    },
    setSelectedParticipantId(participantId: string | null) {
      this.selectedParticipantId = participantId;
    },
    askRemoveParticipant(participantId: string) {
      this.setSelectedParticipantId(participantId);
      this.confirmationModalOpen = true;
    },
    cancelRemoveParticipant() {
      this.setSelectedParticipantId(null);
      this.confirmationModalOpen = false;
    },
  },
});
