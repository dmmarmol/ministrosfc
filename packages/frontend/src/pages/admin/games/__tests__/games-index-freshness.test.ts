import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, defineComponent, h, nextTick, ref, Suspense, watch } from "vue";

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  useAsyncData: vi.fn(),
}));

vi.mock("nuxt/app", () => ({
  useNuxtApp: () => ({ $api: mocks.api }),
  useAsyncData: mocks.useAsyncData,
  useHead: vi.fn(),
}));

vi.mock("~/composables/useQueryParams", () => ({
  useQueryParams: () => ({ get: () => "" }),
}));

describe("admin games index data", () => {
  let page: (typeof import("../index.vue"))["default"];

  beforeAll(async () => {
    vi.stubGlobal("definePageMeta", vi.fn());
    vi.stubGlobal("computed", computed);
    vi.stubGlobal("nextTick", nextTick);
    vi.stubGlobal("ref", ref);
    vi.stubGlobal("watch", watch);
    page = (await import("../index.vue")).default;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.api.mockResolvedValue({ data: [] });
    mocks.useAsyncData.mockImplementation(async (_key, handler) => {
      await handler();
      return {
        data: ref({ data: [] }),
        pending: ref(false),
        refresh: vi.fn(),
      };
    });
  });

  it("requests current CMS data rather than reusing the cached list", async () => {
    mount(
      defineComponent({
        setup: () => () => h(Suspense, null, { default: () => h(page) }),
      }),
    );

    const [, , options] = mocks.useAsyncData.mock.calls[0];
    expect(options.getCachedData()).toBeUndefined();
    expect(mocks.api).toHaveBeenCalledWith(
      "/api/v1/games",
      expect.objectContaining({ query: expect.objectContaining({ limit: 100 }) }),
    );
  });
});
