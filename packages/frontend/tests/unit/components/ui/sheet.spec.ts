import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Band from "../../../../src/components/ui/Sheet/Band.vue";
import Heading from "../../../../src/components/ui/Sheet/Heading.vue";
import Message from "../../../../src/components/ui/Sheet/Message.vue";
import Title from "../../../../src/components/ui/Sheet/Title.vue";
import Totals from "../../../../src/components/ui/Sheet/Totals.vue";

describe("Sheet building blocks", () => {
  it("Title renders an h1 with its text", () => {
    const w = mount(Title, { slots: { default: "Plantilla" } });
    expect(w.find("h1").text()).toBe("Plantilla");
  });

  it("Band shows the title, the count and the noun for screen readers", () => {
    const w = mount(Band, {
      props: { id: "b", count: 4, countLabel: "partidos" },
      slots: { default: "2026" },
    });
    expect(w.find("h2#b").text()).toContain("2026");
    expect(w.text()).toContain("4 partidos");
  });

  it("Band without a count renders no count", () => {
    const w = mount(Band, { slots: { default: "Goleadores" } });
    expect(w.text()).toBe("Goleadores");
  });

  it("Heading shows an optional count", () => {
    const w = mount(Heading, { props: { count: "12 / 14" }, slots: { default: "Convocados" } });
    expect(w.text()).toContain("Convocados");
    expect(w.text()).toContain("12 / 14");
  });

  it("Message announces loading states and not empty states", () => {
    const loading = mount(Message, { slots: { default: "Cargando…" } });
    const empty = mount(Message, { props: { tone: "empty" }, slots: { default: "Nada" } });
    expect(loading.attributes("role")).toBe("status");
    expect(empty.attributes("role")).toBeUndefined();
  });

  it("Totals lists each label with its value", () => {
    const w = mount(Totals, {
      props: {
        items: [
          { label: "Partidos", value: 12 },
          { label: "Goles", value: "34" },
        ],
      },
    });
    const terms = w.findAll("dt").map((d) => d.text());
    const values = w.findAll("dd").map((d) => d.text());
    expect(terms).toEqual(["Partidos", "Goles"]);
    expect(values).toEqual(["12", "34"]);
  });
});
