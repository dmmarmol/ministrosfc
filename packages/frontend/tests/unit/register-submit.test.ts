import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

const pushMock = vi.fn();
const routeState: { query: Record<string, string> } = { query: {} };
const authStoreMock = {
  isEditor: false,
  login: vi.fn(),
  register: vi.fn().mockResolvedValue(undefined),
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
        LoginForm: true,
        RegisterForm: {
          emits: ["submit"],
          props: ["loading", "error"],
          template:
            "<div><button data-testid=\"register-submit\" @click=\"$emit('submit', { firstName: 'Juan', lastName: 'Perez', email: 'j@test.com', password: 'Password1!', passwordConfirmation: 'Password1!', isPlayer: true })\">Register</button><span data-testid=\"register-error\">{{ error }}</span></div>",
        },
        GoogleSignInButton: true,
      },
    },
  });
}

describe("register submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeState.query = {};
    authStoreMock.isEditor = false;
  });

  it("calls authStore.register and redirects to /auth/onboarding", async () => {
    const wrapper = mountPage();

    // Switch to register mode
    await wrapper.find('button[type="button"]').trigger("click");

    // Submit register form
    await wrapper.find('[data-testid="register-submit"]').trigger("click");
    await vi.dynamicImportSettled();

    expect(authStoreMock.register).toHaveBeenCalledWith({
      firstName: "Juan",
      lastName: "Perez",
      email: "j@test.com",
      password: "Password1!",
      passwordConfirmation: "Password1!",
      isPlayer: true,
    });
    expect(pushMock).toHaveBeenCalledWith("/auth/onboarding");
  });

  it("shows error message when registration fails", async () => {
    authStoreMock.register.mockRejectedValueOnce(
      new Error("Este correo ya está registrado"),
    );

    const wrapper = mountPage();
    await wrapper.find('button[type="button"]').trigger("click");
    await wrapper.find('[data-testid="register-submit"]').trigger("click");
    await vi.dynamicImportSettled();

    expect(pushMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Este correo ya está registrado");
  });

  it("does NOT redirect to role-based page after register (always onboarding)", async () => {
    authStoreMock.isEditor = true;

    const wrapper = mountPage();
    await wrapper.find('button[type="button"]').trigger("click");
    await wrapper.find('[data-testid="register-submit"]').trigger("click");
    await vi.dynamicImportSettled();

    // Should go to onboarding, not /admin/dashboard
    expect(pushMock).toHaveBeenCalledWith("/auth/onboarding");
    expect(pushMock).not.toHaveBeenCalledWith("/admin/dashboard");
  });
});
