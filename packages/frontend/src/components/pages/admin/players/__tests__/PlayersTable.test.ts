import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick, ref } from "vue";
import { PlayerStatus, PlayerType } from "@ministrosfc/shared";
import PlayersTable, { type AdminPlayer } from "../PlayersTable.vue";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("~/composables/useQueryParams", () => ({
  useQueryParams: () => ({ get: mocks.get }),
}));

vi.mock("~/stores/auth", () => ({
  useAuthStore: () => ({ isAdmin: false }),
}));

vi.mock("~/components/ui/Table/table-utils", async () => {
  const { h } = await import("vue");
  return {
    cellButton: (label: string, props: { to?: string }) =>
      h("a", { href: props.to }, label),
    cellLink: (label: string, to: string) => h("a", { href: to }, label),
    cellName: (label: string) => h("span", label),
    cellPosition: () => null,
    cellJerseyNumber: () => null,
  };
});

const player: AdminPlayer = {
  id: "player-1",
  firstName: "Juan",
  lastName: "Perez",
  nickname: null,
  address: null,
  playerType: PlayerType.GUEST,
  status: PlayerStatus.ACTIVE,
  invitedById: "player-2",
  invitedByName: "Pedro Gomez",
  position: null,
  jerseyNumber: null,
  dateOfBirth: null,
  height: null,
  dominantFoot: null,
  photoUrl: null,
  contactInfo: null,
  createdAt: "2026-11-04T00:00:00Z",
  updatedAt: "2026-11-04T00:00:00Z",
};

function mountTable() {
  return mount(PlayersTable, {
    props: { players: [player], loading: false },
  });
}

function editLinks(returnUrl: string) {
  return ["player-1", "player-2"].map(
    (id) =>
      `/admin/players/${id}/edit?returnUrl=${encodeURIComponent(returnUrl)}`,
  );
}

describe("PlayersTable return navigation", () => {
  beforeEach(() => {
    mocks.get.mockReset();
  });

  it.each([
    ["/admin/tournaments?year=2026", "/admin/tournaments?year=2026"],
    ["", "/admin/players"],
    ["//outside.example", "/admin/players"],
  ])(
    "uses the query return path %s for player and inviter links",
    (query, expected) => {
      mocks.get.mockReturnValue(query);
      const wrapper = mountTable();

      expect(wrapper.findAll("a").map((link) => link.attributes("href"))).toEqual(
        editLinks(expected),
      );
    },
  );

  it("updates edit links when the query return path changes", async () => {
    const returnUrl = ref("/admin/players");
    mocks.get.mockImplementation(() => returnUrl.value);
    const wrapper = mountTable();

    returnUrl.value = "/admin/tournaments";
    await nextTick();

    expect(wrapper.findAll("a").map((link) => link.attributes("href"))).toEqual(
      editLinks("/admin/tournaments"),
    );
  });
});
