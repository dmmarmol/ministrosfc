import type { TableColumn } from "#ui/types";
import type {
  ColumnSort as NuxtUiColumnSort,
  ColumnPinningState as NuxtUiColumnPin,
} from "@tanstack/table-core";

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
