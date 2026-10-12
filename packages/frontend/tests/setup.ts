/**
 * Global Vitest test setup for packages/frontend.
 *
 * Registers lightweight stubs for nuxt/ui components that cannot be resolved
 * via `resolveComponent()` in the happy-dom environment (they are auto-
 * imported only in the Nuxt runtime, not in Vitest).
 *
 * Also registers the real local components that Nuxt would auto-import so
 * component trees like StatsTableByPlayer → StatsTable → UTable
 * resolve correctly in tests.
 */
import { config } from "@vue/test-utils";
import { computed, defineComponent, h, ref } from "vue";

if (!("computed" in globalThis)) {
  Object.assign(globalThis, { computed });
}

if (!("h" in globalThis)) {
  Object.assign(globalThis, { h });
}

if (!("ref" in globalThis)) {
  Object.assign(globalThis, { ref });
}

const UiPositionLabelStub = defineComponent({
  name: "UiPositionLabel",
  props: {
    position: { type: [String, Number, null], default: null },
  },
  setup(props) {
    return () => h("span", props.position ?? "");
  },
});

if (!("resolveComponent" in globalThis)) {
  Object.assign(globalThis, {
    resolveComponent: (name: string) => {
      const registry = config.global.components as Record<string, unknown>;
      return registry[name] ?? name;
    },
  });
}

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
    data: { type: Array, default: () => [] },
    rows: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    sortKey: { type: String, default: null },
    sortDir: { type: String, default: null },
  },
  emits: ["sort"],
  setup(props, { slots, emit }) {
    return () => {
      type Col = {
        key?: string;
        label?: string;
        accessorKey?: string;
        header?: string | ((ctx: unknown) => unknown);
        cell?: (ctx: {
          row: {
            original: Row;
            getValue: (key: string) => unknown;
          };
        }) => unknown;
        sortable?: boolean;
      };
      type Row = Record<string, unknown>;

      const cols = props.columns as Col[];
      const rows = (
        (props.data as Row[])?.length ? props.data : props.rows
      ) as Row[];

      if (props.loading) {
        return h(
          "div",
          { "data-testid": "u-table-loading", class: "animate-pulse" },
          [slots["loading-state"]?.() ?? []],
        );
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
            cols.map((col) => {
              const key = col.accessorKey ?? col.key ?? "";
              const customHeader =
                typeof col.header === "function"
                  ? col.header({
                      column: {
                        getIsSorted: () =>
                          props.sortKey === key
                            ? props.sortDir === "asc"
                              ? "asc"
                              : "desc"
                            : false,
                        toggleSorting: () => emit("sort", key),
                      },
                    })
                  : null;
              const headerLabel =
                typeof col.header === "string"
                  ? col.header
                  : typeof col.header === "function"
                    ? String((col as { label?: string }).label ?? key)
                    : (col.label ?? key);
              const sortIndicator =
                props.sortKey === key
                  ? props.sortDir === "asc"
                    ? " ↑"
                    : props.sortDir === "desc"
                      ? " ↓"
                      : ""
                  : "";
              const header = col.sortable
                ? h(
                    "button",
                    {
                      type: "button",
                      title: (col as { title?: string }).title,
                      onClick: () => emit("sort", key),
                    },
                    customHeader ?? `${headerLabel}${sortIndicator}`,
                  )
                : h(
                    "span",
                    { title: (col as { title?: string }).title },
                    customHeader ?? headerLabel,
                  );

              return h(
                "th",
                { "data-key": key },
                slots[`${key}-header`]?.({ column: col }) ?? header,
              );
            }),
          ),
        ),
        h(
          "tbody",
          rows.map((row, idx) =>
            h(
              "tr",
              { "data-idx": idx },
              cols.map((col) => {
                const key = col.accessorKey ?? col.key ?? "";
                const rowApi = {
                  original: row,
                  getValue: (cellKey: string) => row[cellKey],
                };
                const renderedCell = col.cell
                  ? col.cell({ row: rowApi })
                  : String(row[key] ?? "");

                return h(
                  "td",
                  { "data-key": key },
                  slots[`${key}-data`]?.({
                    column: col,
                    row,
                    index: idx,
                    getRowData: (d: unknown) => d ?? row[key],
                  }) ?? renderedCell,
                );
              }),
            ),
          ),
        ),
      ]);
    };
  },
});

