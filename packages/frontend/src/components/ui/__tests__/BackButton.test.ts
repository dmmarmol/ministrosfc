import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("~/composables/useQueryParams", () => ({
  useQueryParams: () => ({ get: mocks.get }),
}));

import BackButton from "../BackButton.vue";

const NuxtLinkStub = defineComponent({
  props: { to: { type: String, required: true } },
  template: '<a :href="to"><slot /></a>',
});

describe("BackButton", () => {
  beforeEach(() => {
    mocks.get.mockReset();
  });

  it("uses a valid internal return path", () => {
    mocks.get.mockReturnValue("/admin/players?status=ACTIVE");
    const wrapper = mount(BackButton, {
      props: { to: "/admin/games" },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });

    expect(wrapper.findComponent(NuxtLinkStub).props("to")).toBe(
      "/admin/players?status=ACTIVE",
    );
  });

  it.each(["", "https://outside.example", "//outside.example", "/bad%ZZ"])(
    "uses the configured fallback for invalid return path %s",
    (returnUrl) => {
      mocks.get.mockReturnValue(returnUrl);
      const wrapper = mount(BackButton, {
        props: { to: "/admin/games" },
        global: { stubs: { NuxtLink: NuxtLinkStub } },
      });

      expect(wrapper.findComponent(NuxtLinkStub).props("to")).toBe(
        "/admin/games",
      );
    },
  );
});
