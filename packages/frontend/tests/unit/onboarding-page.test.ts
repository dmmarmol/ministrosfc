import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

const pushMock = vi.fn();
const fetchStatusMock = vi.fn();
const completeOnboardingMock = vi.fn();

const authStoreMock = {
  isAuthenticated: true,
  isEditor: false,
  accessToken: "test-token",
};

vi.stubGlobal("definePageMeta", vi.fn());
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

const { default: OnboardingPage } =
  await import("../../src/pages/auth/onboarding.vue");

function mountPage() {
  return mount(OnboardingPage, { shallow: true });
}

describe("onboarding page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStoreMock.isAuthenticated = true;
    authStoreMock.isEditor = false;
    fetchStatusMock.mockResolvedValue({ needsOnboarding: true });
    completeOnboardingMock.mockResolvedValue({ nextStep: "/profile" });
  });

  it("renders player checkbox defaulted to checked", () => {
    const wrapper = mountPage();
    const checkbox = wrapper.find("#isPlayer");
    expect(checkbox.exists()).toBe(true);
    expect((checkbox.element as HTMLInputElement).checked).toBe(true);
  });

  it("shows position and jersey fields when isPlayer is checked", () => {
    const wrapper = mountPage();
    expect(wrapper.find("#position").exists()).toBe(true);
    expect(wrapper.find("#jerseyNumber").exists()).toBe(true);
  });

  it("hides position and jersey fields when isPlayer is unchecked", async () => {
    const wrapper = mountPage();
    await wrapper.find("#isPlayer").setValue(false);
    expect(wrapper.find("#position").exists()).toBe(false);
    expect(wrapper.find("#jerseyNumber").exists()).toBe(false);
  });

  it("redirects to /login if not authenticated", async () => {
    authStoreMock.isAuthenticated = false;
    mountPage();
    await flushPromises();
    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
