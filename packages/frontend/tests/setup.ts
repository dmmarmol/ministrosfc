/**
 * Global Vitest test setup for packages/frontend.
 *
 * Registers lightweight stubs for nuxt/ui components that cannot be resolved
 * via `resolveComponent()` in the happy-dom environment (they are auto-
 * imported only in the Nuxt runtime, not in Vitest).
 *
 * Also registers the real local components that Nuxt would auto-import so
 * component trees like StatsTableByPlayer → StatsTable → UiTable → UTable
 * resolve correctly in tests.
 */
import { config } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import UiTable from "~/components/ui/Table.vue";
import StatsTable from "~/components/pages/stats/StatsTable.vue";

/**
 * Minimal UTable stub that mirrors the slot contract of the real component:
 *  - #loading-state  → rendered inside a wrapper when `loading` is true
 *  - #empty-state    → rendered inside a wrapper when rows is empty
 *  - #<key>-header   → rendered inside each <th>
 *  - #<key>-data     → rendered inside each <td>
 */
const UTableStub = defineComponent({
  name: "UTable",
  props: {
    columns: { type: Array, default: () => [] },
    rows: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () => {
      type Col = { key: string; label: string; sortable?: boolean };
      type Row = Record<string, unknown>;

      const cols = props.columns as Col[];
      const rows = props.rows as Row[];

      if (props.loading) {
        return h("div", { "data-testid": "u-table-loading" }, [
          slots["loading-state"]?.() ?? [],
        ]);
      }

      if (!rows.length) {
        return h("div", { "data-testid": "u-table-empty" }, [
          slots["empty-state"]?.() ?? "Sin datos",
        ]);
      }

      return h("table", [
        h(
          "thead",
          h(
            "tr",
            cols.map((col) =>
              h(
                "th",
                { "data-key": col.key },
                slots[`${col.key}-header`]?.({ column: col }) ?? col.label,
              ),
            ),
          ),
        ),
        h(
          "tbody",
          rows.map((row, idx) =>
            h(
              "tr",
              { "data-idx": idx },
              cols.map((col) =>
                h(
                  "td",
                  { "data-key": col.key },
                  slots[`${col.key}-data`]?.({
                    column: col,
                    row,
                    index: idx,
                    getRowData: (d: unknown) => d ?? row[col.key],
                  }) ?? String(row[col.key] ?? ""),
                ),
              ),
            ),
          ),
        ),
      ]);
    };
  },
});

config.global.components = {
  UTable: UTableStub,
  UiTable,
  StatsTable,
};
