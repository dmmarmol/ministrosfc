import type { TableColumn } from "@nuxt/ui/runtime/components/Table.vue.js";
import type {
  ColumnSort as NuxtUiColumnSort,
  ColumnPinningState as NuxtUiColumnPin,
  Column as NuxtUiColumn,
  HeaderContext as NuxtUiHeaderContext,
} from "@tanstack/table-core";

export type Column<
  TData = Record<string, unknown>,
  TValue = Record<string, unknown>,
> = NuxtUiHeaderContext<TData, TValue>;

export type ColumnDef<TData = Record<string, unknown>> = TableColumn<TData> & {
  /** Full label rendered as a native title attribute for browser tooltips. */
  title?: string;
  /** Local sort flag used by UiStatsTable sort toggling. */
  sortable?: boolean;
};

export type ColumnSort<Id = string> = Omit<NuxtUiColumnSort, "id"> & { id: Id };
export type ColumnPin<Keys = string[]> = Omit<
  NuxtUiColumnPin,
  "left" | "right"
> & { left?: Keys; right?: Keys };
