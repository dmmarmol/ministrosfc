/**
 * Unit tests: top-scorers page filtering logic
 *
 * Covers:
 * - filteredScorers: client-side text search across player names
 * - tableRows: rank assignment, name concatenation, goalRate calculation
 * - Auth-gated filter components: TournamentSelect + PlayerStatusSelect only shown when authenticated
 * - YearSelect always rendered regardless of auth state
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import {
  ref,
  computed,
  watch,
  watchEffect,
  defineComponent,
  h,
  resolveComponent,
} from "vue";

// ── Vue auto-import shims (Nuxt provides these as globals; Vitest does not) ───
vi.stubGlobal("ref", ref);
vi.stubGlobal("computed", computed);
vi.stubGlobal("watch", watch);
vi.stubGlobal("watchEffect", watchEffect);
vi.stubGlobal("h", h);
vi.stubGlobal("resolveComponent", resolveComponent);

// ── Auth store mock ───────────────────────────────────────────────────────────
const authStoreMock = { isAuthenticated: false };

vi.mock("../../src/stores/auth", () => ({
  useAuthStore: () => authStoreMock,
}));

// ── Nuxt globals ──────────────────────────────────────────────────────────────
vi.stubGlobal("definePageMeta", vi.fn());
vi.stubGlobal("useHead", vi.fn());

// ── Filter composable mock ────────────────────────────────────────────────────
const yearFilter = ref("");
const tournamentFilter = ref("");
const playerStatusFilter = ref("ACTIVE");

vi.stubGlobal("useStatsFilters", () => ({
  year: yearFilter,
  tournament: tournamentFilter,
  playerStatus: playerStatusFilter,
}));

// ── Data mock returned by useAsyncData ────────────────────────────────────────
let mockScorers: any[] = [];

vi.stubGlobal(
  "useAsyncData",
  (_key: string, fetcher: () => Promise<any>, _opts?: any) => {
    const data = ref<any>({ data: mockScorers });
    const pending = ref(false);
    const refresh = vi.fn(async () => {
      data.value = await fetcher();
    });
    return { data, pending, refresh };
  },
);

vi.stubGlobal("useNuxtApp", () => ({
  $api: vi.fn(async () => ({ data: mockScorers })),
}));

// ── Filter component stubs ────────────────────────────────────────────────────
vi.stubGlobal("useStatisticsAvailableYears", () => ({
  availableYears: { value: [] },
}));
vi.stubGlobal("useStatisticsAvailableTournaments", () => ({
  availableTournaments: { value: [] },
}));

// ── Vue-router stubs (needed by useQueryParams inside useStatsFilters in full tree) ─
vi.mock("vue-router", () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}));

// ── Lazy import after all stubs ───────────────────────────────────────────────
const { default: TopScorersPage } =
  await import("../../src/pages/statistics/top-scorers.vue");

// ─────────────────────────────────────────────────────────────────────────────

const player = (
  firstName: string,
  lastName: string,
  goals = 5,
  appearances = 10,
) => ({
  player: { id: `${firstName}-${lastName}`, firstName, lastName },
  goalsScored: goals,
  assists: 1,
  appearances,
});

const stubs = {
  YearSelect: {
    name: "YearSelect",
    template: '<select data-testid="year-filter" />',
    props: ["modelValue"],
    emits: ["update:modelValue"],
  },
  TournamentSelect: {
    name: "TournamentSelect",
    template: '<select data-testid="tournament-filter" />',
    props: ["modelValue"],
    emits: ["update:modelValue"],
  },
  UiPlayerStatusSelect: {
    name: "UiPlayerStatusSelect",
    template: '<select data-testid="player-status-filter" />',
    props: ["modelValue"],
    emits: ["update:modelValue"],
  },
  StatsRanked: {
    name: "StatsRanked",
    template: "<div data-testid='ranked'></div>",
    props: ["items", "metrics", "loading"],
  },
  NuxtLink: {
    template: "<a><slot /></a>",
    props: ["to"],
  },
};

async function mountPage() {
  const Wrapper = defineComponent({
    components: { TopScorersPage },
    template: "<Suspense><TopScorersPage /></Suspense>",
  });
  const wrapper = mount(Wrapper, { global: { stubs } });
  await flushPromises();
  return wrapper;
}

describe("top-scorers page — auth-gated filter visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockScorers = [];
    yearFilter.value = "";
    tournamentFilter.value = "";
    playerStatusFilter.value = "ACTIVE";
  });

  it("YearSelect is always rendered when user is NOT authenticated", async () => {
    authStoreMock.isAuthenticated = false;
    const wrapper = await mountPage();
    expect(wrapper.find('[data-testid="year-filter"]').exists()).toBe(true);
  });

  it("YearSelect is always rendered when user IS authenticated", async () => {
    authStoreMock.isAuthenticated = true;
    const wrapper = await mountPage();
    expect(wrapper.find('[data-testid="year-filter"]').exists()).toBe(true);
  });

  it("TournamentSelect is hidden when NOT authenticated", async () => {
    authStoreMock.isAuthenticated = false;
    const wrapper = await mountPage();
    expect(wrapper.find('[data-testid="tournament-filter"]').exists()).toBe(
      false,
    );
  });

  it("TournamentSelect is visible when authenticated", async () => {
    authStoreMock.isAuthenticated = true;
    const wrapper = await mountPage();
    expect(wrapper.find('[data-testid="tournament-filter"]').exists()).toBe(
      true,
    );
  });

  it("PlayerStatusSelect is hidden when NOT authenticated", async () => {
    authStoreMock.isAuthenticated = false;
    const wrapper = await mountPage();
    expect(wrapper.find('[data-testid="player-status-filter"]').exists()).toBe(
      false,
    );
  });

  it("PlayerStatusSelect is visible when authenticated", async () => {
    authStoreMock.isAuthenticated = true;
    const wrapper = await mountPage();
    expect(wrapper.find('[data-testid="player-status-filter"]').exists()).toBe(
      true,
    );
  });
});

describe("top-scorers page — filteredScorers text search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStoreMock.isAuthenticated = false;
    yearFilter.value = "";
    tournamentFilter.value = "";
    playerStatusFilter.value = "ACTIVE";
    mockScorers = [
      player("Juan", "Pérez", 10, 15),
      player("Carlos", "García", 7, 12),
      player("Luis", "Rodríguez", 3, 8),
    ];
  });

  it("shows all rows when search input is empty", async () => {
    const wrapper = await mountPage();
    const input = wrapper.find('input[type="search"]');
    expect((input.element as HTMLInputElement).value).toBe("");
    const table = wrapper.findComponent({ name: "StatsRanked" });
    expect(table.props("items")).toHaveLength(3);
  });

  it("filters rows by first name (case-insensitive)", async () => {
    const wrapper = await mountPage();
    await wrapper.find('input[type="search"]').setValue("juan");
    const table = wrapper.findComponent({ name: "StatsRanked" });
    expect(table.props("items")).toHaveLength(1);
    expect(table.props("items")[0].subtitle).toContain("Juan");
  });

  it("filters rows by last name", async () => {
    const wrapper = await mountPage();
    await wrapper.find('input[type="search"]').setValue("García");
    const table = wrapper.findComponent({ name: "StatsRanked" });
    expect(table.props("items")).toHaveLength(1);
    expect(table.props("items")[0].title).toBe("García");
  });

  it("returns empty rows when search matches no player", async () => {
    const wrapper = await mountPage();
    await wrapper.find('input[type="search"]').setValue("Messi");
    const table = wrapper.findComponent({ name: "StatsRanked" });
    expect(table.props("items")).toHaveLength(0);
  });

  it("search by full name works (first + last)", async () => {
    const wrapper = await mountPage();
    await wrapper.find('input[type="search"]').setValue("Luis Rodríguez");
    const table = wrapper.findComponent({ name: "StatsRanked" });
    expect(table.props("items")).toHaveLength(1);
  });

  it("leading/trailing whitespace in search is trimmed", async () => {
    const wrapper = await mountPage();
    await wrapper.find('input[type="search"]').setValue("  juan  ");
    const table = wrapper.findComponent({ name: "StatsRanked" });
    expect(table.props("items")).toHaveLength(1);
  });
});

describe("top-scorers page — ranked items and goal rate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStoreMock.isAuthenticated = false;
    mockScorers = [
      player("Ana", "López", 6, 12), // goalRate = 0.5
      player("Pedro", "Martínez", 0, 5), // goalRate = 0
    ];
  });

  async function items() {
    const wrapper = await mountPage();
    return wrapper.findComponent({ name: "StatsRanked" }).props("items");
  }

  it("keeps the order the API returns (ranking is shown by the list)", async () => {
    const rows = await items();
    expect(rows.map((r: any) => r.title)).toEqual(["López", "Martínez"]);
  });

  it("shows last name as title and first name as subtitle", async () => {
    const [first] = await items();
    expect(first.title).toBe("López");
    expect(first.subtitle).toBe("Ana");
  });

  it("goal rate is goalsScored / appearances", async () => {
    const [first] = await items();
    expect(first.values.rate).toBeCloseTo(0.5);
  });

  it("goal rate is 0 when appearances is 0 (avoids division by zero)", async () => {
    mockScorers = [player("Solo", "Banca", 3, 0)];
    const [first] = await items();
    expect(first.values.rate).toBe(0);
  });

  it("goals, assists and games are passed through as-is", async () => {
    const [first] = await items();
    expect(first.values).toMatchObject({ goals: 6, assists: 1, games: 12 });
  });

  it("links each row to the player profile", async () => {
    const [first] = await items();
    expect(first.to).toBe("/players/Ana-López");
  });

  it("offers goals, assists, games and goal rate as ranking metrics", async () => {
    const wrapper = await mountPage();
    const keys = wrapper
      .findComponent({ name: "StatsRanked" })
      .props("metrics")
      .map((m: any) => m.key);
    expect(keys).toEqual(["goals", "assists", "games", "rate"]);
  });
});
