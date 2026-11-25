import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { CompetitionType, GameStatus, type AdminGame } from "@ministrosfc/shared";

const mocks = vi.hoisted(() => ({ routerPush: vi.fn() }));
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

import RecentGamesTable from "~/components/pages/admin/dashboard/RecentGamesTable.vue";

const UTableStub = defineComponent({
  name: "UTable",
  props: {
    columns: { type: Array, required: true },
    data: { type: Array, required: true },
  },
  template: "<div data-testid='recent-games-table'></div>",
});

function game(): AdminGame {
  return {
    id: "game-123",
    opponentTeamId: "team-123",
    opponentTeam: { id: "team-123", name: "Racing" },
    tournamentId: "tournament-123",
    tournament: { id: "tournament-123", name: "Liga" },
    date: "2026-10-30T18:00:00.000Z",
    competitionType: CompetitionType.LEAGUE,
    status: GameStatus.COMPLETED,
    maxPlayers: null,
    participants: [],
    slug: "racing",
    lineup: null,
    endDate: "2026-10-30T19:40:00.000Z",
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
    confirmedCount: 0,
  };
}

describe("dashboard recent games", () => {
  it("uses a table with date, participants, competition, status, and edit action columns", () => {
    const wrapper = mount(RecentGamesTable, {
      props: { games: [game()] },
      global: { stubs: { UTable: UTableStub } },
    });
    const columns = wrapper.findComponent(UTableStub).props("columns") as Array<{
      id?: string;
      accessorKey?: string;
    }>;

    expect(columns.map((column) => column.id ?? column.accessorKey)).toEqual(
      expect.arrayContaining([
        "date",
        "participants",
        "competition",
        "status",
        "actions",
      ]),
    );
  });

  it("shows a clear Spanish empty state", () => {
    const wrapper = mount(RecentGamesTable, {
      props: { games: [] },
    });

    expect(wrapper.text()).toContain("No hay partidos recientes.");
  });

  it("opens the matching game detail from its edit action", () => {
    mocks.routerPush.mockReset();
    const wrapper = mount(RecentGamesTable, {
      props: { games: [game()] },
      global: { stubs: { UTable: UTableStub } },
    });
    const columns = wrapper.findComponent(UTableStub).props("columns") as Array<{
      id?: string;
      cell?: (context: {
        row: {
          original: AdminGame;
          getValue: (key: string) => unknown;
        };
      }) => unknown;
    }>;
    const actions = columns.find((column) => column.id === "actions");

    expect(actions).toBeDefined();
    const actionCell = actions?.cell?.({
      row: {
        original: game(),
        getValue: (key) => game()[key as keyof AdminGame],
      },
    }) as { props?: { items?: Array<{ label: string; onClick?: () => void }> } };
    const editAction = actionCell.props?.items?.find(
      (item) => item.label === "Editar partido",
    );

    expect(editAction).toBeDefined();
    editAction?.onClick?.();
    expect(mocks.routerPush).toHaveBeenCalledWith("/admin/games/game-123");
  });
});
