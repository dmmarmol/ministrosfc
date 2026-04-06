import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

const pushMock = vi.fn();
const routeState: { query: Record<string, string> } = { query: {} };
const authStoreMock = {
  isEditor: false,
  login: vi.fn().mockResolvedValue(undefined),
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
            '<button data-testid="login-submit" @click="$emit(\'submit\', { email: \'legacy@test.com\', password: \'Password1!\' })">Login</button>',
        },
        RegisterForm: true,
        GoogleSignInButton: true,
      },
    },
  });
}

describe("login regression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeState.query = {};
    authStoreMock.isEditor = false;
  });

  it("keeps legacy email/password login flow working", async () => {
    const wrapper = mountPage();

    await wrapper.find('[data-testid="login-submit"]').trigger("click");

    expect(authStoreMock.login).toHaveBeenCalledWith(
      "legacy@test.com",
      "Password1!",
    );
    expect(pushMock).toHaveBeenCalledWith("/player/games");
  });
});
