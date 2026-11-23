import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";

const mocks = vi.hoisted(() => ({ enabled: null as null | { value: boolean } }));

vi.mock("~/composables/useAppConfig", async () => {
  const { ref } = await import("vue");
  mocks.enabled = ref(false);
  return {
    useAppConfig: () => ({
      photoUploadsEnabled: mocks.enabled,
      loaded: ref(true),
      load: vi.fn().mockResolvedValue(undefined),
    }),
  };
});

vi.mock("~/composables/useJerseyAvailability", () => ({
  useJerseyAvailability: () => ({
    taken: { value: [] },
    loading: { value: false },
    fetch: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("nuxt/app", () => ({
  useNuxtApp: () => ({ $api: vi.fn().mockResolvedValue({ data: [] }) }),
}));

vi.mock("~/components/ui/Position/Select.vue", () => ({
  default: defineComponent({ template: "<div />" }),
}));
vi.mock("~/components/ui/JerseyNumberInput.vue", () => ({
  default: defineComponent({ template: "<div />" }),
}));

import PlayerForm from "../PlayerForm.vue";

const stubs = {
  UInput: true,
  UButton: true,
  USelect: true,
  USelectMenu: true,
  UiLoadingOverlay: true,
  UiPlayerStatusSelect: true,
};

describe("PlayerForm photo input", () => {
  beforeEach(() => {
    mocks.enabled!.value = false;
  });

  it("hides the photo section when photo uploads are disabled", () => {
    const wrapper = mount(PlayerForm, { global: { stubs } });

    expect(wrapper.find('input[type="file"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain("Foto");
  });

  it("shows an enabled photo input when photo uploads are enabled", () => {
    mocks.enabled!.value = true;
    const wrapper = mount(PlayerForm, { global: { stubs } });

    const input = wrapper.find('input[type="file"]');
    expect(input.exists()).toBe(true);
    expect(input.attributes("disabled")).toBeUndefined();
  });
});
