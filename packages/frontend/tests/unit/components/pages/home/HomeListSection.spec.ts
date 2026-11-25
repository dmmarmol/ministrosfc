import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import HomeListSection from "~/components/pages/home/HomeListSection.vue";

const base = {
  id: "sec",
  title: "Goleadores",
  items: [{ n: "Ana" }, { n: "Beto" }],
  itemKey: (i: { n: string }) => i.n,
  emptyText: "Sin datos.",
  linkTo: "/x",
  linkLabel: "Ver todo",
};
const mountIt = (props: Record<string, unknown> = {}) =>
  mount(HomeListSection, {
    props: { ...base, ...props },
    slots: { item: '<template #item="{ item, index }">{{ index }}:{{ item.n }}</template>' },
    global: { stubs: { NuxtLink: { template: '<a :href="to"><slot /></a>', props: ["to"] } } },
  });

describe("HomeListSection", () => {
  it("renders the heading and one row per item through the item slot", () => {
    const w = mountIt();
    expect(w.find("h2").text()).toBe("Goleadores");
    expect(w.findAll("li").map((li) => li.text())).toEqual(["0:Ana", "1:Beto"]);
  });

  it("labels the section with its heading", () => {
    expect(mountIt().find("section").attributes("aria-labelledby")).toBe("sec");
  });

  it("uses a plain list by default and an ordered list when ordered", () => {
    expect(mountIt().find("ul").exists()).toBe(true);
    expect(mountIt({ ordered: true }).find("ol").exists()).toBe(true);
  });

  it("shows the loading line instead of the list while loading", () => {
    const w = mountIt({ loading: true });
    expect(w.text()).toContain("Cargando…");
    expect(w.find("li").exists()).toBe(false);
  });

  it("shows the empty text when there are no items", () => {
    const w = mountIt({ items: [] });
    expect(w.text()).toContain("Sin datos.");
  });

  it("links to the full page", () => {
    const a = mountIt().find("a");
    expect(a.attributes("href")).toBe("/x");
    expect(a.text()).toContain("Ver todo");
  });
});
