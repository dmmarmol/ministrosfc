import { defineComponent, h, ref, type PropType, type VNode } from "vue";
import {
  NuxtLink,
  UButton,
  UDropdownMenu,
  UiPositionLabel,
  UiPositionNumber,
  UInput,
} from "#components";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import type { ArrayOrNested } from "#ui/types/utils";
import {
  positionOrderMap,
  type PlayerType,
  type Position,
} from "@ministrosfc/shared";
import type { ButtonProps as UButtonProps } from "@nuxt/ui";

export function getSortedIcon(sortDirection: "asc" | "desc" | null): string {
  if (sortDirection === "asc") {
    return "i-lucide-arrow-up-narrow-wide";
  }
  if (sortDirection === "desc") {
    return "i-lucide-arrow-down-wide-narrow";
  }

  return "i-lucide-arrow-up-down";
}

export function sortableHeader(label: string): ({ column }: any) => VNode {
  return ({ column }: any) =>
    h(UButton, {
      variant: "ghost",
      color: "neutral",
      label,
      icon: getSortedIcon(column.getIsSorted() || null),
      onClick: () => column.toggleSorting(),
    });
}

export function sortByPositionEnumOrder(
  rowA: any,
  rowB: any,
  columnId: string,
): number {
  const a = rowA.getValue(columnId) as Position | null | undefined;
  const b = rowB.getValue(columnId) as Position | null | undefined;

  const aRank =
    a != null
      ? (positionOrderMap[a] ?? Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER;
  const bRank =
    b != null
      ? (positionOrderMap[b] ?? Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER;

  return aRank - bRank;
}

// ── Shared cell render factories ──────────────────────────────────────────────

/** Name: dark gray text */
export function cellName(value: string, opts?: { class?: string }): VNode {
  return h(
    "span",
    { class: [opts?.class ? opts.class : "text-gray-700"] },
    String(value),
  );
}

/** Wins: green text */
export function cellWins(value: number): VNode {
  return h("span", { class: "text-green-600" }, String(value));
}

/** Losses: red text */
export function cellLosses(value: number): VNode {
  return h("span", { class: "text-red-500" }, String(value));
}

/** Draws: yellow text */
export function cellDraws(value: number): VNode {
  return h("span", { class: "text-yellow-500" }, String(value));
}

/** Goal difference: coloured +/- prefix */
export function cellGoalDiff(value: number): VNode {
  const cls = value > 0 ? "text-green-600" : value < 0 ? "text-red-500" : "";
  const text = (value > 0 ? "+" : "") + value;
  return h("span", { class: cls }, text);
}

/** Percentage with one decimal and % suffix, e.g. winRate, participationRate */
export function cellPercent(value: number | null | undefined): VNode {
  return h("span", {}, value == null ? "—" : value.toFixed(1) + "%");
}

/** Rate with two decimals, e.g. goalRate, goalRateFor */
export function cellRate(value: number | null | undefined): VNode {
  return h("span", {}, value == null ? "—" : value.toFixed(2));
}

/** Cell with truncated text */
export function cellTruncated(
  value: string | null | undefined,
  maxLength: number = 10,
): VNode {
  const text =
    value == null
      ? "—"
      : value.length > maxLength
        ? value.slice(0, maxLength) + "…"
        : value;
  return h("span", {}, text);
}

export interface PlayerLinkRow {
  playerId: string;
  name: string;
  [key: string]: unknown;
}

/** Player name as a NuxtLink, with optional nickname. Row must have `playerId` and `name`. */
export function cellPlayerLink(
  row: PlayerLinkRow,
  opts?: { nicknameKey?: string },
): VNode {
  const nickname = opts?.nicknameKey
    ? (row[opts.nicknameKey] as string | null | undefined)
    : undefined;

  const link = row.playerId
    ? cellLink(row.name, `/players/${row.playerId}`)
    : h("span", {}, row.name);

  if (!nickname) return link;

  return h("div", { class: "flex gap-x-2 items-baseline" }, [
    link,
    h("span", { class: "text-sm text-gray-400 italic" }, nickname),
  ]);
}

/** Generic link cell. */
export function cellLink(value: string, to: string): VNode {
  return h(
    NuxtLink,
    { class: "font-bold hover:text-brand transition-colors", to },
    () => value,
  );
}

type CellActionProp = {
  items: ArrayOrNested<DropdownMenuItem>;
  onClick?: (event: Event) => void;
};
/** Vertical three dots cell, typically used for actions menu */
export function cellActions(props: CellActionProp): VNode {
  const { items, onClick } = props;
  return h(
    UDropdownMenu,
    {
      content: {
        align: "end",
      },
      items,
      "aria-label": "Actions dropdown",
      onClick,
    },
    () =>
      h(UButton, {
        icon: "i-lucide-ellipsis-vertical",
        color: "neutral",
        variant: "ghost",
        "aria-label": "Actions dropdown",
      }),
  );
}

/** Jersey Number cell */
export function cellJerseyNumber(values: {
  jerseyNumber: number | null | undefined;
  isGuest: boolean;
}): VNode {
  return h(UiPositionNumber, {
    jerseyNumber: values.jerseyNumber ?? null,
    isGuest: values.isGuest,
    isJersey: true,
  });
}

/** Player position cell */
export function cellPosition(value: Position): VNode {
  return h(UiPositionLabel, {
    position: value,
  });
}

type CellButtonProps = UButtonProps & {
  "data-testid"?: string;
  title?: string;
};
export function cellButton(label: string, props: CellButtonProps): VNode {
  return h(UButton, props, () => label);
}

function getVNodeText(
  vnode: VNode | string | number | null | undefined,
): string {
  if (vnode == null) return "";
  if (typeof vnode === "string" || typeof vnode === "number")
    return String(vnode);

  if (Array.isArray(vnode.children)) {
    return vnode.children.map((child) => getVNodeText(child as VNode)).join("");
  }

  if (typeof vnode.children === "string") return vnode.children;

  return "";
}

export function cellClickeableInput(
  cellNode: VNode,
  onChange?: (value: string) => void,
): VNode {
  const EditableCell = defineComponent({
    name: "EditableCell",
    props: {
      cellNode: {
        type: Object as PropType<VNode>,
        required: true,
      },
      onChange: {
        type: Function as PropType<(value: string) => void>,
        required: false,
        default: undefined,
      },
    },
    setup(props) {
      const isEditing = ref(false);
      const inputValue = ref(getVNodeText(props.cellNode));

      const resetInput = () => {
        inputValue.value = getVNodeText(props.cellNode);
      };

      const handleKeydown = (event: KeyboardEvent) => {
        if (event.key !== "Enter") return;

        const nextValue = String(inputValue.value ?? "");
        props.onChange?.(nextValue);
        isEditing.value = false;
      };

      return () =>
        isEditing.value
          ? h(resolveComponent("UInput"), {
              modelValue: inputValue.value,
              class: "editable-cell",
              autofocus: true,
              "onUpdate:modelValue": (value: string | number | undefined) => {
                inputValue.value = String(value ?? "");
              },
              onKeydown: handleKeydown,
              onBlur: () => {
                resetInput();
                isEditing.value = false;
              },
            })
          : h(
              "div",
              {
                class: "editable-cell cursor-pointer",
                onClick: () => {
                  resetInput();
                  isEditing.value = true;
                },
              },
              [props.cellNode],
            );
    },
  });

  return h(EditableCell, { cellNode, onChange });
}
