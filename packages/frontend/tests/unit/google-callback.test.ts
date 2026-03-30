import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

const pushMock = vi.fn();
const setTokensMock = vi.fn();
const fetchStatusMock = vi.fn();

const routeQuery: Record<string, string | undefined> = {};

vi.stubGlobal("definePageMeta", vi.fn());
vi.stubGlobal("navigateTo", vi.fn());
vi.stubGlobal("useRuntimeConfig", () => ({
  public: { apiBaseUrl: "http://localhost:5102" },
}));
vi.stubGlobal("$fetch", vi.fn());
vi.stubGlobal("atob", (s: string) => Buffer.from(s, "base64").toString());

vi.mock("vue-router", () => ({
  useRoute: () => ({ query: routeQuery }),
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("../../src/composables/useRuntime", () => ({
  useRuntime: () => ({ isClient: true, isServer: false }),
}));

const authStoreMock = {
  isAuthenticated: false,
  isEditor: false,
  accessToken: null as string | null,
  refreshToken: null as string | null,
  setTokens: setTokensMock,
};

vi.mock("../../src/stores/auth", () => ({
  useAuthStore: () => authStoreMock,
}));

vi.mock("../../src/composables/useOnboarding", () => ({
  useOnboarding: () => ({
    fetchStatus: fetchStatusMock,
  }),
}));

function encodeJwtPayload(payload: Record<string, unknown>) {
  const json = JSON.stringify(payload);
  return `header.${Buffer.from(json).toString("base64")}.signature`;
}

const { default: CallbackPage } =
  await import("../../src/pages/auth/google/callback.vue");

describe("Google callback page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(routeQuery).forEach((k) => delete routeQuery[k]);
    authStoreMock.accessToken = null;
    authStoreMock.refreshToken = null;
    authStoreMock.isEditor = false;
  });

  it("redirects to /login with error param when Google returns an error", async () => {
    routeQuery.error = "google_cancelled";

    mount(CallbackPage, { shallow: true });
    await flushPromises();

    const navigateTo = vi.mocked(globalThis.navigateTo);
    expect(navigateTo).toHaveBeenCalledWith("/login?error=google_cancelled");
  });

  it("redirects to /login?error=google_failed when tokens are missing", async () => {
    // No token or refresh in query
    mount(CallbackPage, { shallow: true });
    await flushPromises();

    const navigateTo = vi.mocked(globalThis.navigateTo);
    expect(navigateTo).toHaveBeenCalledWith("/login?error=google_failed");
  });

  it("stores tokens and fetches user profile on valid callback", async () => {
    const token = encodeJwtPayload({ userId: "u1", role: "PLAYER" });
    routeQuery.token = token;
    routeQuery.refresh = "refresh-abc";

    const mockFetch = vi.mocked(globalThis.$fetch);
    mockFetch.mockResolvedValueOnce({
      data: {
        user: {
          id: "u1",
          firstName: "Carlos",
          lastName: "Gómez",
          email: "carlos@test.com",
          role: "PLAYER",
          playerId: null,
          onboardingCompletedAt: null,
        },
      },
    });

    mount(CallbackPage, { shallow: true });
    await flushPromises();

    // Should store preliminary tokens
    expect(authStoreMock.accessToken).toBe(token);
    expect(authStoreMock.refreshToken).toBe("refresh-abc");
  });
});
