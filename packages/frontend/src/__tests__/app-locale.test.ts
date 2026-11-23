import { describe, expect, it, vi } from "vitest";
import { defineComponent, onMounted } from "vue";
import { mount } from "@vue/test-utils";

vi.stubGlobal("useHead", vi.fn());
vi.stubGlobal("onMounted", onMounted);

vi.mock("~/stores/auth", () => ({
  useAuthStore: () => ({ loadFromStorage: vi.fn() }),
}));

import App from "../app.vue";

const UAppStub = defineComponent({
  props: { locale: { type: Object, default: undefined } },
  template: "<div><slot /></div>",
});

describe("app.vue", () => {
  it("gives Nuxt UI the Spanish locale so built-in texts (for example empty tables) are in Spanish", () => {
    const wrapper = mount(App, {
      global: { stubs: { UApp: UAppStub, NuxtLayout: true, NuxtPage: true } },
    });

    const locale = wrapper.findComponent(UAppStub).props("locale") as
      { code: string; messages: { table: { noData: string } } } | undefined;

    expect(locale?.code).toBe("es");
    expect(locale?.messages.table.noData).toBe("Sin datos");
  });
});
