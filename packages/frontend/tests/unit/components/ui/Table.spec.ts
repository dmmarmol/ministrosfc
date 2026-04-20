import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import UiTable from "~/components/ui/Table.vue";
import type { ColumnDef } from "~/types/table";

// UTable is registered globally by tests/setup.ts

// ── Fixtures ──────────────────────────────────────────────────────────────────

const columns: ColumnDef[] = [
  { key: "name", label: "Jugador", title: "Jugador", sortable: true },
  { key: "goals", label: "Goles", title: "Goles", sortable: true },
  { key: "period", label: "Período", title: "Período", sortable: false },
];

const rows = [
  { name: "Ana", goals: 5, period: "2023" },
  { name: "Bob", goals: 10, period: "2024" },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("UiTable", () => {
  it("renders column labels from ColumnDef[]", () => {
    const wrapper = mount(UiTable, { props: { columns, rows } });
    const text = wrapper.text();
    expect(text).toContain("Jugador");
    expect(text).toContain("Goles");
    expect(text).toContain("Período");
  });

  it("renders row values in the order passed", () => {
    const wrapper = mount(UiTable, { props: { columns, rows } });
    const cells = wrapper.findAll("td[data-key='name']");
    expect(cells[0]?.text()).toBe("Ana");
    expect(cells[1]?.text()).toBe("Bob");
  });

  it("attaches title attribute to sortable column header", () => {
    const wrapper = mount(UiTable, { props: { columns, rows } });
    // The injected header slot renders a <button title="Goles">
    const goalsHeaderContent = wrapper
      .find("th[data-key='goals']")
      .find("button");
    expect(goalsHeaderContent.attributes("title")).toBe("Goles");
  });

  it("attaches title attribute to non-sortable column with a title", () => {
    const wrapper = mount(UiTable, { props: { columns, rows } });
    const periodHeader = wrapper.find("th[data-key='period']").find("span");
    expect(periodHeader.attributes("title")).toBe("Período");
  });

  it("does NOT render a title attribute when column has no title", () => {
    const noTitleCols: ColumnDef[] = [{ key: "x", label: "X" }];
    const wrapper = mount(UiTable, {
      props: { columns: noTitleCols, rows: [{ x: 1 }] },
    });
    // Default UTable rendering (no injected slot) → no title attr on any element
    expect(wrapper.find("th[data-key='x']").html()).not.toContain("title=");
  });

  it("emits sort event when sortable column header is clicked", async () => {
    const wrapper = mount(UiTable, { props: { columns, rows } });
    await wrapper.find("th[data-key='goals'] button").trigger("click");
    expect(wrapper.emitted("sort")?.[0]).toEqual(["goals"]);
  });

  it("does NOT emit sort when a non-sortable column header is clicked", async () => {
    const wrapper = mount(UiTable, { props: { columns, rows } });
    // period is non-sortable — its header is a span with no onClick
    await wrapper.find("th[data-key='period'] span").trigger("click");
    expect(wrapper.emitted("sort")).toBeFalsy();
  });

  it("shows loading skeleton when loading is true", () => {
    const wrapper = mount(UiTable, {
      props: { columns, rows: [], loading: true },
    });
    expect(wrapper.find("[data-testid='u-table-loading']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='u-table-loading']").html()).toContain(
      "animate-pulse",
    );
  });

  it("shows empty state when rows is empty and not loading", () => {
    const wrapper = mount(UiTable, {
      props: { columns, rows: [], loading: false },
    });
    expect(wrapper.find("[data-testid='u-table-empty']").exists()).toBe(true);
    expect(wrapper.text()).toContain("Sin datos");
  });

  it("shows sort direction indicator for the active sort key", () => {
    const wrapper = mount(UiTable, {
      props: { columns, rows, sortKey: "goals", sortDir: "asc" },
    });
    expect(wrapper.find("th[data-key='goals'] button").text()).toContain("↑");
  });

  it("shows descending indicator when sortDir is desc", () => {
    const wrapper = mount(UiTable, {
      props: { columns, rows, sortKey: "goals", sortDir: "desc" },
    });
    expect(wrapper.find("th[data-key='goals'] button").text()).toContain("↓");
  });

  it("shows no sort indicator for non-active columns", () => {
    const wrapper = mount(UiTable, {
      props: { columns, rows, sortKey: "goals", sortDir: "asc" },
    });
    const nameHeader = wrapper.find("th[data-key='name'] button").text();
    expect(nameHeader).not.toContain("↑");
    expect(nameHeader).not.toContain("↓");
  });
});
