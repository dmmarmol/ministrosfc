import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import StatsRanked, {
  type RankedItem,
} from "~/components/pages/statistics/StatsRanked.vue";

const metrics = [
  { key: "games", label: "Partidos", unit: "partidos" },
  { key: "goals", label: "Goles", unit: "goles" },
];
const items: RankedItem[] = [
  { id: "a", title: "La Placita", values: { games: 6, goals: 3 }, detail: [{ label: "PJ", value: 6 }], cards: { yellow: 2, red: 1 } },
  { id: "b", title: "San Mengano", values: { games: 9, goals: 5 }, detail: [{ label: "PJ", value: 9 }] },
  { id: "c", title: "Rayo", values: { games: 3, goals: 0 } },
];

const mountIt = (props: Record<string, unknown> = {}) =>
  mount(StatsRanked, {
    props: { items, metrics, ...props },
    slots: { extra: '<template #extra="{ item }"><p>partidos de {{ item.title }}</p></template>' },
  });
const titles = (w: ReturnType<typeof mountIt>) =>
  w.findAll("ol > li").map((li) => li.find(".sheet-display").text());

describe("StatsRanked single-open and search", () => {
  it("ranks by the first metric, most games first", () => {
    expect(titles(mountIt())).toEqual(["San Mengano", "La Placita", "Rayo"]);
  });

  it("closes the open row when another is opened in single mode", async () => {
    const w = mountIt({ single: true });
    const buttons = () => w.findAll("ol > li > button");
    await buttons()[0]!.trigger("click");
    await buttons()[1]!.trigger("click");
    expect(w.findAll('button[aria-expanded="true"]')).toHaveLength(1);
    expect(w.text()).toContain("partidos de La Placita");
    expect(w.text()).not.toContain("partidos de San Mengano");
  });

  it("keeps several rows open when single is off", async () => {
    const w = mountIt();
    const buttons = () => w.findAll("ol > li > button");
    await buttons()[0]!.trigger("click");
    await buttons()[1]!.trigger("click");
    expect(w.findAll('button[aria-expanded="true"]')).toHaveLength(2);
  });

  it("narrows rows by title and opens the only match", async () => {
    const w = mountIt({ single: true, searchLabel: "Buscar equipo" });
    await w.find('input[type="search"]').setValue("mengano");
    expect(titles(w)).toEqual(["San Mengano"]);
    expect(w.find('button[aria-expanded="true"]').exists()).toBe(true);
  });

  it("shows yellow and red card counts on the collapsed row", () => {
    const w = mountIt();
    expect(w.text()).toContain("2 tarjetas amarillas");
    expect(w.text()).toContain("1 tarjeta roja");
  });

  it("makes only the open row header sticky when stickyHeader is on", async () => {
    const w = mountIt({ stickyHeader: true });
    const buttons = () => w.findAll("ol > li > button");
    expect(buttons().some((b) => b.classes().includes("sticky"))).toBe(false);
    await buttons()[0]!.trigger("click");
    expect(buttons().filter((b) => b.classes().includes("sticky"))).toHaveLength(1);
  });

  it("never sticks headers by default", async () => {
    const w = mountIt();
    await w.findAll("ol > li > button")[0]!.trigger("click");
    expect(w.find(".sticky").exists()).toBe(false);
  });

  it("hides the search box unless a label is given", () => {
    expect(mountIt().find('input[type="search"]').exists()).toBe(false);
  });
});
