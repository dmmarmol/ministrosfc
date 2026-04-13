import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { ref } from "vue";

const pushMock = vi.fn();
const fetchStatusMock = vi.fn();
const completeOnboardingMock = vi.fn();

const authStoreMock = {
  isAuthenticated: true,
  isEditor: false,
  accessToken: "test-token",
  user: { onboardingCompletedAt: null as string | null },
};

vi.stubGlobal("definePageMeta", vi.fn());
vi.stubGlobal("navigateTo", vi.fn());
vi.stubGlobal("useRouter", () => ({ push: pushMock }));
vi.stubGlobal("useRoute", () => ({ query: {} }));
vi.stubGlobal("useRuntimeConfig", () => ({
  public: { apiBaseUrl: "http://localhost:5102" },
}));

vi.mock("../../src/stores/auth", () => ({
  useAuthStore: () => authStoreMock,
}));

vi.mock("../../src/composables/useOnboarding", () => ({
  useOnboarding: () => ({
    loading: { value: false },
    error: { value: "" },
    fetchStatus: fetchStatusMock,
    completeOnboarding: completeOnboardingMock,
  }),
}));

vi.mock("../../src/composables/useJerseyAvailability", () => ({
  useJerseyAvailability: () => ({
    taken: ref([]),
    fetch: vi.fn().mockResolvedValue(undefined),
  }),
}));

const { default: OnboardingPage } =
  await import("../../src/pages/auth/onboarding.vue");

function mountPage() {
  return mount(OnboardingPage);
}

describe("onboarding page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStoreMock.isAuthenticated = true;
    authStoreMock.isEditor = false;
    authStoreMock.user = { onboardingCompletedAt: null };
    fetchStatusMock.mockResolvedValue({ needsOnboarding: true });
    completeOnboardingMock.mockResolvedValue({
      user: { onboardingCompletedAt: "2026-01-01T00:00:00.000Z" },
    });
  });

  it("renders player checkbox defaulted to checked", async () => {
    const wrapper = mountPage();
    await flushPromises();
    const checkbox = wrapper.find("#isPlayer");
    expect(checkbox.exists()).toBe(true);
    expect((checkbox.element as HTMLInputElement).checked).toBe(true);
  });

  it("shows position and jersey fields when isPlayer is checked", async () => {
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.find("#position").exists()).toBe(true);
    expect(wrapper.find("#jerseyNumberInput").exists()).toBe(true);
  });

  it("hides position and jersey fields when isPlayer is unchecked", async () => {
    const wrapper = mountPage();
    await flushPromises();
    await wrapper.find("#isPlayer").setValue(false);
    expect(wrapper.find("#position").exists()).toBe(false);
    expect(wrapper.find("#jerseyNumberInput").exists()).toBe(false);
  });

  it("redirects to /login if not authenticated", async () => {
    authStoreMock.isAuthenticated = false;
    mountPage();
    await flushPromises();
    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
