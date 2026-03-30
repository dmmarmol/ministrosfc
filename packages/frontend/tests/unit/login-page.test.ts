import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

const pushMock = vi.fn();
const routeState: { query: Record<string, string> } = { query: {} };
const authStoreMock = {
  isEditor: false,
  login: vi.fn(),
  register: vi.fn(),
};

vi.stubGlobal("definePageMeta", vi.fn());
vi.stubGlobal("useRouter", () => ({ push: pushMock }));
vi.stubGlobal("useRoute", () => routeState);

vi.mock("../../src/stores/auth", () => ({
  useAuthStore: () => authStoreMock,
}));

const { default: LoginPage } = await import("../../src/pages/login.vue");

function mountPage() {
  return mount(LoginPage, {
    global: {
      stubs: {
        LoginForm: {
          emits: ["submit"],
          template:
            "<button data-testid=\"login-form\" @click=\"$emit('submit', { email: 'u@test.com', password: 'Password1!' })\">Login Form</button>",
        },
        RegisterForm: {
          emits: ["submit"],
          template:
            "<button data-testid=\"register-form\" @click=\"$emit('submit', { firstName: 'Juan', lastName: 'Perez', email: 'u@test.com', password: 'Password1!', passwordConfirmation: 'Password1!', isPlayer: true })\">Register Form</button>",
        },
        GoogleSignInButton: {
          template: '<div data-testid="google-signin">Google</div>',
        },
      },
    },
  });
}

describe("login page mode toggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeState.query = {};
    authStoreMock.isEditor = false;
  });

  it("shows login mode by default and keeps Google sign-in visible", () => {
    const wrapper = mountPage();

    expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="register-form"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="google-signin"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("¿No tenés cuenta? Registrate");
  });

  it("switches to register mode and back when toggle is clicked", async () => {
    const wrapper = mountPage();

    const toggle = wrapper.find('button[type="button"]');
    await toggle.trigger("click");

    expect(wrapper.find('[data-testid="register-form"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("¿Ya tenés cuenta? Iniciá sesión");

    await toggle.trigger("click");

    expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="register-form"]').exists()).toBe(false);
  });

  it("starts in register mode when query mode=register", async () => {
    routeState.query = { mode: "register" };

    const wrapper = mountPage();
    await Promise.resolve();

    expect(wrapper.find('[data-testid="register-form"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="google-signin"]').exists()).toBe(true);
  });
});
