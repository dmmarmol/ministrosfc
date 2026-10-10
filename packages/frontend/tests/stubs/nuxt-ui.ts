import { defineComponent, h } from "vue";

export const UModalStub = defineComponent({
  name: "UModal",
  props: {
    open: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:open"],
  setup(props, { slots, emit }) {
    const isOpen = () => props.open;
    const close = () => {
      emit("update:open", false);
    };

    return () =>
      isOpen()
        ? h("div", { "data-testid": "u-modal", role: "dialog" }, [
            h("button", {
              "data-testid": "u-modal-backdrop",
              onClick: close,
            }),
            slots.content?.({ close }),
          ])
        : null;
  },
});
