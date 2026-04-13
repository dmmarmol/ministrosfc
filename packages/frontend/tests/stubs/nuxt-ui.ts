import { defineComponent, h } from "vue";

export const UModalStub = defineComponent({
  name: "UModal",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    open: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:open", "update:modelValue"],
  setup(props, { slots, emit }) {
    const isOpen = () => props.open || props.modelValue;
    const close = () => {
      emit("update:open", false);
      emit("update:modelValue", false);
    };

    return () =>
      isOpen()
        ? h("div", { "data-testid": "u-modal", role: "dialog" }, [
            h("button", {
              "data-testid": "u-modal-backdrop",
              onClick: close,
            }),
            slots.content?.({ close }) ?? slots.default?.(),
          ])
        : null;
  },
});
