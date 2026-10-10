import type { TableColumn } from "#ui/types";

export type ColumnDef<TData = Record<string, unknown>> = TableColumn<TData> & {
  /** Full label rendered as a native title attribute for browser tooltips. */
  title?: string;
  /** Local sort flag used by UiStatsTable sort toggling. */
  sortable?: boolean;
};