const USelectMenuStub = defineComponent({
  name: "USelectMenu",
  props: {
    modelValue: { type: [String, Number, Object], default: undefined },
    items: { type: Array, default: () => [] },
    valueKey: { type: String, default: "value" },
    labelKey: { type: String, default: "label" },
    placeholder: { type: String, default: "" },
    clear: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
  },
  emits: ["update:modelValue", "update:model-value", "clear", "create"],
  setup(props, { emit }) {
    const getValue = (item: unknown) => {
      if (item && typeof item === "object" && props.valueKey in item) {
        return (item as Record<string, unknown>)[props.valueKey];
      }

      return item;
    };

    const getLabel = (item: unknown) => {
      if (item && typeof item === "object" && props.labelKey in item) {
        return String((item as Record<string, unknown>)[props.labelKey] ?? "");
      }

      return String(item ?? "");
    };

    return () =>
      h("div", { "data-testid": "u-select-menu" }, [
        h(
          "select",
          {
            value: props.modelValue == null ? "" : String(props.modelValue),
            onChange: (event: Event) => {
              const target = event.target as HTMLSelectElement;
              emit("update:modelValue", target.value);
              emit("update:model-value", target.value);
            },
          },
          [
            h("option", { value: "" }, props.placeholder),
            ...(props.items as unknown[]).map((item) =>
              h(
                "option",
                { value: String(getValue(item) ?? "") },
                getLabel(item),
              ),
            ),
          ],
        ),
        props.clear
          ? h(
              "button",
              {
                type: "button",
                "data-testid": "u-select-clear",
                onClick: () => emit("clear"),
              },
              "clear",
            )
          : null,
      ]);
  },
});

const UButtonStub = defineComponent({
  name: "UButton",
  setup(_props, { attrs, slots }) {
    return () => h("button", attrs, slots.default?.());
  },
});

const UInputStub = defineComponent({
  name: "UInput",
  props: {
    modelValue: { type: String, default: "" },
    type: { type: String, default: "text" },
    placeholder: { type: String, default: "" },
  },
  emits: ["update:modelValue", "input"],
  setup(props, { attrs, emit }) {
    return () =>
      h("input", {
        ...attrs,
        type: props.type,
        placeholder: props.placeholder,
        value: props.modelValue,
        onInput: (event: Event) => {
          const target = event.target as HTMLInputElement;
          emit("update:modelValue", target.value);
          emit("input", event);
        },
      });
  },
});

const UiUserRoleSelectStub = defineComponent({
  name: "UiUserRoleSelect",
  props: {
    modelValue: { type: String, default: "" },
  },
  emits: ["update:modelValue"],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        "select",
        {
          ...attrs,
          value: props.modelValue,
          onChange: (event: Event) => {
            const target = event.target as HTMLSelectElement;
            emit("update:modelValue", target.value);
          },
        },
        [
          h("option", { value: "" }, "Todos"),
          h("option", { value: "PLAYER" }, "Player"),
          h("option", { value: "DT" }, "DT"),
          h("option", { value: "EDITOR" }, "Editor"),
          h("option", { value: "ADMIN" }, "Admin"),
        ],
      );
  },
});

config.global.components = {
  UTable: UTableStub,
  USelectMenu: USelectMenuStub,
  UButton: UButtonStub,
  UInput: UInputStub,
  UiUserRoleSelect: UiUserRoleSelectStub,
  UiPositionLabel: UiPositionLabelStub,
};
