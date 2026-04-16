/**
 * Unit tests for admin UserRoleManager component
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { ref } from "vue";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mockApi = vi.fn();

vi.stubGlobal("definePageMeta", vi.fn());
vi.stubGlobal("useNuxtApp", () => ({ $api: mockApi }));
vi.stubGlobal("useRuntimeConfig", () => ({
  public: { apiBaseUrl: "http://localhost:5102" },
}));
vi.stubGlobal("alert", vi.fn());

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
    const wrapper = mount(UserRoleManager, { shallow: false });
    await flushPromises();

    expect(mockApi).toHaveBeenCalled();
    expect(wrapper.text()).toContain("Admin User");
    expect(wrapper.text()).toContain("Carlos Gómez");
  });

  it("renders search input and role filter", async () => {
    const wrapper = mount(UserRoleManager, { shallow: false });
    await flushPromises();

    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
    expect(wrapper.find("select").exists()).toBe(true);
  });

  it("displays role badges for each user", async () => {
    const wrapper = mount(UserRoleManager, { shallow: false });
    await flushPromises();

    expect(wrapper.text()).toContain("ADMIN");
    expect(wrapper.text()).toContain("PLAYER");
  });

  it("shows error message on fetch failure", async () => {
    mockApi.mockRejectedValueOnce(new Error("Network error"));
    const wrapper = mount(UserRoleManager, { shallow: false });
    await flushPromises();

    expect(wrapper.text()).toContain("Network error");
  });
});

// T008: Full-name click edit entry and profile save feedback
describe("UserRoleManager – full-name edit entry (T008)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue({
      data: mockUsers,
      meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
    });
  });

  it("clicking the full name enters edit mode with pre-filled fields", async () => {
    const wrapper = mount(UserRoleManager, { shallow: false });
    await flushPromises();

    // Find Carlos Gómez's name and click
    const nameSpans = wrapper.findAll(".cursor-pointer.underline");
    const carlosSpan = nameSpans.find((s) => s.text().includes("Carlos"));
    expect(carlosSpan).toBeDefined();
    await carlosSpan?.trigger("click");

    // Should now show input fields pre-filled
    const inputs = wrapper.findAll('input[type="text"], input:not([type])');
    const firstNameInput = inputs.find((i) => i.element.value === "Carlos");
    expect(firstNameInput).toBeDefined();
  });

  it("shows Guardar and Cancelar buttons in edit mode", async () => {
    const wrapper = mount(UserRoleManager, { shallow: false });
    await flushPromises();

    const nameSpan = wrapper.findAll(".cursor-pointer.underline")[0];
    await nameSpan.trigger("click");

    expect(wrapper.text()).toContain("Guardar");
    expect(wrapper.text()).toContain("Cancelar");
  });

  it("Cancelar button exits edit mode without saving", async () => {
    const wrapper = mount(UserRoleManager, { shallow: false });
    await flushPromises();

    const nameSpan = wrapper.findAll(".cursor-pointer.underline")[0];
    await nameSpan.trigger("click");

    const cancelBtn = wrapper
      .findAll("button")
      .find((b) => b.text() === "Cancelar");
    await cancelBtn?.trigger("click");

    const calls = mockApi.mock.calls.length;
    // Should not have triggered a PATCH
    const patchCalls = mockApi.mock.calls.filter(
      (c) => String(c[1]?.method).toUpperCase() === "PATCH",
    );
    expect(patchCalls.length).toBe(0);
  });

  it("non-email edit saves directly without confirmation modal", async () => {
    mockApi
      .mockResolvedValueOnce({
        data: mockUsers,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      })
      .mockResolvedValueOnce({ data: { ...mockUsers[0] } }) // PATCH response
      .mockResolvedValueOnce({
        data: mockUsers,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      }); // re-fetch

    const wrapper = mount(UserRoleManager, { shallow: false });
    await flushPromises();

    const nameSpan = wrapper.findAll(".cursor-pointer.underline")[0];
    await nameSpan.trigger("click");

    // Modify first name only
    const inputs = wrapper.findAll("input");
    const firstNameInput = inputs[0];
    await firstNameInput.setValue("Admín");

    const saveBtn = wrapper
      .findAll("button")
      .find((b) => b.text() === "Guardar");
    await saveBtn?.trigger("click");
    await flushPromises();

    // ConfirmationModal should NOT appear
    const modal = wrapper.findComponent({ name: "ConfirmationModal" });
    expect(!modal.exists() || !modal.props("open")).toBe(true);
    // PATCH should have been called
    const patchCalls = mockApi.mock.calls.filter(
      (c) => String(c[1]?.method).toUpperCase() === "PATCH",
    );
    expect(patchCalls.length).toBeGreaterThan(0);
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
  const sourcePath = resolve(
    __dirname,
    "../../src/components/admin/UserRoleManager.vue",
  );
  const source = readFileSync(sourcePath, "utf8");

  it("does NOT gate role select with v-if restricting ADMIN role", () => {
    // Old pattern was: v-if="user.role !== 'ADMIN'" – must not exist
    expect(source).not.toContain("v-if=\"user.role !== 'ADMIN'\"");
  });

  it("role select includes all four roles for every user", () => {
    expect(source).toContain('value="PLAYER"');
    expect(source).toContain('value="DT"');
    expect(source).toContain('value="EDITOR"');
    expect(source).toContain('value="ADMIN"');
  });

  it("role select is disabled when user.id matches current user id", () => {
    expect(source).toContain(':disabled="user.id === authStore.user?.id"');
  });

  it("disabled role select has a descriptive title tooltip", () => {
    expect(source).toContain("No podés cambiar tu propio rol");
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
    const wrapper = mount(UserRoleManager, { shallow: false });
    await flushPromises();

    // Trigger a role change via the select (change to ADMIN)
    const selects = wrapper.findAll("select");
    // Find the role select (user-row selects; exclude the filter select which has value="")
    const roleSelect = selects.find(
      (s) =>
        s.html().includes('value="ADMIN"') &&
        s.html().includes('value="DT"') &&
        !s.html().includes('value=""'),
    );
    expect(roleSelect).toBeDefined();

    await roleSelect?.setValue("ADMIN");
    await roleSelect?.trigger("change");
    await flushPromises();

    // The ConfirmationModal should be visible
    const modal = wrapper.findComponent({ name: "ConfirmationModal" });
    expect(modal.exists()).toBe(true);
    expect(modal.props("open")).toBe(true);
  });

  it("self (currentUser) role select is disabled", async () => {
    // Mount with a user that matches the mocked currentUser id
    mockApi.mockResolvedValue({
      data: [
        {
          id: "current-admin",
          email: "me@test.com",
          firstName: "Me",
          lastName: "Admin",
          role: "ADMIN",
          createdAt: "",
          lastLoginAt: null,
          player: null,
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    const wrapper = mount(UserRoleManager, { shallow: false });
    await flushPromises();

    const roleSelects = wrapper
      .findAll("select")
      .filter(
        (s) =>
          s.html().includes('value="ADMIN"') &&
          s.html().includes('value="DT"') &&
          !s.html().includes('value=""'),
      );
    expect(roleSelects.length).toBeGreaterThan(0);
    expect(roleSelects[0].element.disabled).toBe(true);
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
    expect(source).toContain("requestStatusToggle(user)");
  });

  it("source: delete routes through confirmDelete and requestConfirmation", () => {
    const source = readFileSync(
      resolve(__dirname, "../../src/components/admin/UserRoleManager.vue"),
      "utf8",
    );
    expect(source).toContain("confirmDelete(user)");
    expect(source).toContain("requestConfirmation(");
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

  it("clicking Desactivar button opens ConfirmationModal", async () => {
    const wrapper = mount(UserRoleManager, { shallow: false });
    await flushPromises();

    // Find Desactivar button for the player user (u2)
    const deactivateBtn = wrapper
      .findAll("button")
      .find((b) => b.text() === "Desactivar");
    expect(deactivateBtn).toBeDefined();

    await deactivateBtn?.trigger("click");
    await flushPromises();

    const modal = wrapper.findComponent({ name: "ConfirmationModal" });
    expect(modal.exists()).toBe(true);
    expect(modal.props("open")).toBe(true);
  });

  it("clicking Eliminar button opens ConfirmationModal for delete", async () => {
    const wrapper = mount(UserRoleManager, { shallow: false });
    await flushPromises();

    const deleteBtn = wrapper
      .findAll("button")
      .find((b) => b.text() === "Eliminar");
    expect(deleteBtn).toBeDefined();

    await deleteBtn?.trigger("click");
    await flushPromises();

    const modal = wrapper.findComponent({ name: "ConfirmationModal" });
    expect(modal.exists()).toBe(true);
    expect(modal.props("open")).toBe(true);
  });

  it("cancel on ConfirmationModal does not call API", async () => {
    const wrapper = mount(UserRoleManager, { shallow: false });
    await flushPromises();

    mockApi.mockClear();

    const deactivateBtn = wrapper
      .findAll("button")
      .find((b) => b.text() === "Desactivar");
    await deactivateBtn?.trigger("click");
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
    expect(source).toContain('@click="askToggleStatus(p, $event)"');
    expect(source).not.toContain('@click="toggleStatus(p)"');
  });
});
