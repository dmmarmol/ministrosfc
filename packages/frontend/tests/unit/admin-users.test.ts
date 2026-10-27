/**
 * Unit tests for admin UserRoleManager component
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mockApi = vi.fn();
const toastAddMock = vi.fn();

vi.stubGlobal("definePageMeta", vi.fn());
vi.stubGlobal("useNuxtApp", () => ({ $api: mockApi }));
vi.stubGlobal("useRuntimeConfig", () => ({
  public: { apiBaseUrl: "http://localhost:5102" },
}));
vi.stubGlobal("alert", vi.fn());

vi.mock("@nuxt/ui/composables", () => ({
  useToast: () => ({ add: toastAddMock }),
}));

// Mock useAuthStore with a non-admin current user for self-demotion tests
const mockAuthStore = { user: { id: "current-admin", role: "ADMIN" } };
vi.mock("~/stores/auth", () => ({
  useAuthStore: () => mockAuthStore,
}));

const { default: UserRoleManager } =
  await import("../../src/components/admin/UserRoleManager.vue");

const mockUsers = [
  {
    id: "u1",
    email: "admin@test.com",
    firstName: "Admin",
    lastName: "User",
    role: "ADMIN",
    createdAt: "2025-01-01T00:00:00.000Z",
    lastLoginAt: "2025-03-01T00:00:00.000Z",
    player: null,
  },
  {
    id: "u2",
    email: "player@test.com",
    firstName: "Carlos",
    lastName: "Gómez",
    role: "PLAYER",
    createdAt: "2025-02-01T00:00:00.000Z",
    lastLoginAt: null,
    player: { id: "p1", status: "ACTIVE", jerseyNumber: 10, photoUrl: null },
  },
];

describe("UserRoleManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue({
      data: mockUsers,
      meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
    });
  });

  it("renders user list after fetching", async () => {
    const wrapper = mount(UserRoleManager, { shallow: true });
    await flushPromises();

    expect(mockApi).toHaveBeenCalled();
    const usersTable = wrapper.findComponent({ name: "UsersTable" });
    const usersProp = usersTable.props("users") as typeof mockUsers;
    expect(usersProp.map((u) => `${u.firstName} ${u.lastName}`)).toEqual([
      "Admin User",
      "Carlos Gómez",
    ]);
  });

  it("renders search input and role filter", async () => {
    const wrapper = mount(UserRoleManager, { shallow: true });
    await flushPromises();

    expect(wrapper.find("u-input-stub").exists()).toBe(true);
    expect(wrapper.find("ui-user-role-select-stub").exists()).toBe(true);
  });

  it("passes fetched users into UsersTable", async () => {
    const wrapper = mount(UserRoleManager, { shallow: true });
    await flushPromises();

    const usersTable = wrapper.findComponent({ name: "UsersTable" });
    expect(usersTable.exists()).toBe(true);
    const usersProp = usersTable.props("users") as typeof mockUsers;
    expect(usersProp.map((u) => u.role)).toEqual(["ADMIN", "PLAYER"]);
  });

  it("shows error message on fetch failure", async () => {
    mockApi.mockRejectedValueOnce(new Error("Network error"));
    const wrapper = mount(UserRoleManager, { shallow: true });
    await flushPromises();

    expect(wrapper.text()).toContain("Network error");
  });
});

// T008: Inline profile edit handlers and confirmation logic
describe("UserRoleManager – full-name edit entry (T008)", () => {
  const sourcePath = resolve(
    __dirname,
    "../../src/components/admin/UserRoleManager.vue",
  );
  const source = readFileSync(sourcePath, "utf8");

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue({
      data: mockUsers,
      meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
    });
  });

  it("startEdit stores user id and pre-fills editable fields", () => {
    expect(source).toContain("function startEdit(user: AdminUserListItem)");
    expect(source).toContain("editingUserId.value = user.id");
    expect(source).toContain("firstName: user.firstName");
    expect(source).toContain("lastName: user.lastName");
    expect(source).toContain("email: user.email");
  });

  it("email changes are confirmation-gated before patching", () => {
    expect(source).toContain("actionType: \"edit-email\"");
    expect(source).toContain("title: \"Cambiar email\"");
    expect(source).toContain("requestConfirmation(");
    expect(source).toContain("await $api(`/api/v1/admin/users/${userId}`");
  });

  it("non-email edits patch only profile names and show success toast", () => {
    expect(source).toContain("firstName: editFields.value.firstName");
    expect(source).toContain("lastName: editFields.value.lastName");
    expect(source).toContain('description: "Perfil actualizado."');
  });

  it("cancelEdit exits edit mode", () => {
    expect(source).toContain("function cancelEdit()");
    expect(source).toContain("editingUserId.value = null");
  });
});

// T008A: UI-level access control
describe("UserRoleManager – access control (T008A)", () => {
  const sourcePath = resolve(
    __dirname,
    "../../src/components/admin/UserRoleManager.vue",
  );
  const source = readFileSync(sourcePath, "utf8");
  const pagePath = resolve(__dirname, "../../src/pages/admin/users/index.vue");
  const pageSource = readFileSync(pagePath, "utf8");

  it("admin users page declares correct middleware and requiresRole", () => {
    expect(pageSource).toContain('middleware: "auth"');
    expect(pageSource).toContain('requiresRole: "editor"');
    expect(pageSource).toContain("requiresAuth: true");
  });

  it("component uses useAuthStore to access current user", () => {
    expect(source).toContain("useAuthStore");
    expect(source).toContain("authStore.user");
  });
});

// T016: Role option visibility, confirmation gate, self-demotion prevention
describe("UserRoleManager – role governance UI (T016)", () => {
  const managerSourcePath = resolve(
    __dirname,
    "../../src/components/admin/UserRoleManager.vue",
  );
  const usersTableSourcePath = resolve(
    __dirname,
    "../../src/components/admin/UsersTable.vue",
  );
  const source = readFileSync(managerSourcePath, "utf8");
  const usersTableSource = readFileSync(usersTableSourcePath, "utf8");

  it("does NOT gate role select with v-if restricting ADMIN role", () => {
    // Old pattern was: v-if="user.role !== 'ADMIN'" – must not exist
    expect(source).not.toContain("v-if=\"user.role !== 'ADMIN'\"");
  });

  it("role changes are emitted from UsersTable as typed role updates", () => {
    expect(usersTableSource).toContain('emit("roleChange", user, value as UserRole)');
    expect(usersTableSource).toContain("if (!value || value === user.role) return;");
  });

  it("role select is disabled when user.id matches current user id", () => {
    expect(usersTableSource).toContain(
      "const isSelfRoleChange = user.id === props.currentUserId;",
    );
    expect(usersTableSource).toContain("disabled: isSelfRoleChange");
  });

  it("disabled role select has a descriptive title tooltip", () => {
    expect(usersTableSource).toContain("No podés cambiar tu propio rol");
  });

  it("routes role change through requestRoleChange (confirmation-gated)", () => {
    expect(source).toContain("requestRoleChange(");
    expect(source).not.toContain('@change="changeRole(');
  });

  it("uses requestConfirmation for non-idempotent role changes", () => {
    expect(source).toContain("requestConfirmation(");
  });

  it("skips confirmation for idempotent role change (same role)", () => {
    // requestRoleChange has early return when user.role === newRole
    expect(source).toContain("if (user.role === newRole) return;");
  });

  it("does not use native alert for role change errors", () => {
    expect(source).not.toContain(
      'alert(e?.data?.message ?? "Error al cambiar rol"',
    );
  });
});

describe("UserRoleManager – confirmation modal mounting (T016 runtime)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue({
      data: [
        {
          id: "u3",
          email: "editor@test.com",
          firstName: "Editor",
          lastName: "Uno",
          role: "EDITOR",
          createdAt: "2025-01-01T00:00:00.000Z",
          lastLoginAt: null,
          player: null,
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
  });

  it("shows ConfirmationModal when a role change is requested", async () => {
    const wrapper = mount(UserRoleManager, { shallow: true });
    await flushPromises();

    const usersTable = wrapper.findComponent({ name: "UsersTable" });
    expect(usersTable.exists()).toBe(true);
    await usersTable.vm.$emit("role-change", mockUsers[1], "ADMIN");
    await flushPromises();

    const modal = wrapper.findComponent({ name: "ConfirmationModal" });
    expect(modal.exists()).toBe(true);
    expect(modal.props("open")).toBe(true);
  });

  it("passes current user id into UsersTable for self-role lock", async () => {
    const wrapper = mount(UserRoleManager, { shallow: true });
    await flushPromises();
    const usersTable = wrapper.findComponent({ name: "UsersTable" });
    expect(usersTable.props("currentUserId")).toBe("current-admin");
  });
});

// T016A: Unauthorized action denial
describe("UserRoleManager – source: no direct mutation without confirmation (T016A)", () => {
  const sourcePath = resolve(
    __dirname,
    "../../src/components/admin/UserRoleManager.vue",
  );
  const source = readFileSync(sourcePath, "utf8");

  it("no alert() calls remain for role/status/delete errors", () => {
    // All error handling should use showToast, not alert
    expect(source).not.toMatch(/alert\(e|\balert\(/);
  });

  it("toggle-status uses requestStatusToggle, not direct toggleStatus", () => {
    expect(source).toContain("requestStatusToggle(");
    expect(source).not.toContain('@click="toggleStatus(');
  });

  it("delete uses confirmDelete which calls requestConfirmation", () => {
    expect(source).toContain("requestConfirmation(");
    expect(source).toContain("confirmDelete(");
  });
});

// T023: Lifecycle actions confirmation (status toggle + delete)
describe("UserRoleManager – lifecycle confirmation (T023)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue({
      data: mockUsers,
      meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
    });
  });

  it("source: status toggle routes through requestStatusToggle", () => {
    const source = readFileSync(
      resolve(__dirname, "../../src/components/admin/UserRoleManager.vue"),
      "utf8",
    );
    expect(source).toContain("function requestStatusToggle(user: AdminUserListItem)");
    expect(source).toContain("requestConfirmation(");
    expect(source).toContain("/player-status");
  });

  it("source: delete routes through confirmDelete and requestConfirmation", () => {
    const source = readFileSync(
      resolve(__dirname, "../../src/components/admin/UserRoleManager.vue"),
      "utf8",
    );
    expect(source).toContain("function confirmDelete(user: AdminUserListItem)");
    expect(source).toContain("requestConfirmation(");
    expect(source).toContain("method: \"DELETE\"");
  });

  it("source: toggle-status confirmation message mentions player name", () => {
    const source = readFileSync(
      resolve(__dirname, "../../src/components/admin/UserRoleManager.vue"),
      "utf8",
    );
    expect(source).toContain("Desactivar jugador");
    expect(source).toContain("Activar jugador");
    expect(source).toContain("impedir");
  });

  it("source: delete confirmation message warns action cannot be undone", () => {
    const source = readFileSync(
      resolve(__dirname, "../../src/components/admin/UserRoleManager.vue"),
      "utf8",
    );
    expect(source).toContain("no se puede deshacer");
  });

  it("source: does not use native confirm() anywhere", () => {
    const source = readFileSync(
      resolve(__dirname, "../../src/components/admin/UserRoleManager.vue"),
      "utf8",
    );
    expect(source).not.toContain("confirm(");
  });

  it("role-change event opens ConfirmationModal", async () => {
    const wrapper = mount(UserRoleManager, { shallow: true });
    await flushPromises();

    const usersTable = wrapper.findComponent({ name: "UsersTable" });
    await usersTable.vm.$emit("role-change", mockUsers[1], "ADMIN");
    await flushPromises();

    const modal = wrapper.findComponent({ name: "ConfirmationModal" });
    expect(modal.exists()).toBe(true);
    expect(modal.props("open")).toBe(true);
  });

  it("confirming role change sends PATCH request", async () => {
    const wrapper = mount(UserRoleManager, { shallow: true });
    await flushPromises();
    mockApi.mockClear();

    const usersTable = wrapper.findComponent({ name: "UsersTable" });
    await usersTable.vm.$emit("role-change", mockUsers[1], "ADMIN");
    await flushPromises();

    const modal = wrapper.findComponent({ name: "ConfirmationModal" });
    await modal.props("onConfirm")();
    await flushPromises();

    const rolePatchCalls = mockApi.mock.calls.filter(
      (c) =>
        String(c[0]).includes(`/api/v1/admin/users/${mockUsers[1]!.id}/role`) &&
        String(c[1]?.method).toUpperCase() === "PATCH",
    );
    expect(rolePatchCalls.length).toBeGreaterThan(0);
  });

  it("cancel on ConfirmationModal does not call API", async () => {
    const wrapper = mount(UserRoleManager, { shallow: true });
    await flushPromises();

    mockApi.mockClear();

    const usersTable = wrapper.findComponent({ name: "UsersTable" });
    await usersTable.vm.$emit("role-change", mockUsers[1], "ADMIN");
    await flushPromises();

    // Emit cancel from the modal
    const modal = wrapper.findComponent({ name: "ConfirmationModal" });
    await modal.props("onCancel")();
    await flushPromises();

    // No PATCH/DELETE should have been fired after cancel
    const mutateCalls = mockApi.mock.calls.filter(
      (c) => c[1]?.method === "PATCH" || c[1]?.method === "DELETE",
    );
    expect(mutateCalls.length).toBe(0);
  });
});

describe("admin players status confirmation flow", () => {
  const playersPagePath = resolve(
    __dirname,
    "../../src/pages/admin/players/index.vue",
  );
  const source = readFileSync(playersPagePath, "utf8");

  it("uses shared ConfirmationModal for activate/deactivate actions", () => {
    expect(source).toContain(
      'import ConfirmationModal from "~/components/ui/ConfirmationModal.vue"',
    );
    expect(source).toContain("toggleStatusModalOpen");
    expect(source).toContain("askToggleStatus");
    expect(source).toContain("Desactivar jugador");
    expect(source).toContain("Activar jugador");
  });

  it("routes activate/deactivate button clicks through modal flow", () => {
    expect(source).toContain('@toggle-status="askToggleStatus"');
    expect(source).not.toContain('@click="toggleStatus(p)"');
  });
});
