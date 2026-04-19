<script lang="ts">
// NOTE: This component uses `defineComponent` with a `setup()` that returns a
// render function — this IS the Vue 3 Composition API. It is NOT the Options
// API (which uses `data()`, `methods: {}`, `computed: {}`, etc.).
//
// `<script setup>` cannot be used here because it requires a <template> block.
// A render function is necessary because Vue 3 templates cannot dynamically
// generate named slots (`#<key>-header`) from a runtime array — the slot names
// must be statically known at compile time. Only render functions (`h()`) can
// build named slots programmatically at runtime.
import { defineComponent, h, resolveComponent, type PropType } from "vue";
import type { ColumnDef } from "~/types/table";

/**
 * Generic nuxt/ui UTable wrapper.
 *
 * Accepts `ColumnDef[]` + rows, maps them to UTable's expected format, and
 * dynamically injects per-column `#<key>-header` slots for columns that carry
 * a `title` or are `sortable`. Default `#loading-state` (skeleton) and
 * `#empty-state` ("Sin datos") slots are provided and can be overridden by
 * the parent. All other slots (data-cell customisations) are forwarded as-is.
 *
 * Emits `sort(key: string)` when a sortable column header is clicked so that
 * a parent component (e.g. <UiStatsTable>) can own the sort state.
 */
export default defineComponent({
  name: "UiTable",
  inheritAttrs: false,

  props: {
    columns: {
      type: Array as PropType<ColumnDef[]>,
      required: true,
    },
    rows: {
      type: Array as PropType<Record<string, unknown>[]>,
      required: true,
    },
    /** Key of the currently sorted column, or null when unsorted. */
    sortKey: {
      type: String as PropType<string | null>,
      default: null,
    },
    /** Direction of the current sort. */
    sortDir: {
      type: String as PropType<"asc" | "desc">,
      default: "asc",
    },
  },

  emits: ["sort"],

  setup(props, { slots, attrs, emit }) {
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const UTable = resolveComponent("UTable") as any;

      // UTable column config — built-in sort is disabled; we handle it ourselves
      const uTableColumns = props.columns.map((col) => ({
        key: col.key,
        label: col.label,
        sortable: false,
      }));

      // ── Default loading skeleton ────────────────────────────────────────────
      const defaultLoadingState = () =>
        h(
          "div",
          { class: "space-y-2 p-2" },
          Array.from({ length: 5 }, (_, i) =>
            h("div", {
              key: i,
              class: "h-8 bg-gray-100 rounded animate-pulse",
            }),
          ),
        );

      // ── Default empty state ─────────────────────────────────────────────────
      const defaultEmptyState = () =>
        h("div", { class: "text-center text-gray-400 py-8" }, "Sin datos");

      // ── Per-column header slot injection ────────────────────────────────────
      // Inject header slots for columns that need a title attribute or a
      // sort click handler.  These override any header slot the parent may
      // have provided for the same key (parent data-cell slots are unaffected).
      const injectedHeaderSlots: Record<string, () => ReturnType<typeof h>> =
        {};

      for (const col of props.columns) {
        if (!col.title && !col.sortable) continue;

        const isSorted = props.sortKey === col.key;
        const titleAttr = col.title ? { title: col.title } : {};

        if (col.sortable) {
          injectedHeaderSlots[`${col.key}-header`] = () =>
            h(
              "button",
              {
                type: "button",
                ...titleAttr,
                class: [
                  "inline-flex items-center gap-0.5",
                  "font-semibold text-xs uppercase tracking-wider",
                  "cursor-pointer select-none",
                  "hover:text-gray-700 focus:outline-none",
                ],
                onClick: () => emit("sort", col.key),
              },
              [
                col.label,
                isSorted
                  ? h(
                      "span",
                      { "aria-hidden": "true", class: "text-[10px]" },
                      props.sortDir === "asc" ? " ↑" : " ↓",
                    )
                  : null,
              ],
            );
        } else {
          // Non-sortable column with a title — wrap in a plain span
          injectedHeaderSlots[`${col.key}-header`] = () =>
            h("span", titleAttr, col.label);
        }
      }

      // Merge priority (last writer wins):
      //   1. built-in defaults  (loading-state, empty-state)
      //   2. parent-forwarded slots  (consumer can override defaults or add cell slots)
      //   3. injected header slots   (always win so title/sort UI is never lost)
      const allSlots = {
        "loading-state": defaultLoadingState,
        "empty-state": defaultEmptyState,
        ...slots,
        ...injectedHeaderSlots,
      };

      return h(
        UTable,
        {
          columns: uTableColumns,
          rows: props.rows,
          ui: { base: "min-w-full w-full table-auto" },
          ...attrs,
        },
        allSlots,
      );
    };
  },
});
</script>
