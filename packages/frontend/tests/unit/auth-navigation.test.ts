/**
 * T034 unit tests: back button presence and navigation logic
 * Covers: login page back button → /, onboarding back button → /login
 * Also validates open redirect prevention in onboarding (T038 / T035A)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── Source-level tests ────────────────────────────────────────────────────────

describe("BackButton component source (T039)", () => {
  const src = readFileSync(
    resolve(__dirname, "../../src/components/ui/BackButton.vue"),
    "utf8",
  );

  it("exists as a UI component", () => {
    expect(src).toBeTruthy();
  });

  it("accepts a 'to' prop used as the NuxtLink target", () => {
    expect(src).toContain(":to");
    expect(src).toContain("props.to");
  });

  it("has an accessible aria-label", () => {
    expect(src).toContain("aria-label");
  });

  it("renders a visible label text", () => {
    expect(src).toContain("props.label");
  });
});

describe("login page back button source (T036)", () => {
  const src = readFileSync(
    resolve(__dirname, "../../src/pages/login.vue"),
    "utf8",
  );

  it("imports BackButton", () => {
    expect(src).toContain("BackButton");
  });

  it("places BackButton pointing at /", () => {
    expect(src).toContain('to="/"');
  });
});

describe("onboarding back button source (T037)", () => {
  const src = readFileSync(
    resolve(__dirname, "../../src/pages/auth/onboarding.vue"),
    "utf8",
  );

  it("imports BackButton", () => {
    expect(src).toContain("BackButton");
  });

  it("uses computed backPath for the back destination", () => {
    expect(src).toContain("backPath");
    expect(src).toContain(":to=\"backPath\"");
  });
});

describe("onboarding open redirect prevention source (T038 / T035A)", () => {
  const src = readFileSync(
    resolve(__dirname, "../../src/pages/auth/onboarding.vue"),
    "utf8",
  );

  it("validates redirect param before navigating (allows relative paths)", () => {
    // The source must include a regex or explicit check that prevents external URLs
    expect(src).toMatch(/\/\^\\\//);
  });

  it("falls back to /login when redirect is an external URL", () => {
    expect(src).toContain('"/login"');
  });
});

// ── Runtime tests ─────────────────────────────────────────────────────────────

const routeState = { query: {} };
vi.stubGlobal("definePageMeta", vi.fn());
vi.stubGlobal("useRouter", () => ({ push: vi.fn() }));
vi.stubGlobal("useRoute", () => routeState);
vi.stubGlobal("useRuntimeConfig", () => ({
  public: { apiBaseUrl: "http://localhost:5102" },
}));
vi.stubGlobal("navigateTo", vi.fn());

vi.mock("../../src/stores/auth", () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    isEditor: false,
    needsOnboarding: false,
    user: { id: "u1" },
    loadFromStorage: vi.fn(),
  }),
}));

vi.mock("../../src/composables/useOnboarding", () => ({
  useOnboarding: () => ({
    loading: { value: false },
    error: { value: null },
    fetchStatus: vi.fn().mockResolvedValue({ needsOnboarding: false }),
    completeOnboarding: vi.fn(),
  }),
}));

vi.mock("../../src/composables/useJerseyAvailability", () => ({
  useJerseyAvailability: () => ({
    taken: { value: [] },
    fetch: vi.fn(),
  }),
}));

const { default: BackButton } = await import(
  "../../src/components/ui/BackButton.vue"
);
const { default: LoginPage } = await import("../../src/pages/login.vue");

describe("BackButton component runtime (T039)", () => {
  it("renders the label text", () => {
    const wrapper = mount(BackButton, {
      props: { to: "/", label: "Volver al sitio" },
      global: { stubs: { NuxtLink: { template: "<a><slot /></a>" } } },
    });
    expect(wrapper.text()).toContain("Volver al sitio");
  });

  it("defaults to to='/' and label='Volver'", () => {
    const wrapper = mount(BackButton, {
      global: { stubs: { NuxtLink: { props: ["to"], template: "<a :href='to'><slot /></a>" } } },
    });
    expect(wrapper.find("a").attributes("href")).toBe("/");
    expect(wrapper.text()).toContain("Volver");
  });
});

describe("login page back button runtime (T036)", () => {
  it("renders a back link pointing to '/'", () => {
    routeState.query = {};
    const wrapper = mount(LoginPage, {
      global: {
        stubs: {
          NuxtLink: {
            props: ["to"],
            template: "<a :data-to='to'><slot /></a>",
          },
          LoginForm: { template: "<div />" },
          RegisterForm: { template: "<div />" },
          GoogleSignInButton: { template: "<div />" },
          BackButton: false, // use real component
        },
      },
    });
    // Find a NuxtLink/anchor pointing to "/"
    const anchors = wrapper.findAll("[data-to]");
    const backAnchor = anchors.find((a) => a.attributes("data-to") === "/");
    expect(backAnchor).toBeDefined();
  });
});
