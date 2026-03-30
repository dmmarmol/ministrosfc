/**
 * Unit tests for admin UserRoleManager component
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { ref } from "vue";

const mockApi = vi.fn();

vi.stubGlobal("definePageMeta", vi.fn());
vi.stubGlobal("useNuxtApp", () => ({ $api: mockApi }));
vi.stubGlobal("useRuntimeConfig", () => ({
  public: { apiBaseUrl: "http://localhost:5102" },
}));
vi.stubGlobal("alert", vi.fn());

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
