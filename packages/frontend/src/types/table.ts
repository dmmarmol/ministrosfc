export interface ColumnDef {
  key: string;
  sortable?: boolean;
  /** Abbreviated label shown in the column header (e.g. "PJ"). */
  label: string;
  /** Full label rendered as a native `title` attribute for browser tooltips (e.g. "Partidos Jugados"). */
  title?: string;
}
