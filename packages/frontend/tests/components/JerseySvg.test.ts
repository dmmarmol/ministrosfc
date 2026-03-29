import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import JerseySvg from "../../src/components/profile/JerseySvg.vue";

describe("JerseySvg", () => {
  it("renders SVG with jersey number", () => {
    const wrapper = mount(JerseySvg, {
      props: { jerseyNumber: 10, lastName: "Pérez" },
    });
    const svg = wrapper.find("svg");
    expect(svg.exists()).toBe(true);
    expect(wrapper.text()).toContain("10");
  });

  it("renders lastName above the number", () => {
    const wrapper = mount(JerseySvg, {
      props: { jerseyNumber: 7, lastName: "García" },
    });
    expect(wrapper.text()).toContain("GARCÍA");
  });

  it("handles null jersey number gracefully", () => {
    const wrapper = mount(JerseySvg, {
      props: { jerseyNumber: null, lastName: "López" },
    });
    const svg = wrapper.find("svg");
    expect(svg.exists()).toBe(true);
    // Should still render without error
    expect(wrapper.text()).toContain("LÓPEZ");
  });

  it("accepts color props", () => {
    const wrapper = mount(JerseySvg, {
      props: {
        jerseyNumber: 9,
        lastName: "Test",
        bgColor: "#FF0000",
        textColor: "#FFFFFF",
      },
    });
    expect(wrapper.find("svg").exists()).toBe(true);
  });
});
