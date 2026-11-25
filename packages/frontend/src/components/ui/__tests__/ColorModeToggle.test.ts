import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, defineComponent } from "vue";
import { mount } from "@vue/test-utils";

const colorMode = vi.hoisted(() => ({ value: "light", preference: "system" }));
vi.stubGlobal("useColorMode", () => colorMode);
vi.stubGlobal("computed", computed);

import ColorModeToggle from "../ColorModeToggle.vue";

const UButtonStub = defineComponent({
  props: ["icon", "ariaLabel", "title"],
  emits: ["click"],
  template:
    '<button :data-icon="icon" :aria-label="ariaLabel" @click="$emit(\'click\')" />',
});
const ClientOnlyStub = defineComponent({ template: "<div><slot /></div>" });

function render() {
  return mount(ColorModeToggle, {
    global: { stubs: { UButton: UButtonStub, ClientOnly: ClientOnlyStub } },
  });
}

describe("ColorModeToggle", () => {
  beforeEach(() => {
    colorMode.value = "light";
    colorMode.preference = "system";
  });

  it("offers dark mode when the site is light", async () => {
    const button = render().find("button");

    expect(button.attributes("aria-label")).toBe("Cambiar a modo oscuro");
    expect(button.attributes("data-icon")).toBe("mdi:weather-night");
    await button.trigger("click");
    expect(colorMode.preference).toBe("dark");
  });

  it("offers light mode when the site is dark", async () => {
    colorMode.value = "dark";
    const button = render().find("button");

    expect(button.attributes("aria-label")).toBe("Cambiar a modo claro");
    expect(button.attributes("data-icon")).toBe("mdi:weather-sunny");
    await button.trigger("click");
    expect(colorMode.preference).toBe("light");
  });
});
